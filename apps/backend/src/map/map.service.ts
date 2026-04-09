import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationPin, LocationPinStatus } from '../location/entities/location-pin.entity';
import { FoodStreetBoundary } from '../admin/entities/food-street-boundary.entity';
import { StoreStatus } from '../stores/entities/store.entity';
import { StoreImage } from '../stores/entities/store-image.entity';
import { MenuItem } from '../stores/entities/menu-item.entity';

@Injectable()
export class MapService {
  constructor(
    @InjectRepository(LocationPin)
    private readonly pinRepo: Repository<LocationPin>,
    @InjectRepository(FoodStreetBoundary)
    private readonly boundaryRepo: Repository<FoodStreetBoundary>,
    @InjectRepository(StoreImage)
    private readonly imageRepo: Repository<StoreImage>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepo: Repository<MenuItem>,
  ) {}

  async getPublicPins() {
    const pins = await this.pinRepo
      .createQueryBuilder('lp')
      .leftJoinAndSelect('lp.store', 'store')
      .where('lp.status = :pinStatus', { pinStatus: LocationPinStatus.APPROVED })
      .andWhere('store.status = :storeStatus', { storeStatus: StoreStatus.ACTIVE })
      .orderBy('lp.reviewedAt', 'DESC')
      .getMany();

    const [boundary] = await Promise.all([
      this.boundaryRepo.findOne({ where: { isActive: true } }),
    ]);

    const storeIds = pins.map((p) => p.storeId);
    let thumbnailMap: Map<string, string> = new Map();
    let priceRangeMap: Map<string, { min: number; max: number }> = new Map();
    const hasCommentarySet: Set<string> = new Set();

    if (storeIds.length > 0) {
      // Thumbnail: first non-draft image per store ordered by orderIndex
      const images = await this.imageRepo
        .createQueryBuilder('si')
        .select(['si.storeId', 'si.url'])
        .where('si.storeId IN (:...storeIds)', { storeIds })
        .andWhere('si.isInDraft = false')
        .orderBy('si.storeId')
        .addOrderBy('si.orderIndex', 'ASC')
        .getMany();
      for (const img of images) {
        if (!thumbnailMap.has(img.storeId)) {
          thumbnailMap.set(img.storeId, img.url);
        }
      }

      // Price range: min/max of non-draft menu items per store
      const priceRows = await this.menuItemRepo
        .createQueryBuilder('mi')
        .select('mi.storeId', 'storeId')
        .addSelect('MIN(CAST(mi.price AS NUMERIC))', 'minPrice')
        .addSelect('MAX(CAST(mi.price AS NUMERIC))', 'maxPrice')
        .where('mi.storeId IN (:...storeIds)', { storeIds })
        .andWhere('mi.isInDraft = false')
        .groupBy('mi.storeId')
        .getRawMany<{ storeId: string; minPrice: string; maxPrice: string }>();
      for (const row of priceRows) {
        priceRangeMap.set(row.storeId, {
          min: Number(row.minPrice),
          max: Number(row.maxPrice),
        });
      }

      // hasCommentary: store has activeCommentaryId set
      for (const p of pins) {
        if (p.store?.activeCommentaryId) {
          hasCommentarySet.add(p.storeId);
        }
      }
    }

    return {
      pins: pins.map((p) => ({
        id: p.id,
        storeId: p.storeId,
        storeName: p.store?.name,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        thumbnailUrl: thumbnailMap.get(p.storeId) ?? null,
        shortDescription: p.store?.description ?? null,
        hasCommentary: hasCommentarySet.has(p.storeId),
        priceRange: priceRangeMap.get(p.storeId) ?? null,
      })),
      boundary: boundary
        ? { id: boundary.id, name: boundary.name, coordinates: boundary.polygonCoordinates }
        : null,
    };
  }

  async getStorePinDetail(storeId: string) {
    const pin = await this.pinRepo.findOne({
      where: { storeId, status: LocationPinStatus.APPROVED },
      relations: ['store'],
    });

    if (!pin) return null;

    return {
      id: pin.id,
      storeId: pin.storeId,
      storeName: pin.store?.name,
      latitude: Number(pin.latitude),
      longitude: Number(pin.longitude),
      reviewedAt: pin.reviewedAt,
    };
  }
}
