import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, FindOptionsWhere, Between } from 'typeorm';
import { SystemMetric } from './entities/system-metric.entity';
import { RequestLog } from './entities/request-log.entity';
import { AuditLog } from './entities/audit-log.entity';
import {
  CollectedSnapshot,
  MetricsCollectorService,
} from './metrics-collector.service';

export type ActiveUsersWindowKey = '5m' | '15m' | '1h' | '24h';

export interface ActiveUsersWindow {
  authedTotal: number;
  byRole: { admin: number; store_owner: number; customer: number; other: number };
  anonymousIps: number;
  requestCount: number;
}

export interface ActiveUsersResponse {
  windows: Record<ActiveUsersWindowKey, ActiveUsersWindow>;
  hourlySeries: Array<{ hour: string; authed: number; anonIps: number }>;
}

export interface OverviewResponse {
  latest: CollectedSnapshot | null;
  series: Array<{
    ts: string;
    requestsTotal: number;
    errorsTotal: number;
    avgLatencyMs: number | null;
    p95LatencyMs: number | null;
    memRssMb: number;
    eventLoopLagMs: number;
  }>;
  topRoutes: Array<{
    route: string;
    method: string;
    count: number;
    avgDurationMs: number;
    errorCount: number;
  }>;
  recentErrors: Array<{
    id: string;
    ts: string;
    method: string;
    route: string;
    statusCode: number;
    errorCode: string | null;
    errorMessage: string | null;
    durationMs: number;
  }>;
}

@Injectable()
export class MonitoringQueryService {
  constructor(
    @InjectRepository(SystemMetric)
    private readonly metricRepo: Repository<SystemMetric>,
    @InjectRepository(RequestLog)
    private readonly requestRepo: Repository<RequestLog>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    private readonly collector: MetricsCollectorService,
  ) {}

  async getOverview(rangeMinutes: number): Promise<OverviewResponse> {
    const since = new Date(Date.now() - rangeMinutes * 60_000);

    const metrics = await this.metricRepo.find({
      where: { ts: MoreThanOrEqual(since) },
      order: { ts: 'ASC' },
      take: 720,
    });

    const series = metrics.map((m) => ({
      ts: m.ts.toISOString(),
      requestsTotal: m.requestsTotal,
      errorsTotal: m.errorsTotal,
      avgLatencyMs: m.avgLatencyMs != null ? Number(m.avgLatencyMs) : null,
      p95LatencyMs: m.p95LatencyMs != null ? Number(m.p95LatencyMs) : null,
      memRssMb: Number(m.memRss) / 1024 / 1024,
      eventLoopLagMs: Number(m.eventLoopLagMs),
    }));

    const topRouteRows = await this.requestRepo
      .createQueryBuilder('r')
      .select('r.route', 'route')
      .addSelect('r.method', 'method')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(r.duration_ms)', 'avgDurationMs')
      .addSelect(
        'SUM(CASE WHEN r.status_code >= 500 THEN 1 ELSE 0 END)',
        'errorCount',
      )
      .where('r.ts >= :since', { since })
      .groupBy('r.route')
      .addGroupBy('r.method')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany<{
        route: string;
        method: string;
        count: string;
        avgDurationMs: string;
        errorCount: string;
      }>();

    const topRoutes = topRouteRows.map((r) => ({
      route: r.route,
      method: r.method,
      count: Number(r.count),
      avgDurationMs: Number(Number(r.avgDurationMs).toFixed(1)),
      errorCount: Number(r.errorCount),
    }));

    const recentErrorRows = await this.requestRepo
      .createQueryBuilder('r')
      .where('r.status_code >= 400')
      .andWhere('r.ts >= :since', { since })
      .orderBy('r.ts', 'DESC')
      .limit(20)
      .getMany();

    const recentErrors = recentErrorRows.map((r) => ({
      id: r.id,
      ts: r.ts.toISOString(),
      method: r.method,
      route: r.route,
      statusCode: r.statusCode,
      errorCode: r.errorCode,
      errorMessage: r.errorMessage,
      durationMs: r.durationMs,
    }));

    return {
      latest: this.collector.getLatest(),
      series,
      topRoutes,
      recentErrors,
    };
  }

