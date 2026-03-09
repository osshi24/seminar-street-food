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
      SELECT ST_Contains(
        (SELECT polygon_geom FROM food_street_boundaries WHERE is_active = true AND polygon_geom IS NOT NULL LIMIT 1),
        ST_SetSRID(ST_MakePoint($1, $2), 4326)
      ) AS "is_within"
      `,
      [lng, lat],
    );

    return result[0]?.is_within ?? false;
  }
}
