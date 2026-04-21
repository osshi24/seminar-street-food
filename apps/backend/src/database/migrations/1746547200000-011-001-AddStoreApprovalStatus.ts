import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoreApprovalStatus1746547200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create store_approval_status enum if not exists
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "store_approval_status" AS ENUM ('pending', 'approved', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add approval_status column to stores table
    await queryRunner.query(`
      ALTER TABLE "stores"
      ADD COLUMN "approval_status" "store_approval_status" NOT NULL DEFAULT 'pending'
    `);

    // Create index on approval_status for filtering
    await queryRunner.query(`
      CREATE INDEX "idx_stores_approval_status" ON "stores" ("approval_status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_stores_approval_status"`);

    // Drop column
    await queryRunner.query(`
      ALTER TABLE "stores" DROP COLUMN "approval_status"
    `);

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS "store_approval_status"`);
  }
}
