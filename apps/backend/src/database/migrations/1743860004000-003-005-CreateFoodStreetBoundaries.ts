import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFoodStreetBoundaries1743860004000 implements MigrationInterface {
  name = 'CreateFoodStreetBoundaries1743860004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "food_street_boundaries" (
        "id"                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        "name"                 VARCHAR(200) NOT NULL DEFAULT 'Ranh giới phố ẩm thực',
        "polygon_coordinates"  JSONB        NOT NULL,
        "polygon_geom"         GEOMETRY(POLYGON, 4326) NULL,
        "is_active"            BOOLEAN      NOT NULL DEFAULT true,
        "created_by"           UUID         NULL REFERENCES "admin_accounts"("id") ON DELETE SET NULL,
        "created_at"           TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at"           TIMESTAMPTZ  NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "food_street_boundaries"`);
  }
}
