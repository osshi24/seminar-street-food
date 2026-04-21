import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import {
  CollectedSnapshot,
  MetricsCollectorService,
} from './metrics-collector.service';
import { ALERT_COOLDOWN_MS } from './monitoring.constants';

type AlertKind = 'error_rate' | 'queue_failed' | 'memory_rss' | 'event_loop_lag';

interface ThresholdConfig {
  alertEmail: string | null;
  errorRate: number;
  errorRateMinSamples: number;
  queueFailed: number;
  memRssMb: number;
  eventLoopLagMs: number;
}

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  private readonly cfg: ThresholdConfig;
  private lastAlertAt = new Map<AlertKind, number>();

  constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly collector: MetricsCollectorService,
  ) {
    this.cfg = {
      alertEmail: this.configService.get<string>('MONITORING_ALERT_EMAIL') || null,
      errorRate: Number(
        this.configService.get<string>('MONITORING_THRESHOLD_ERROR_RATE') ?? '0.1',
      ),
      errorRateMinSamples: Number(
        this.configService.get<string>('MONITORING_ERROR_RATE_MIN_SAMPLES') ?? '20',
      ),
      queueFailed: Number(
        this.configService.get<string>('MONITORING_THRESHOLD_QUEUE_FAILED') ?? '50',
      ),
      memRssMb: Number(
        this.configService.get<string>('MONITORING_THRESHOLD_MEM_RSS_MB') ?? '1024',
      ),
      eventLoopLagMs: Number(
        this.configService.get<string>('MONITORING_THRESHOLD_EVENT_LOOP_MS') ?? '200',
      ),
    };
  }

  attach(): void {
    this.collector.onSnapshot((snap) => {
      void this.evaluate(snap);
    });
  }

  private async evaluate(snap: CollectedSnapshot): Promise<void> {
    if (!this.cfg.alertEmail) return;

    if (snap.requestsTotal >= this.cfg.errorRateMinSamples) {
      const rate = snap.errorsTotal / snap.requestsTotal;
      if (rate >= this.cfg.errorRate) {
        await this.fire('error_rate', {
          title: `Tỷ lệ lỗi 5xx cao: ${(rate * 100).toFixed(1)}%`,
          message: `${snap.errorsTotal} lỗi / ${snap.requestsTotal} request trong cửa sổ ${Math.round(
            (Date.now() - snap.ts.getTime()) / 1000,
          )}s gần nhất.`,
          details: JSON.stringify({ window: snap }, null, 2),
        });
      }
    }

    const totalFailed = snap.queues.reduce((sum, q) => sum + q.failed, 0);
    if (totalFailed >= this.cfg.queueFailed) {
      await this.fire('queue_failed', {
        title: `BullMQ có ${totalFailed} job failed`,
        message: 'Queue đang tích lũy job lỗi, vui lòng kiểm tra.',
        details: JSON.stringify(snap.queues, null, 2),
      });
    }

    const rssMb = snap.memRss / 1024 / 1024;
    if (rssMb >= this.cfg.memRssMb) {
      await this.fire('memory_rss', {
        title: `Bộ nhớ RSS cao: ${rssMb.toFixed(0)} MB`,
        message: `Process đang dùng ${rssMb.toFixed(0)} MB RSS (ngưỡng ${this.cfg.memRssMb} MB).`,
        details: JSON.stringify(
          {
            heapUsed: snap.memHeapUsed,
            heapTotal: snap.memHeapTotal,
            rss: snap.memRss,
            uptimeSec: snap.uptimeSec,
          },
          null,
          2,
        ),
      });
    }

    if (snap.eventLoopLagMs >= this.cfg.eventLoopLagMs) {
      await this.fire('event_loop_lag', {
        title: `Event loop lag ${snap.eventLoopLagMs} ms`,
        message: `Lag trung bình vượt ngưỡng ${this.cfg.eventLoopLagMs} ms — có khả năng nghẽn CPU.`,
        details: JSON.stringify({ snapshot: snap }, null, 2),
      });
    }
  }

  private async fire(
    kind: AlertKind,
    payload: { title: string; message: string; details: string },
  ): Promise<void> {
    const now = Date.now();
    const last = this.lastAlertAt.get(kind);
    if (last && now - last < ALERT_COOLDOWN_MS) return;
    this.lastAlertAt.set(kind, now);

    const email = this.cfg.alertEmail!;
    try {
      await this.mailService.enqueueEmail({
        to: email,
        subject: `[Monitoring] ${payload.title}`,
        template: 'monitoring-alert',
        context: {
          title: payload.title,
          message: payload.message,
          details: payload.details,
          kind,
          ts: new Date().toISOString(),
        },
      });
      this.logger.warn(`Alert fired: ${kind} — ${payload.title}`);
    } catch (err) {
      this.logger.error(
        `Failed to enqueue alert email`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
