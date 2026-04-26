import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SystemMetric } from './entities/system-metric.entity';
import { RequestLog } from './entities/request-log.entity';
import { AuditLog } from './entities/audit-log.entity';
import { MetricsAggregator } from './metrics-aggregator.service';
import { MetricsCollectorService } from './metrics-collector.service';
import { RequestLogBuffer } from './request-log-buffer.service';
import { AuditLogService } from './audit-log.service';
import { AlertService } from './alert.service';
import { MonitoringQueryService } from './monitoring-query.service';
import { MonitoringGateway } from './monitoring.gateway';
import { PresenceService } from './presence.service';
import { PresenceGateway } from './presence.gateway';
import { MonitoringLoggingInterceptor } from './monitoring-logging.interceptor';
import { AdminMonitoringController } from './admin-monitoring.controller';
import { PublicPresenceController } from './public-presence.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SystemMetric, RequestLog, AuditLog]),
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'commentary-pipeline' },
      { name: 'store-translation-pipeline' },
    ),
    MailModule,
    JwtModule.register({}),
  ],
  providers: [
    MetricsAggregator,
    RequestLogBuffer,
    MetricsCollectorService,
    AuditLogService,
    AlertService,
    MonitoringQueryService,
    MonitoringGateway,
    PresenceService,
    PresenceGateway,
    {
      provide: APP_INTERCEPTOR,
      useClass: MonitoringLoggingInterceptor,
    },
  ],
  controllers: [AdminMonitoringController, PublicPresenceController],
  exports: [AuditLogService],
})
export class MonitoringModule implements OnModuleInit {
  constructor(private readonly alertService: AlertService) {}

  onModuleInit(): void {
    this.alertService.attach();
  }
}
