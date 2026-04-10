import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { FoodStreetBoundary } from '../admin/entities/food-street-boundary.entity';

@Injectable()
export class BoundaryCheckService {
  private readonly logger = new Logger(BoundaryCheckService.name);

  constructor(
    @InjectRepository(FoodStreetBoundary)
    private readonly boundaryRepo: Repository<FoodStreetBoundary>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Returns true if the given (lat, lng) is within the active food-street boundary.
   * Throws an error with code NO_ACTIVE_BOUNDARY when no boundary is configured.
   */
  async isWithinBoundary(lat: number, lng: number): Promise<boolean> {
    const boundary = await this.boundaryRepo.findOne({
      where: { isActive: true },
    });

    if (!boundary) {
      const err = new Error('No active boundary configured') as Error & { code: string };
      err.code = 'NO_ACTIVE_BOUNDARY';
      throw err;
    }

    const result = await this.dataSource.query<{ is_within: boolean }[]>(
      `
      SELECT EXISTS (
        SELECT 1
        FROM food_street_boundaries b
        WHERE b.is_active = true
          AND b.polygon_geom IS NOT NULL
          AND ST_Contains(b.polygon_geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))
      ) AS "is_within"
      `,
      [lng, lat],
    );

    return result[0]?.is_within ?? false;
  }

  async listActiveBoundaries(): Promise<FoodStreetBoundary[]> {
    return this.boundaryRepo.find({
      where: { isActive: true },
      order: { updatedAt: 'DESC' },
    });
  }
}
