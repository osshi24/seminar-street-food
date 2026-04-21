import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { monitorEventLoopDelay, IntervalHistogram } from 'perf_hooks';
import * as os from 'os';
import {
  PgPoolSnapshot,
  QueueSnapshot,
  SystemMetric,
} from './entities/system-metric.entity';
import { MetricsAggregator } from './metrics-aggregator.service';
import { COLLECT_INTERVAL_MS } from './monitoring.constants';

export interface CollectedSnapshot {
  ts: Date;
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

type SnapshotListener = (snapshot: CollectedSnapshot) => void;

@Injectable()
export class MetricsCollectorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetricsCollectorService.name);
  private timer: NodeJS.Timeout | null = null;
  private histogram: IntervalHistogram | null = null;
  private prevCpu: NodeJS.CpuUsage = process.cpuUsage();
  private listeners = new Set<SnapshotListener>();
  private latest: CollectedSnapshot | null = null;

  constructor(
    @InjectRepository(SystemMetric)
    private readonly repo: Repository<SystemMetric>,
    private readonly aggregator: MetricsAggregator,
    private readonly dataSource: DataSource,
    @InjectQueue('email') private readonly mailQueue: Queue,
    @InjectQueue('commentary-pipeline') private readonly commentaryQueue: Queue,
    @InjectQueue('store-translation-pipeline')
    private readonly translationQueue: Queue,
  ) {}

  onModuleInit(): void {
    this.histogram = monitorEventLoopDelay({ resolution: 20 });
    this.histogram.enable();
    this.timer = setInterval(() => {
      void this.collect();
    }, COLLECT_INTERVAL_MS);
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.histogram?.disable();
  }

  onSnapshot(listener: SnapshotListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getLatest(): CollectedSnapshot | null {
    return this.latest;
  }

  private async collect(): Promise<void> {
    try {
      const mem = process.memoryUsage();
      const cpu = process.cpuUsage(this.prevCpu);
      this.prevCpu = process.cpuUsage();

      let lagMs = 0;
      if (this.histogram) {
        lagMs = this.histogram.mean / 1e6;
        this.histogram.reset();
      }

      const window = this.aggregator.drain();
      const queues = await this.collectQueues();
      const pgPool = this.collectPgPool();

      const snapshot: CollectedSnapshot = {
        ts: new Date(),
        memHeapUsed: mem.heapUsed,
        memHeapTotal: mem.heapTotal,
        memRss: mem.rss,
        cpuUserUs: cpu.user,
        cpuSystemUs: cpu.system,
        eventLoopLagMs: Number(lagMs.toFixed(3)),
        uptimeSec: Math.round(process.uptime()),
        loadAvg1: os.loadavg()[0] ?? null,
        requestsTotal: window.total,
        errorsTotal: window.errors,
        avgLatencyMs: window.avgLatencyMs,
        p95LatencyMs: window.p95LatencyMs,
        queues,
        pgPool,
      };

      this.latest = snapshot;
      await this.persist(snapshot);
      for (const l of this.listeners) {
        try {
          l(snapshot);
        } catch (err) {
          this.logger.warn(
            `Snapshot listener failed: ${err instanceof Error ? err.message : err}`,
          );
        }
      }
    } catch (err) {
      this.logger.error(
        'Metrics collection failed',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  private async collectQueues(): Promise<QueueSnapshot[]> {
    const queues: { name: string; q: Queue }[] = [
      { name: 'email', q: this.mailQueue },
      { name: 'commentary-pipeline', q: this.commentaryQueue },
      { name: 'store-translation-pipeline', q: this.translationQueue },
    ];

    const result = await Promise.all(
      queues.map(async ({ name, q }) => {
        try {
          const counts = await q.getJobCounts(
            'waiting',
            'active',
            'delayed',
            'failed',
            'completed',
          );
          return {
            name,
            waiting: counts.waiting ?? 0,
            active: counts.active ?? 0,
            delayed: counts.delayed ?? 0,
            failed: counts.failed ?? 0,
            completed: counts.completed ?? 0,
          };
        } catch {
          return { name, waiting: 0, active: 0, delayed: 0, failed: 0, completed: 0 };
        }
      }),
    );
    return result;
  }

  private collectPgPool(): PgPoolSnapshot | null {
    try {
      const driver = this.dataSource.driver as unknown as {
        master?: { totalCount?: number; idleCount?: number; waitingCount?: number };
      };
      const master = driver.master;
      if (!master) return null;
      return {
        total: master.totalCount ?? 0,
        idle: master.idleCount ?? 0,
        waiting: master.waitingCount ?? 0,
      };
    } catch {
      return null;
    }
  }

  private async persist(snapshot: CollectedSnapshot): Promise<void> {
    try {
      await this.repo.insert({
        memHeapUsed: String(snapshot.memHeapUsed),
        memHeapTotal: String(snapshot.memHeapTotal),
        memRss: String(snapshot.memRss),
        cpuUserUs: String(snapshot.cpuUserUs),
        cpuSystemUs: String(snapshot.cpuSystemUs),
        eventLoopLagMs: String(snapshot.eventLoopLagMs),
        uptimeSec: snapshot.uptimeSec,
        loadAvg1: snapshot.loadAvg1 != null ? String(snapshot.loadAvg1) : null,
        requestsTotal: snapshot.requestsTotal,
        errorsTotal: snapshot.errorsTotal,
        avgLatencyMs:
          snapshot.avgLatencyMs != null ? String(snapshot.avgLatencyMs) : null,
        p95LatencyMs:
          snapshot.p95LatencyMs != null ? String(snapshot.p95LatencyMs) : null,
        queues: snapshot.queues,
        pgPool: snapshot.pgPool,
      });
    } catch (err) {
      this.logger.error(
        'Failed to persist system metric',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
