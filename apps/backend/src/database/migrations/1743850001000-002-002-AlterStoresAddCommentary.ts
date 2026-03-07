import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterStoresAddCommentary1743850001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add description column to stores
    await queryRunner.query(`
      ALTER TABLE "stores"
        ADD COLUMN IF NOT EXISTS "description" VARCHAR(1000)
    `);

    // active_commentary_id will be added after commentaries table exists
    // (added in a later migration to avoid circular FK issue)

    // Ensure indexes exist
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_stores_status" ON "stores" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_stores_owner_id" ON "stores" ("owner_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN IF EXISTS "description"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_stores_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_stores_owner_id"`);
  }
}
