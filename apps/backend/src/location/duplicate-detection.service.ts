import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface NearbyPin {
  storeId: string;
  storeName: string;
  distanceMeters: number;
  latitude: number;
  longitude: number;
}

@Injectable()
export class DuplicateDetectionService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Finds approved pins within 5 metres of the given coordinates,
   * excluding the store being evaluated.
   */
  async findNearbyApprovedPins(
    lat: number,
    lng: number,
    excludeStoreId: string,
  ): Promise<NearbyPin[]> {
    const rows = await this.dataSource.query<
      { store_id: string; store_name: string; distance_meters: number; latitude: number; longitude: number }[]
    >(
      `
      SELECT
        lp.store_id,
        s.name AS store_name,
        ST_Distance(
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          lp.pin_geom::geography
        ) AS distance_meters,
        lp.latitude,
        lp.longitude
      FROM location_pins lp
      JOIN stores s ON s.id = lp.store_id
      WHERE lp.status = 'approved'
        AND lp.store_id != $3
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          lp.pin_geom::geography,
          5
        )
      ORDER BY distance_meters ASC
      `,
      [lng, lat, excludeStoreId],
    );

    return rows.map((r) => ({
      storeId: r.store_id,
      storeName: r.store_name,
      distanceMeters: r.distance_meters,
      latitude: r.latitude,
      longitude: r.longitude,
    }));
  }
}
