import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEnumTypes1743840000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "store_owner_status" AS ENUM ('pending', 'active', 'inactive', 'rejected')
    `);
    await queryRunner.query(`
      CREATE TYPE "store_status" AS ENUM ('inactive', 'active', 'suspended')
    `);
    await queryRunner.query(`
      CREATE TYPE "notification_recipient_type" AS ENUM ('store_owner', 'admin')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TYPE "notification_recipient_type"`);
    await queryRunner.query(`DROP TYPE "store_status"`);
    await queryRunner.query(`DROP TYPE "store_owner_status"`);
  }
}
