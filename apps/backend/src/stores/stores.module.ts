import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { Store } from './entities/store.entity';
import { StoreContentDraft } from './entities/store-content-draft.entity';
import { MenuItem } from './entities/menu-item.entity';
import { StoreImage } from './entities/store-image.entity';
import { AdminAccount } from '../entities/admin-account.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Store, StoreContentDraft, MenuItem, StoreImage, AdminAccount]),
    NotificationsModule,
    MailModule,
  ],
  providers: [StoresService],
  controllers: [StoresController],
  exports: [StoresService],
})
export class StoresModule {}
