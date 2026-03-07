import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface RecommendationItem {
  menuItemId: string;
  menuItemName: string;
  price: number;
  storeId: string;
  storeName: string;
  matchCount: number;
}

const PAGE_SIZE = 20;

@Injectable()
export class RecommendationsService {
  constructor(private readonly dataSource: DataSource) {}

  async getRecommendations(
    tagIds: number[],
    page: number,
  ): Promise<{ items: RecommendationItem[]; totalCount: number }> {
    const offset = (page - 1) * PAGE_SIZE;

    const [items, countResult] = await Promise.all([
      this.dataSource.query<RecommendationItem[]>(
        `SELECT
           mi.id           AS "menuItemId",
           mi.name         AS "menuItemName",
           mi.price::float AS "price",
           s.id            AS "storeId",
           s.name          AS "storeName",
           COUNT(mit.tag_id)::int AS "matchCount"
         FROM menu_items mi
         JOIN stores s ON mi.store_id = s.id
         JOIN menu_item_tags mit ON mi.id = mit.menu_item_id
         WHERE mit.tag_id = ANY($1) AND s.status = 'active'
         GROUP BY mi.id, mi.name, mi.price, s.id, s.name
         ORDER BY "matchCount" DESC, mi.id ASC
         LIMIT $2 OFFSET $3`,
        [tagIds, PAGE_SIZE, offset],
      ),
      this.dataSource.query<[{ total_count: string }]>(
        `SELECT COUNT(DISTINCT mi.id) AS total_count
         FROM menu_items mi
         JOIN stores s ON mi.store_id = s.id
         JOIN menu_item_tags mit ON mi.id = mit.menu_item_id
         WHERE mit.tag_id = ANY($1) AND s.status = 'active'`,
        [tagIds],
      ),
    ]);

    return {
      items,
      totalCount: parseInt(countResult[0].total_count, 10),
    };
  }
}
