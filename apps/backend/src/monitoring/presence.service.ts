import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

export type PresenceRole = 'admin' | 'store_owner' | 'customer' | 'anonymous';

export interface PresenceConnection {
  socketId: string;
  userId: string | null;
  role: PresenceRole;
  connectedAt: Date;
}

export interface PresenceSnapshot {
  total: number;
  byRole: Record<PresenceRole, number>;
  uniqueUsers: number;
  publicVisitors: number;
  ts: string;
}

type ChangeListener = (snapshot: PresenceSnapshot) => void;

const PUBLIC_VISITOR_TTL_MS = 45_000;
const SWEEP_INTERVAL_MS = 30_000;

@Injectable()
export class PresenceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PresenceService.name);
  private readonly connections = new Map<string, PresenceConnection>();
  private readonly publicVisitors = new Map<string, { lastSeenAt: number }>();
  private readonly listeners = new Set<ChangeListener>();
  private sweepTimer: NodeJS.Timeout | null = null;

  onModuleInit(): void {
    this.sweepTimer = setInterval(() => this.sweepExpired(), SWEEP_INTERVAL_MS);
    this.sweepTimer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
  }

  add(conn: PresenceConnection): void {
    this.connections.set(conn.socketId, conn);
    this.notify();
  }

  remove(socketId: string): void {
    if (this.connections.delete(socketId)) {
      this.notify();
    }
  }

  pingPublic(visitorId: string): void {
    const isNew = !this.publicVisitors.has(visitorId);
    this.publicVisitors.set(visitorId, { lastSeenAt: Date.now() });
    if (isNew) this.notify();
  }

  snapshot(): PresenceSnapshot {
    const byRole: Record<PresenceRole, number> = {
      admin: 0,
      store_owner: 0,
      customer: 0,
      anonymous: 0,
    };
    const uniqueUsers = new Set<string>();
    for (const c of this.connections.values()) {
      byRole[c.role] += 1;
      if (c.userId) uniqueUsers.add(c.userId);
    }
    return {
      total: this.connections.size,
      byRole, //{ admin: 1, store_owner: 3, customer: 0, anonymous: 0 },
      uniqueUsers: uniqueUsers.size,
      publicVisitors: this.countAlivePublic(),
      ts: new Date().toISOString(),
    };
  }

  onChange(listener: ChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private countAlivePublic(): number {
    const cutoff = Date.now() - PUBLIC_VISITOR_TTL_MS;
    let count = 0;
    for (const v of this.publicVisitors.values()) {
      if (v.lastSeenAt > cutoff) count += 1;
    }
    return count;
  }

  private sweepExpired(): void {
    const cutoff = Date.now() - PUBLIC_VISITOR_TTL_MS;
    let removed = 0;
    for (const [id, v] of this.publicVisitors) {
      if (v.lastSeenAt <= cutoff) {
        this.publicVisitors.delete(id);
        removed += 1;
      }
    }
    if (removed > 0) this.notify();
  }

  private notify(): void {
    const snap = this.snapshot();
    for (const l of this.listeners) {
      try {
        l(snap);
      } catch (err) {
        this.logger.warn(
          `Presence listener failed: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }
}
