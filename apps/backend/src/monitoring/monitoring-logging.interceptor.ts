import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { RequestLogBuffer } from './request-log-buffer.service';
import { MetricsAggregator } from './metrics-aggregator.service';
import { SKIP_LOG_PREFIXES } from './monitoring.constants';

@Injectable()
export class MonitoringLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(
    private readonly buffer: RequestLogBuffer,
    private readonly aggregator: MetricsAggregator,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<Request>();
    const res = httpCtx.getResponse<Response>();
    const start = process.hrtime.bigint();

    const url = req.originalUrl || req.url || '';
    if (SKIP_LOG_PREFIXES.some((p) => url.startsWith(p))) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: () => this.record(req, res, start, null),
        error: (err: unknown) => this.record(req, res, start, err),
      }),
    );
  }

  private record(
    req: Request,
    res: Response,
    start: bigint,
    err: unknown,
  ): void {
    const durationMs = Number((process.hrtime.bigint() - start) / 1_000_000n);
    const errAsAny = err as { status?: number; getStatus?: () => number; message?: string; code?: string } | null;
    const statusCode = err
      ? errAsAny?.status ?? errAsAny?.getStatus?.() ?? 500
      : res.statusCode;

    this.aggregator.record({ durationMs, statusCode });

    const route = this.resolveRoute(req);
    const user = (req as Request & { user?: { id?: string; role?: string } }).user;
    const userRole = user?.role ?? this.inferRole(req);

    this.buffer.push({
      method: req.method,
      route,
      statusCode,
      durationMs,
      userId: user?.id ?? null,
      userRole,
      ip: this.resolveIp(req),
      userAgent: this.truncate(req.headers['user-agent'] as string | undefined, 500),
      errorCode: err ? errAsAny?.code ?? null : null,
      errorMessage: err
        ? this.truncate(errAsAny?.message ?? String(err), 1000)
        : null,
    });
  }

  private resolveRoute(req: Request): string {
    const handler = (req as Request & { route?: { path?: string } }).route?.path;
    if (handler) {
      const baseUrl = req.baseUrl || '';
      return this.truncate(`${baseUrl}${handler}`, 255);
    }
    const url = req.originalUrl || req.url || '';
    const path = url.split('?')[0];
    return this.truncate(path, 255);
  }

  private inferRole(req: Request): string | null {
    const url = req.originalUrl || req.url || '';
    if (url.startsWith('/api/admin/')) return 'admin';
    if (url.startsWith('/api/store-owner/') || url.includes('/auth/store-owner'))
      return 'store_owner';
    if (url.startsWith('/api/customer/') || url.includes('/auth/google'))
      return 'customer';
    return null;
  }

  private resolveIp(req: Request): string | null {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.length > 0) return xff.split(',')[0].trim();
    if (Array.isArray(xff) && xff.length > 0) return xff[0];
    return req.ip || req.socket?.remoteAddress || null;
  }

  private truncate(value: string | undefined | null, max: number): string | null {
    if (!value) return null;
    return value.length > max ? value.slice(0, max) : value;
  }
}
