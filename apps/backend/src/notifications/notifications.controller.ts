import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { StoreOwnerJwtGuard } from '../auth/guards/store-owner-jwt.guard';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { NotificationRecipientType } from '../entities/notification.entity';
import { StoreOwnerAccount } from '../entities/store-owner-account.entity';
import { AdminAccount } from '../entities/admin-account.entity';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('store-owner')
  @UseGuards(StoreOwnerJwtGuard)
  async getForStoreOwner(
    @Request() req: { user: StoreOwnerAccount },
    @Query('isRead') isRead?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.notificationsService.findAllForRecipient(
      NotificationRecipientType.STORE_OWNER,
      req.user.id,
      {
        isRead: isRead !== undefined ? isRead === 'true' : undefined,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
      },
    );
    return result;
  }

  @Get('admin')
  @UseGuards(AdminJwtGuard)
  async getForAdmin(
    @Request() req: { user: AdminAccount },
    @Query('isRead') isRead?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.notificationsService.findAllForRecipient(
      NotificationRecipientType.ADMIN,
      req.user.id,
      {
        isRead: isRead !== undefined ? isRead === 'true' : undefined,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
      },
    );
    return result;
  }

  @Patch('store-owner/:id/read')
  @UseGuards(StoreOwnerJwtGuard)
  async markReadForStoreOwner(
    @Request() req: { user: StoreOwnerAccount },
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(
      id,
      NotificationRecipientType.STORE_OWNER,
      req.user.id,
    );
  }

  @Patch('admin/:id/read')
  @UseGuards(AdminJwtGuard)
  async markReadForAdmin(
    @Request() req: { user: AdminAccount },
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(
      id,
      NotificationRecipientType.ADMIN,
      req.user.id,
    );
  }
}
