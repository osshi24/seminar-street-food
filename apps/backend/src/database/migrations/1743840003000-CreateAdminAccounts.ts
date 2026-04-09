import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminAccounts1743840003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "admin_accounts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "full_name" varchar(255) NOT NULL,
        "email" varchar(255) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_admin_accounts" PRIMARY KEY ("id"),
        CONSTRAINT "uq_admin_accounts_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_admin_accounts_email" ON "admin_accounts" ("email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "admin_accounts"`);
  }
}
