import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreOwnersService } from './store-owners.service';
import { StoreOwnersController } from './store-owners.controller';
import { StoreOwnerAccount } from '../entities/store-owner-account.entity';
import { Store } from '../entities/store.entity';
import { Notification } from '../entities/notification.entity';
import { AdminAccount } from '../entities/admin-account.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StoreOwnerAccount, Store, Notification, AdminAccount]),
    NotificationsModule,
    MailModule,
  ],
  providers: [StoreOwnersService],
  controllers: [StoreOwnersController],
  exports: [StoreOwnersService],
})
export class StoreOwnersModule {}
