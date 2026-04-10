import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { Store } from './entities/store.entity';
import { StoreContentDraft } from './entities/store-content-draft.entity';
import { MenuItem } from './entities/menu-item.entity';
import { StoreImage } from './entities/store-image.entity';
import { StoreTranslation } from './entities/store-translation.entity';
import { MenuItemTranslation } from './entities/menu-item-translation.entity';
import { AdminAccount } from '../entities/admin-account.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';
import { StoreTranslationProcessor, STORE_TRANSLATION_QUEUE } from './store-translation.processor';
import { TranslationService } from '../commentary/translation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Store, StoreContentDraft, MenuItem, StoreImage,
      StoreTranslation, MenuItemTranslation,
      AdminAccount,
    ]),
    BullModule.registerQueue({
      name: STORE_TRANSLATION_QUEUE,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
      },
    }),
    NotificationsModule,
    MailModule,
  ],
  providers: [StoresService, StoreTranslationProcessor, TranslationService],
  controllers: [StoresController],
  exports: [StoresService],
})
export class StoresModule {}
