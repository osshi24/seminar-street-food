import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerAvatarKey1743876002000 implements MigrationInterface {
  name = 'AddCustomerAvatarKey1743876002000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "customer_google_accounts"
        ADD COLUMN IF NOT EXISTS "avatar_key" TEXT
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "customer_google_accounts"
        DROP COLUMN IF EXISTS "avatar_key"
    `);
  }
}

