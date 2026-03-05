import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationPin } from './entities/location-pin.entity';
import { FoodStreetBoundary } from '../admin/entities/food-street-boundary.entity';
import { Store } from '../stores/entities/store.entity';
import { AdminAccount } from '../entities/admin-account.entity';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { BoundaryCheckService } from './boundary-check.service';
import { DuplicateDetectionService } from './duplicate-detection.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LocationPin, FoodStreetBoundary, Store, AdminAccount]),
    NotificationsModule,
  ],
  providers: [LocationService, BoundaryCheckService, DuplicateDetectionService],
  controllers: [LocationController],
  exports: [LocationService, BoundaryCheckService, DuplicateDetectionService],
})
export class LocationModule {}
