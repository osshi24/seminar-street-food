import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoreDeletionRequestedAt1746800000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE stores
      ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE stores
      DROP COLUMN IF EXISTS deletion_requested_at
    `);
  }
}
