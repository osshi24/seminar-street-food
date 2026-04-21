import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillStoreApprovalStatus1746547300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Stores that are already active were approved before the approval_status column existed.
    // Backfill them to 'approved' so the frontend reflects the correct state.
    await queryRunner.query(`
      UPDATE "stores"
      SET "approval_status" = 'approved'
      WHERE "status" = 'active'
        AND "approval_status" = 'pending'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: set active stores back to pending (restores pre-backfill state)
    await queryRunner.query(`
      UPDATE "stores"
      SET "approval_status" = 'pending'
      WHERE "status" = 'active'
        AND "approval_status" = 'approved'
    `);
  }
}
