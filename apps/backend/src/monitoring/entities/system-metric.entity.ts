import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

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

@Entity('system_metrics')
export class SystemMetric {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index('idx_system_metrics_ts')
  @CreateDateColumn({ name: 'ts', type: 'timestamptz' })
  ts: Date;

  @Column({ name: 'mem_heap_used', type: 'bigint' })
  memHeapUsed: string;

  @Column({ name: 'mem_heap_total', type: 'bigint' })
  memHeapTotal: string;

  @Column({ name: 'mem_rss', type: 'bigint' })
  memRss: string;

  @Column({ name: 'cpu_user_us', type: 'bigint' })
  cpuUserUs: string;

  @Column({ name: 'cpu_system_us', type: 'bigint' })
  cpuSystemUs: string;

  @Column({ name: 'event_loop_lag_ms', type: 'numeric', precision: 10, scale: 3 })
  eventLoopLagMs: string;

  @Column({ name: 'uptime_sec', type: 'int' })
  uptimeSec: number;

  @Column({ name: 'load_avg_1', type: 'numeric', precision: 10, scale: 3, nullable: true })
  loadAvg1: string | null;

  @Column({ name: 'requests_total', type: 'int', default: 0 })
  requestsTotal: number;

  @Column({ name: 'errors_total', type: 'int', default: 0 })
  errorsTotal: number;

  @Column({ name: 'avg_latency_ms', type: 'numeric', precision: 10, scale: 3, nullable: true })
  avgLatencyMs: string | null;

  @Column({ name: 'p95_latency_ms', type: 'numeric', precision: 10, scale: 3, nullable: true })
  p95LatencyMs: string | null;

  @Column({ type: 'jsonb', nullable: true })
  queues: QueueSnapshot[] | null;

  @Column({ name: 'pg_pool', type: 'jsonb', nullable: true })
  pgPool: PgPoolSnapshot | null;
}
