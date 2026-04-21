import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreAnalyticsEvent, AnalyticsEventType } from './entities/store-analytics-event.entity';
import { Store } from '../stores/entities/store.entity';

export interface AnalyticsSummary {
  qrScans: { total: number; today: number; thisWeek: number };
  storeVisits: { total: number; today: number; thisWeek: number };
  reviews: { total: number; avgRating: number };
  daily: { date: string; qrScans: number; storeVisits: number }[];
}

@Injectable()
export class StoreAnalyticsService {
  constructor(
    @InjectRepository(StoreAnalyticsEvent)
    private readonly eventRepo: Repository<StoreAnalyticsEvent>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
  ) {}

  track(storeId: string, eventType: AnalyticsEventType): void {
    this.eventRepo.save({ storeId, eventType }).catch(() => {});
  }

  async getAnalytics(storeId: string, ownerId: string): Promise<AnalyticsSummary> {
    const store = await this.storeRepo.findOne({ where: { id: storeId, ownerId } });
    if (!store) throw new NotFoundException('Gian hàng không tồn tại.');

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(Date.now() - 6 * 86400000);
    const since14d = new Date(Date.now() - 13 * 86400000);
    since14d.setHours(0, 0, 0, 0);

    const [totalRows, todayRows, weekRows, dailyRows] = await Promise.all([
      this.eventRepo
        .createQueryBuilder('e')
        .select('e.eventType', 'eventType')
        .addSelect('COUNT(*)', 'count')
        .where('e.storeId = :storeId', { storeId })
        .groupBy('e.eventType')
        .getRawMany<{ eventType: string; count: string }>(),

      this.eventRepo
        .createQueryBuilder('e')
        .select('e.eventType', 'eventType')
        .addSelect('COUNT(*)', 'count')
        .where('e.storeId = :storeId', { storeId })
        .andWhere('e.createdAt >= :todayStart', { todayStart })
        .groupBy('e.eventType')
        .getRawMany<{ eventType: string; count: string }>(),

      this.eventRepo
        .createQueryBuilder('e')
        .select('e.eventType', 'eventType')
        .addSelect('COUNT(*)', 'count')
        .where('e.storeId = :storeId', { storeId })
        .andWhere('e.createdAt >= :weekStart', { weekStart })
        .groupBy('e.eventType')
        .getRawMany<{ eventType: string; count: string }>(),

      this.eventRepo
        .createQueryBuilder('e')
        .select("TO_CHAR(e.createdAt AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD')", 'date')
        .addSelect('e.eventType', 'eventType')
        .addSelect('COUNT(*)', 'count')
        .where('e.storeId = :storeId', { storeId })
        .andWhere('e.createdAt >= :since14d', { since14d })
        .groupBy("TO_CHAR(e.createdAt AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD'), e.eventType")
        .orderBy("TO_CHAR(e.createdAt AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD')", 'ASC')
        .getRawMany<{ date: string; eventType: string; count: string }>(),
    ]);

    const getCount = (rows: { eventType: string; count: string }[], type: string) =>
      Number(rows.find((r) => r.eventType === type)?.count ?? 0);

    // Build 14-day chart with zero fill
    const dailyMap = new Map<string, { qrScans: number; storeVisits: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { qrScans: 0, storeVisits: 0 });
    }
    for (const row of dailyRows) {
      const entry = dailyMap.get(row.date);
      if (!entry) continue;
      if (row.eventType === 'qr_scan') entry.qrScans = Number(row.count);
      if (row.eventType === 'store_visit') entry.storeVisits = Number(row.count);
    }

    return {
      qrScans: {
        total: getCount(totalRows, 'qr_scan'),
        today: getCount(todayRows, 'qr_scan'),
        thisWeek: getCount(weekRows, 'qr_scan'),
      },
      storeVisits: {
        total: getCount(totalRows, 'store_visit'),
        today: getCount(todayRows, 'store_visit'),
        thisWeek: getCount(weekRows, 'store_visit'),
      },
      reviews: {
        total: store.reviewCount,
        avgRating: Number(store.avgRating),
      },
      daily: [...dailyMap.entries()].map(([date, v]) => ({ date, ...v })),
    };
  }
}
