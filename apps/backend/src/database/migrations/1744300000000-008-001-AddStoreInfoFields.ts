import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoreInfoFields1744300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE stores
        ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
        ADD COLUMN IF NOT EXISTS address VARCHAR(500),
        ADD COLUMN IF NOT EXISTS opening_hours VARCHAR(255),
        ADD COLUMN IF NOT EXISTS social_links JSONB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE stores
        DROP COLUMN IF EXISTS phone,
        DROP COLUMN IF EXISTS address,
        DROP COLUMN IF EXISTS opening_hours,
        DROP COLUMN IF EXISTS social_links;
    `);
  }
}
