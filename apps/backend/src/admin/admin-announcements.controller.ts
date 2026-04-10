import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { AdminAnnouncementsService } from './admin-announcements.service';
import { CreateAdminAnnouncementDto } from './dto/create-admin-announcement.dto';
import { UpdateAdminAnnouncementDto } from './dto/update-admin-announcement.dto';
import { AdminAccount } from '../entities/admin-account.entity';

@Controller('admin/announcements')
@UseGuards(AdminJwtGuard)
export class AdminAnnouncementsController {
  constructor(private readonly adminAnnouncementsService: AdminAnnouncementsService) {}

  @Post()
  @Throttle({ global: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAdminAnnouncementDto, @Request() req: { user: AdminAccount }) {
    return this.adminAnnouncementsService.create(dto, req.user.id);
  }

  @Patch(':id')
  async updateDraft(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminAnnouncementDto,
    @Request() req: { user: AdminAccount },
  ) {
    return this.adminAnnouncementsService.updateDraft(id, dto, req.user.id);
  }

  @Post(':id/send')
  @Throttle({ global: { limit: 10, ttl: 60000 } })
  async send(@Param('id', ParseUUIDPipe) id: string, @Request() req: { user: AdminAccount }) {
    return this.adminAnnouncementsService.sendAnnouncement(id, req.user.id);
  }

  @Get()
  async list(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminAnnouncementsService.list(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }
}

