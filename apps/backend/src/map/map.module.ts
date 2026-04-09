import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationPin } from '../location/entities/location-pin.entity';
import { FoodStreetBoundary } from '../admin/entities/food-street-boundary.entity';
import { Store } from '../stores/entities/store.entity';
import { StoreImage } from '../stores/entities/store-image.entity';
import { MenuItem } from '../stores/entities/menu-item.entity';
import { MapService } from './map.service';
import { MapController } from './map.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LocationPin, FoodStreetBoundary, Store, StoreImage, MenuItem])],
  providers: [MapService],
  controllers: [MapController],
})
export class MapModule {}
