/**
 * Monitoring seed — 24h of synthetic system_metrics, request_logs, audit_logs
 * so the /admin/monitoring dashboard has data to show on a fresh dev start.
 *
 * Idempotent: skips if data younger than 12h already exists in system_metrics.
 *   Re-seed by TRUNCATE-ing the 3 tables, e.g.:
 *     psql $DATABASE_URL -c "TRUNCATE system_metrics, request_logs, audit_logs"
 *
 * Run standalone: npm run seed:monitoring -w @seminar/backend
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { SystemMetric } from '../../monitoring/entities/system-metric.entity';
import { RequestLog } from '../../monitoring/entities/request-log.entity';
import { AuditLog } from '../../monitoring/entities/audit-log.entity';

const HOURS = 24;
const SAMPLES_PER_HOUR = 120; // 30s cadence
const TOTAL_SAMPLES = HOURS * SAMPLES_PER_HOUR;

const ROUTES_PUBLIC = [
  { method: 'GET', route: '/api/public/stores', weight: 30 },
  { method: 'GET', route: '/api/public/stores/:id', weight: 22 },
  { method: 'GET', route: '/api/map/boundaries', weight: 12 },
  { method: 'GET', route: '/api/map/pins', weight: 18 },
  { method: 'GET', route: '/api/recommendations', weight: 8 },
  { method: 'GET', route: '/api/health', weight: 0 }, // skipped by interceptor anyway
  { method: 'POST', route: '/api/auth/google', weight: 5 },
  { method: 'GET', route: '/api/tags', weight: 5 },
];
const ROUTES_CUSTOMER = [
  { method: 'POST', route: '/api/customer/reviews', weight: 6 },
  { method: 'GET', route: '/api/customer/reviews', weight: 8 },
  { method: 'POST', route: '/api/customer/reports', weight: 1 },
];
const ROUTES_OWNER = [
  { method: 'GET', route: '/api/store-owner/stores', weight: 10 },
  { method: 'PATCH', route: '/api/store-owner/stores/:id', weight: 4 },
  { method: 'POST', route: '/api/store-owner/stores/:id/drafts', weight: 2 },
  { method: 'GET', route: '/api/store-owner/notifications', weight: 6 },
];
const ROUTES_ADMIN = [
  { method: 'GET', route: '/api/admin/overview', weight: 8 },
  { method: 'GET', route: '/api/admin/stores', weight: 6 },
  { method: 'GET', route: '/api/admin/store-owners', weight: 4 },
  { method: 'GET', route: '/api/admin/reports', weight: 5 },
  { method: 'GET', route: '/api/admin/reviews', weight: 3 },
  { method: 'PATCH', route: '/api/admin/reports/:id/resolve', weight: 1 },
  { method: 'PATCH', route: '/api/admin/reviews/:id/hide', weight: 1 },
  { method: 'GET', route: '/api/admin/monitoring/overview', weight: 5 },
];

const ERROR_MESSAGES = [
  { code: 'NOT_FOUND', message: 'Resource not found', status: 404 },
  { code: 'UNAUTHORIZED', message: 'Missing or invalid token', status: 401 },
  { code: 'VALIDATION_FAILED', message: 'Validation failed: stars must be 1..5', status: 400 },
  { code: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded', status: 429 },
  { code: 'CONFLICT', message: 'Resource state conflict', status: 409 },
  { code: 'INTERNAL_ERROR', message: 'Database connection timeout', status: 500 },
  { code: 'INTERNAL_ERROR', message: 'Failed to enqueue commentary job', status: 500 },
];

const USER_AGENTS = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15',
  'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 Chrome/124.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0',
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/124.0',
];

interface FakeUser {
  id: string;
  role: 'admin' | 'store_owner' | 'customer';
  name: string;
}

const ADMIN_NAMES = ['System Admin', 'Trần Quản Trị'];
const OWNER_NAMES = [
  'Nguyễn Văn An',
  'Trần Thị Bình',
  'Lê Minh Châu',
  'Phạm Thị Dung',
  'Võ Văn Em',
];
const CUSTOMER_NAMES = [
  'Hoàng Lan', 'Đỗ Bảo', 'Bùi Quân', 'Lý Hoa', 'Đặng Tú',
  'Cao Linh', 'Phan Khánh', 'Lưu Hà', 'Mai Tuấn', 'Tô Yến',
  'Vũ Đức', 'Hà Trang', 'Trịnh Khoa', 'Châu Mai', 'Ngô Vy',
  'Nguyễn Hùng', 'Phạm Loan', 'Trần Tâm', 'Hồ Sơn', 'Lê Phương',
  'Trương Bích', 'Đinh Hải', 'Lương Vũ', 'Tạ Hằng', 'Bạch Sang',
];

function pickWeighted<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, it) => s + it.weight, 0);
  let r = Math.random() * total;
  for (const it of items) {
    r -= it.weight;
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randIp(): string {
  return `${randInt(14, 222)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`;
}

// Diurnal pattern — multiplier per hour-of-day (0..23) for traffic volume.
// Vietnamese mealtimes peak: 11–13h and 18–21h.
const TRAFFIC_BY_HOUR = [
  0.2, 0.1, 0.08, 0.08, 0.1, 0.2, 0.4, 0.6,
  0.8, 0.7, 0.7, 1.0, 1.4, 1.2, 0.7, 0.6,
  0.7, 0.9, 1.5, 1.6, 1.3, 0.9, 0.6, 0.4,
];

function generateUsers(): { admins: FakeUser[]; owners: FakeUser[]; customers: FakeUser[] } {
  return {
    admins: ADMIN_NAMES.map((name) => ({ id: randomUUID(), role: 'admin' as const, name })),
    owners: OWNER_NAMES.map((name) => ({ id: randomUUID(), role: 'store_owner' as const, name })),
    customers: CUSTOMER_NAMES.map((name) => ({ id: randomUUID(), role: 'customer' as const, name })),
  };
}

function buildSystemMetrics(now: Date): Array<Partial<SystemMetric>> {
  const rows: Array<Partial<SystemMetric>> = [];
  const startMs = now.getTime() - HOURS * 3600_000;
  // Persistent state for slow-moving values
  let memRssMb = 220;
  let heapUsedMb = 95;
  const heapTotalMb = 180;

  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const ts = new Date(startMs + i * 30_000);
    const hour = ts.getHours();
    const traffic = TRAFFIC_BY_HOUR[hour];

    // Memory drifts slowly with small noise
    memRssMb += (Math.random() - 0.5) * 4;
    memRssMb = Math.max(180, Math.min(380, memRssMb));
    heapUsedMb += (Math.random() - 0.5) * 3;
    heapUsedMb = Math.max(60, Math.min(140, heapUsedMb));

    // CPU/event-loop scales with traffic
    const cpuUserUs = Math.round((traffic * 200_000 + Math.random() * 80_000));
    const cpuSystemUs = Math.round((traffic * 60_000 + Math.random() * 30_000));
    const eventLoopLagMs = +(2 + traffic * 5 + Math.random() * 4).toFixed(3);

    // Requests per 30s window
    const reqBase = Math.round(traffic * 30 + Math.random() * 15);
    const requestsTotal = reqBase;
    // Errors = ~2-5% of requests
    const errorsTotal =
      requestsTotal > 0 ? Math.max(0, Math.floor(requestsTotal * (0.02 + Math.random() * 0.03))) : 0;

    const avgLatency = +(40 + traffic * 60 + Math.random() * 30).toFixed(3);
    const p95Latency = +(avgLatency * (1.8 + Math.random() * 0.4)).toFixed(3);

    rows.push({
      ts,
      memHeapUsed: String(Math.round(heapUsedMb * 1024 * 1024)),
      memHeapTotal: String(Math.round(heapTotalMb * 1024 * 1024)),
      memRss: String(Math.round(memRssMb * 1024 * 1024)),
      cpuUserUs: String(cpuUserUs),
      cpuSystemUs: String(cpuSystemUs),
      eventLoopLagMs: String(eventLoopLagMs),
      uptimeSec: 3600 * 24 + i * 30,
      loadAvg1: (+(0.3 + traffic * 0.6 + Math.random() * 0.2).toFixed(3)).toString(),
      requestsTotal,
      errorsTotal,
      avgLatencyMs: requestsTotal > 0 ? String(avgLatency) : null,
      p95LatencyMs: requestsTotal > 0 ? String(p95Latency) : null,
      queues: [
        {
          name: 'email',
          waiting: randInt(0, 3),
          active: randInt(0, 1),
          delayed: 0,
          failed: randInt(0, 2),
          completed: 100 + i * 2,
        },
        {
          name: 'commentary-pipeline',
          waiting: randInt(0, 2),
          active: randInt(0, 1),
          delayed: 0,
          failed: 0,
          completed: 30 + Math.floor(i / 4),
        },
        {
          name: 'store-translation-pipeline',
          waiting: 0,
          active: 0,
          delayed: 0,
          failed: 0,
          completed: 12 + Math.floor(i / 30),
        },
      ],
      pgPool: { total: 10, idle: randInt(6, 9), waiting: 0 },
    });
  }
  return rows;
}

function buildRequestLogs(now: Date, users: ReturnType<typeof generateUsers>): Array<Partial<RequestLog>> {
  const rows: Array<Partial<RequestLog>> = [];
  const startMs = now.getTime() - HOURS * 3600_000;
  // Stable IP pool for "anonymous" traffic so distinct-count is meaningful
  const anonIps = Array.from({ length: 90 }, () => randIp());

  for (let h = 0; h < HOURS; h++) {
    const traffic = TRAFFIC_BY_HOUR[new Date(startMs + h * 3600_000).getHours()];
    const reqCount = Math.round(traffic * 80 + Math.random() * 30);

    for (let r = 0; r < reqCount; r++) {
      const ts = new Date(startMs + h * 3600_000 + Math.random() * 3600_000);
      // 60% anonymous, 35% customer, 4% store_owner, 1% admin
      const roll = Math.random();
      let userId: string | null = null;
      let userRole: string | null = null;
      let actorName: string | null = null;
      let routes = ROUTES_PUBLIC;

      if (roll < 0.6) {
        userId = null;
        userRole = null;
        routes = ROUTES_PUBLIC;
      } else if (roll < 0.95) {
        const u = pickOne(users.customers);
        userId = u.id;
        userRole = 'customer';
        actorName = u.name;
        routes = [...ROUTES_PUBLIC, ...ROUTES_CUSTOMER];
      } else if (roll < 0.99) {
        const u = pickOne(users.owners);
        userId = u.id;
        userRole = 'store_owner';
        actorName = u.name;
        routes = ROUTES_OWNER;
      } else {
        const u = pickOne(users.admins);
        userId = u.id;
        userRole = 'admin';
        actorName = u.name;
        routes = ROUTES_ADMIN;
      }

      const route = pickWeighted(routes.filter((rt) => rt.weight > 0));
      const errorRoll = Math.random();
      let statusCode = 200;
      let errorCode: string | null = null;
      let errorMessage: string | null = null;
      if (errorRoll < 0.02) {
        const err = pickOne(ERROR_MESSAGES);
        statusCode = err.status;
        errorCode = err.code;
        errorMessage = err.message;
      } else if (errorRoll < 0.06) {
        const err = pickOne(ERROR_MESSAGES.filter((e) => e.status < 500));
        statusCode = err.status;
        errorCode = err.code;
        errorMessage = err.message;
      } else if (route.method === 'POST' || route.method === 'PATCH') {
        statusCode = 201;
      }

      const baseLatency = route.method === 'GET' ? 30 : 80;
      const durationMs = Math.max(
        2,
        Math.round(baseLatency + Math.random() * 200 + (statusCode >= 500 ? 1500 : 0)),
      );

      rows.push({
        ts,
        method: route.method,
        route: route.route,
        statusCode,
        durationMs,
        userId,
        userRole,
        ip: userId ? randIp() : pickOne(anonIps),
        userAgent: pickOne(USER_AGENTS),
        errorCode,
        errorMessage: errorMessage
          ? actorName
            ? `${errorMessage} (user: ${actorName})`
            : errorMessage
          : null,
      });
    }
  }
  rows.sort((a, b) => a.ts!.getTime() - b.ts!.getTime());
  return rows;
}

function buildAuditLogs(now: Date, users: ReturnType<typeof generateUsers>): Array<Partial<AuditLog>> {
  const rows: Array<Partial<AuditLog>> = [];
  const startMs = now.getTime() - HOURS * 3600_000;
  const sampleActions: Array<{ action: string; resourceType: string }> = [
    { action: 'review.hide', resourceType: 'review' },
    { action: 'review.unhide', resourceType: 'review' },
    { action: 'review.delete', resourceType: 'review' },
    { action: 'report.resolve.hide', resourceType: 'comment_report' },
    { action: 'report.resolve.delete', resourceType: 'comment_report' },
    { action: 'report.dismiss', resourceType: 'comment_report' },
    { action: 'store_owner.approve', resourceType: 'store_owner' },
    { action: 'store_owner.reject', resourceType: 'store_owner' },
    { action: 'store.update', resourceType: 'store' },
    { action: 'announcement.send', resourceType: 'admin_announcement' },
  ];

  const totalActions = 32;
  for (let i = 0; i < totalActions; i++) {
    const admin = pickOne(users.admins);
    const action = pickOne(sampleActions);
    const ts = new Date(startMs + Math.random() * HOURS * 3600_000);
    rows.push({
      ts,
      actorId: admin.id,
      actorRole: 'admin',
      actorName: admin.name,
      action: action.action,
      resourceType: action.resourceType,
      resourceId: randomUUID(),
      ip: randIp(),
      metadata: action.action.startsWith('report.resolve')
        ? { mode: action.action.endsWith('hide') ? 'hide' : 'delete' }
        : action.action === 'announcement.send'
          ? { recipientCount: randInt(3, 80) }
          : null,
    });
  }
  rows.sort((a, b) => a.ts!.getTime() - b.ts!.getTime());
  return rows;
}

async function chunkInsert<T extends ObjectLiteral>(
  repo: Repository<T>,
  rows: Array<Partial<T>>,
  size = 500,
): Promise<void> {
  for (let i = 0; i < rows.length; i += size) {
    await repo.insert(rows.slice(i, i + size) as T[]);
  }
}

export async function seedMonitoring(opts?: {
  metricRepo: Repository<SystemMetric>;
  requestRepo: Repository<RequestLog>;
  auditRepo: Repository<AuditLog>;
}): Promise<void> {
  const log = (msg: string) => console.log(`  ${msg}`);

  let metricRepo: Repository<SystemMetric>;
  let requestRepo: Repository<RequestLog>;
  let auditRepo: Repository<AuditLog>;
  let app: import('@nestjs/common').INestApplicationContext | null = null;

  if (opts) {
    metricRepo = opts.metricRepo;
    requestRepo = opts.requestRepo;
    auditRepo = opts.auditRepo;
  } else {
    app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn'],
    });
    metricRepo = app.get<Repository<SystemMetric>>(getRepositoryToken(SystemMetric));
    requestRepo = app.get<Repository<RequestLog>>(getRepositoryToken(RequestLog));
    auditRepo = app.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
  }

  // Idempotency: skip if recent metrics already exist
  const recentCount = await metricRepo
    .createQueryBuilder('m')
    .where(`m.ts >= now() - interval '12 hours'`)
    .getCount();
  if (recentCount > 0) {
    log(`⏭  Monitoring data already present (${recentCount} recent system_metrics rows), skipping`);
    if (app) await app.close();
    return;
  }

  const now = new Date();
  const users = generateUsers();

  log('Generating system_metrics (24h x 30s = 2880 rows)...');
  const metrics = buildSystemMetrics(now);
  await chunkInsert(metricRepo, metrics);
  log(`✓  ${metrics.length} system_metrics rows inserted`);

  log('Generating request_logs (24h diurnal traffic)...');
  const requests = buildRequestLogs(now, users);
  await chunkInsert(requestRepo, requests);
  log(`✓  ${requests.length} request_logs rows inserted`);

  log('Generating audit_logs (admin actions)...');
  const audits = buildAuditLogs(now, users);
  await chunkInsert(auditRepo, audits);
  log(`✓  ${audits.length} audit_logs rows inserted`);

  console.log(
    `  📊 Active users seeded: ${users.admins.length} admin, ${users.owners.length} store_owner, ${users.customers.length} customer (${requests.filter((r) => !r.userId).length} anonymous requests across multiple IPs)`,
  );

  if (app) await app.close();
}

// Standalone runner
if (require.main === module) {
  console.log('\n🌱 Seeding monitoring data...\n');
  seedMonitoring()
    .then(() => {
      console.log('\n✅ Monitoring seed complete!\n');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Monitoring seed failed:', err);
      process.exit(1);
    });
}
