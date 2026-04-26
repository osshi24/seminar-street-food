import apiClient from './client';

export interface QueueSnapshot {
  name: string;
  waiting: number;
  active: number;
  delayed: number;
  failed: number;
  completed: number;
}

export interface PgPoolSnapshot {
  total: number;
  idle: number;
  waiting: number;
}

export interface MetricsSnapshot {
  ts: string;
  memHeapUsed: number;
  memHeapTotal: number;
  memRss: number;
  cpuUserUs: number;
  cpuSystemUs: number;
  eventLoopLagMs: number;
  uptimeSec: number;
  loadAvg1: number | null;
  requestsTotal: number;
  errorsTotal: number;
  avgLatencyMs: number | null;
  p95LatencyMs: number | null;
  queues: QueueSnapshot[];
  pgPool: PgPoolSnapshot | null;
}

export interface SeriesPoint {
  ts: string;
  requestsTotal: number;
  errorsTotal: number;
  avgLatencyMs: number | null;
  p95LatencyMs: number | null;
  memRssMb: number;
  eventLoopLagMs: number;
}

export interface TopRoute {
  route: string;
  method: string;
  count: number;
  avgDurationMs: number;
  errorCount: number;
}

export interface RecentError {
  id: string;
  ts: string;
  method: string;
  route: string;
  statusCode: number;
  errorCode: string | null;
  errorMessage: string | null;
  durationMs: number;
}

export interface OverviewResponse {
  latest: MetricsSnapshot | null;
  series: SeriesPoint[];
  topRoutes: TopRoute[];
  recentErrors: RecentError[];
}

export interface AuditLogItem {
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
}

export interface AuditLogResponse {
  items: AuditLogItem[];
  total: number;
  page: number;
  limit: number;
}

export async function getMonitoringOverview(rangeMinutes = 60): Promise<OverviewResponse> {
  const res = await apiClient.get<{ data: OverviewResponse }>(
    `/admin/monitoring/overview`,
    { params: { rangeMinutes } },
  );
  return res.data.data;
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  actorRole?: string;
  action?: string;
  resourceType?: string;
  actorId?: string;
  fromDate?: string;
  toDate?: string;
}

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

export interface PresenceSnapshot {
  total: number;
  byRole: { admin: number; store_owner: number; customer: number; anonymous: number };
  uniqueUsers: number;
  publicVisitors: number;
  ts: string;
}

export async function getPresence(): Promise<PresenceSnapshot> {
  const res = await apiClient.get<{ data: PresenceSnapshot }>(
    `/admin/monitoring/presence`,
  );
  return res.data.data;
}

export async function getActiveUsers(): Promise<ActiveUsersResponse> {
  const res = await apiClient.get<{ data: ActiveUsersResponse }>(
    `/admin/monitoring/active-users`,
  );
  return res.data.data;
}

export async function getAuditLogs(params: AuditLogQueryParams = {}): Promise<AuditLogResponse> {
  const res = await apiClient.get<{ data: AuditLogResponse }>(
    `/admin/monitoring/audit-logs`,
    { params },
  );
  return res.data.data;
}
