import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AdminStoresService } from './admin-stores.service';
import { AdminStoresController } from './admin-stores.controller';
import { AdminLocationService } from './admin-location.service';
import { AdminLocationController } from './admin-location.controller';
import { AdminReportsController } from './admin-reports.controller';
import { AdminReviewsController } from './admin-reviews.controller';
import { AdminAnnouncementsService } from './admin-announcements.service';
import { AdminAnnouncementsController } from './admin-announcements.controller';
import { Store } from '../stores/entities/store.entity';
import { StoreContentDraft } from '../stores/entities/store-content-draft.entity';
import { MenuItem } from '../stores/entities/menu-item.entity';
import { StoreImage } from '../stores/entities/store-image.entity';
import { Commentary } from '../commentary/entities/commentary.entity';
import { CommentaryTranslation } from '../commentary/entities/commentary-translation.entity';
import { LocationPin } from '../location/entities/location-pin.entity';
import { FoodStreetBoundary } from './entities/food-street-boundary.entity';
import { Review } from '../entities/review.entity';
import { CommentReport } from '../entities/comment-report.entity';
import { StoreOwnerAccount } from '../entities/store-owner-account.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { COMMENTARY_QUEUE } from '../commentary/commentary.constants';
import { DuplicateDetectionService } from '../location/duplicate-detection.service';
import { AdminTagsModule } from './tags/admin-tags.module';
import { AdminAnnouncement } from './entities/admin-announcement.entity';
import { AdminCatalogStoresService } from './admin-catalog-stores.service';
import { AdminCatalogStoresController } from './admin-catalog-stores.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Store,
      StoreOwnerAccount,
      StoreContentDraft,
      MenuItem,
      StoreImage,
      Commentary,
      CommentaryTranslation,
      LocationPin,
      FoodStreetBoundary,
      Review,
      CommentReport,
      AdminAnnouncement,
    ]),
    BullModule.registerQueue({ name: COMMENTARY_QUEUE }),
    NotificationsModule,
    MailModule,
    AdminTagsModule,
  ],
  providers: [
    AdminStoresService,
    AdminCatalogStoresService,
    AdminAnnouncementsService,
    AdminLocationService,
    DuplicateDetectionService,
  ],
  controllers: [
    AdminStoresController,
    AdminCatalogStoresController,
    AdminAnnouncementsController,
    AdminLocationController,
    AdminReportsController,
    AdminReviewsController,
  ],
})
export class AdminModule {}
