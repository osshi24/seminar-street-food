import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMenuItemImages1744370001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "menu_items"
        ADD COLUMN IF NOT EXISTS "image_url" TEXT,
        ADD COLUMN IF NOT EXISTS "image_s3_key" TEXT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "menu_items"
        DROP COLUMN IF EXISTS "image_s3_key",
        DROP COLUMN IF EXISTS "image_url"
    `);
  }
}

