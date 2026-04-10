import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropBoundaryOneActiveUniqueIndex1743877000000 implements MigrationInterface {
  name = 'DropBoundaryOneActiveUniqueIndex1743877000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_food_street_boundaries_one_active"`);
    // Optional: keep a non-unique helper index for filtering active boundaries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_food_street_boundaries_is_active"
        ON "food_street_boundaries" ("is_active")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_food_street_boundaries_is_active"`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_food_street_boundaries_one_active"
        ON "food_street_boundaries" ("is_active")
        WHERE is_active = true
    `);
  }
}

