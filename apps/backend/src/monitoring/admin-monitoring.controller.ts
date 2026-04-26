import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { MonitoringQueryService } from './monitoring-query.service';
import { OverviewQueryDto } from './dto/overview-query.dto';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { PresenceService } from './presence.service';

@Controller('admin/monitoring')
@UseGuards(AdminJwtGuard)
export class AdminMonitoringController {
  constructor(
    private readonly queryService: MonitoringQueryService,
    private readonly presence: PresenceService,
  ) {}

  @Get('overview')
  getOverview(@Query() query: OverviewQueryDto) {
    return this.queryService.getOverview(query.rangeMinutes ?? 60);
  }

  @Get('active-users')
  getActiveUsers() {
    return this.queryService.getActiveUsers();
  }

  @Get('presence')
  getPresence() {
    return this.presence.snapshot();
  }

  @Get('audit-logs')
  getAuditLogs(@Query() query: AuditLogQueryDto) {
    return this.queryService.getAuditLogs({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      actorRole: query.actorRole,
      action: query.action,
      resourceType: query.resourceType,
      actorId: query.actorId,
      fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
      toDate: query.toDate ? new Date(query.toDate) : undefined,
    });
  }
}
