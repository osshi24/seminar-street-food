import {
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger, OnModuleDestroy } from '@nestjs/common';
import { MetricsCollectorService } from './metrics-collector.service';
import { PresenceService } from './presence.service';
import { MONITORING_NAMESPACE } from './monitoring.constants';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: MONITORING_NAMESPACE,
})
export class MonitoringGateway implements OnGatewayInit, OnModuleDestroy {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MonitoringGateway.name);
  private detachMetrics: (() => void) | null = null;
  private detachPresence: (() => void) | null = null;

  constructor(
    private readonly collector: MetricsCollectorService,
    private readonly presence: PresenceService,
  ) {}

  afterInit(): void {
    this.detachMetrics = this.collector.onSnapshot((snap) => {
      this.server.emit('metrics:snapshot', {
        ...snap,
        ts: snap.ts.toISOString(),
      });
    });
    this.detachPresence = this.presence.onChange((snap) => {
      this.server.emit('presence:updated', snap);
    });
    this.logger.log(`Monitoring gateway initialized at ${MONITORING_NAMESPACE}`);
  }

  onModuleDestroy(): void {
    this.detachMetrics?.();
    this.detachPresence?.();
  }
}
