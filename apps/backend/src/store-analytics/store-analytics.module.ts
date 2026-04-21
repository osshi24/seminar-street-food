import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreAnalyticsEvent } from './entities/store-analytics-event.entity';
import { Store } from '../stores/entities/store.entity';
import { StoreAnalyticsService } from './store-analytics.service';
import { StoreAnalyticsController } from './store-analytics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StoreAnalyticsEvent, Store])],
  providers: [StoreAnalyticsService],
  controllers: [StoreAnalyticsController],
  exports: [StoreAnalyticsService],
})
export class StoreAnalyticsModule {}