  async getActiveUsers(): Promise<ActiveUsersResponse> {
    const windows: Array<{ key: ActiveUsersWindowKey; minutes: number }> = [
      { key: '5m', minutes: 5 },
      { key: '15m', minutes: 15 },
      { key: '1h', minutes: 60 },
      { key: '24h', minutes: 60 * 24 },
    ];

    const result = {} as Record<ActiveUsersWindowKey, ActiveUsersWindow>;
    await Promise.all(
      windows.map(async ({ key, minutes }) => {
        result[key] = await this.computeActiveUsersWindow(minutes);
      }),
    );

    const hourlyRows = await this.requestRepo
      .createQueryBuilder('r')
      .select(`date_trunc('hour', r.ts)`, 'hour')
      .addSelect('COUNT(DISTINCT r.userId)', 'authed')
      .addSelect(
        'COUNT(DISTINCT CASE WHEN r.userId IS NULL THEN r.ip END)',
        'anonIps',
      )
      .where(`r.ts >= now() - interval '24 hours'`)
      .groupBy('hour')
      .orderBy('hour', 'ASC')
      .getRawMany<{ hour: string; authed: string; anonIps: string }>();

    const hourlySeries = hourlyRows.map((row) => ({
      hour: new Date(row.hour).toISOString(),
      authed: Number(row.authed),
      anonIps: Number(row.anonIps),
    }));

    return { windows: result, hourlySeries };
  }

  private async computeActiveUsersWindow(
    minutes: number,
  ): Promise<ActiveUsersWindow> {
    const since = new Date(Date.now() - minutes * 60_000);

    const roleRows = await this.requestRepo
      .createQueryBuilder('r')
      .select('r.userRole', 'role')
      .addSelect('COUNT(DISTINCT r.userId)', 'count')
      .where('r.ts >= :since', { since })
      .andWhere('r.userId IS NOT NULL')
      .groupBy('r.userRole')
      .getRawMany<{ role: string | null; count: string }>();

    const byRole = { admin: 0, store_owner: 0, customer: 0, other: 0 };
    let authedTotal = 0;
    for (const row of roleRows) {
      const n = Number(row.count);
      authedTotal += n;
      const key = (row.role ?? 'other') as keyof typeof byRole;
      if (key in byRole) byRole[key] += n;
      else byRole.other += n;
    }

    const anonRow = await this.requestRepo
      .createQueryBuilder('r')
      .select('COUNT(DISTINCT r.ip)', 'count')
      .addSelect('COUNT(*)', 'requests')
      .where('r.ts >= :since', { since })
      .andWhere('r.user_id IS NULL')
      .getRawOne<{ count: string; requests: string }>();

    const totalReqRow = await this.requestRepo
      .createQueryBuilder('r')
      .select('COUNT(*)', 'count')
      .where('r.ts >= :since', { since })
      .getRawOne<{ count: string }>();

    return {
      authedTotal,
      byRole,
      anonymousIps: anonRow ? Number(anonRow.count) : 0,
      requestCount: totalReqRow ? Number(totalReqRow.count) : 0,
    };
  }

  async getAuditLogs(params: {
    page: number;
    limit: number;
    actorRole?: string;
    action?: string;
    resourceType?: string;
    actorId?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<{
    items: Array<{
      id: string;
      ts: string;
      actorId: string | null;
      actorRole: string;
      actorName: string | null;
      action: string;
      resourceType: string | null;
      resourceId: string | null;
      ip: string | null;
      metadata: Record<string, unknown> | null;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    const where: FindOptionsWhere<AuditLog> = {};
    if (params.actorRole) where.actorRole = params.actorRole as never;
    if (params.action) where.action = params.action;
    if (params.resourceType) where.resourceType = params.resourceType;
    if (params.actorId) where.actorId = params.actorId;
    if (params.fromDate && params.toDate) {
      where.ts = Between(params.fromDate, params.toDate);
    } else if (params.fromDate) {
      where.ts = MoreThanOrEqual(params.fromDate);
    }

    const [rows, total] = await this.auditRepo.findAndCount({
      where,
      order: { ts: 'DESC' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });

    return {
      items: rows.map((r) => ({
        id: r.id,
        ts: r.ts.toISOString(),
        actorId: r.actorId,
        actorRole: r.actorRole,
        actorName: r.actorName,
        action: r.action,
        resourceType: r.resourceType,
        resourceId: r.resourceId,
        ip: r.ip,
        metadata: r.metadata,
      })),
      total,
      page: params.page,
      limit: params.limit,
    };
  }
}
