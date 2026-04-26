import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestLog } from './entities/request-log.entity';
import {
  FLUSH_INTERVAL_MS,
  REQUEST_BUFFER_HARD_CAP,
} from './monitoring.constants';

export type PendingRequestLog = Omit<RequestLog, 'id' | 'ts'> & { ts?: Date };

@Injectable()
export class RequestLogBuffer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RequestLogBuffer.name);
  private buffer: PendingRequestLog[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(RequestLog)
    private readonly repo: Repository<RequestLog>,
  ) {}

  onModuleInit(): void {
    this.flushTimer = setInterval(() => {
      void this.flush();
    }, FLUSH_INTERVAL_MS);
    this.flushTimer.unref?.();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.flushTimer) clearInterval(this.flushTimer);
    await this.flush();
  }

  push(entry: PendingRequestLog): void {
    if (this.buffer.length >= REQUEST_BUFFER_HARD_CAP) {
      this.buffer.shift();
    }
    this.buffer.push(entry);
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const batch = this.buffer;
    this.buffer = [];
    try {
      await this.repo.insert(batch as RequestLog[]);
    } catch (err) {
      this.logger.error(
        `Failed to flush ${batch.length} request logs`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
