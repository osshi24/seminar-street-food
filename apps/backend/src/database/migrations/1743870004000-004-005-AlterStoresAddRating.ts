import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterStoresAddRating1743870004000 implements MigrationInterface {
  name = 'AlterStoresAddRating1743870004000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "stores"
        ADD COLUMN IF NOT EXISTS "avg_rating"   DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS "review_count" INTEGER       NOT NULL DEFAULT 0
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN IF EXISTS "review_count"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN IF EXISTS "avg_rating"`);
  }
}
