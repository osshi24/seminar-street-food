import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFoodStreetBoundariesIndexes1743860005000 implements MigrationInterface {
  name = 'CreateFoodStreetBoundariesIndexes1743860005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX "idx_food_street_boundaries_geom"
        ON "food_street_boundaries" USING GIST ("polygon_geom")
        WHERE is_active = true AND polygon_geom IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_food_street_boundaries_one_active"
        ON "food_street_boundaries" ("is_active")
        WHERE is_active = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_food_street_boundaries_one_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_food_street_boundaries_geom"`);
  }
}
