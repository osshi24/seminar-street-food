import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicStoresService } from './public-stores.service';
import { PublicStoresController } from './public-stores.controller';
import { Store } from '../stores/entities/store.entity';
import { MenuItem } from '../stores/entities/menu-item.entity';
import { StoreImage } from '../stores/entities/store-image.entity';
import { StoreTranslation } from '../stores/entities/store-translation.entity';
import { MenuItemTranslation } from '../stores/entities/menu-item-translation.entity';
import { Commentary } from '../commentary/entities/commentary.entity';
import { CommentaryTranslation } from '../commentary/entities/commentary-translation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Store, MenuItem, StoreImage,
      StoreTranslation, MenuItemTranslation,
      Commentary, CommentaryTranslation,
    ]),
  ],
  providers: [PublicStoresService],
  controllers: [PublicStoresController],
})
export class PublicStoresModule {}
