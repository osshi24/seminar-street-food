import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface BoundaryCoordinate {
  lat: number;
  lng: number;
}

@Entity('food_street_boundaries')
export class FoodStreetBoundary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200, default: 'Ranh giới phố ẩm thực' })
  name: string;

  @Column({ name: 'polygon_coordinates', type: 'jsonb' })
  polygonCoordinates: BoundaryCoordinate[];

  // polygon_geom is managed via raw SQL — not mapped to TypeORM @Column

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
