import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, ActorRole } from './entities/audit-log.entity';

export interface AuditLogInput {
  actorId?: string | null;
  actorRole: ActorRole;
  actorName?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async record(input: AuditLogInput): Promise<void> {
    try {
      await this.repo.insert({
        actorId: input.actorId ?? null,
        actorRole: input.actorRole,
        actorName: input.actorName ?? null,
        action: input.action,
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        metadata: input.metadata ?? null,
        ip: input.ip ?? null,
      });
    } catch (err) {
      this.logger.error(
        `Failed to write audit log for action=${input.action}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
