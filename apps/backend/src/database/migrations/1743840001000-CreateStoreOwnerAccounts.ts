import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStoreOwnerAccounts1743840001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "store_owner_accounts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "full_name" varchar(255) NOT NULL,
        "email" varchar(255) NOT NULL,
        "phone" varchar(20) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "status" "store_owner_status" NOT NULL DEFAULT 'pending',
        "registration_reason" text,
        "failed_login_attempts" integer NOT NULL DEFAULT 0,
        "lockout_until" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_store_owner_accounts" PRIMARY KEY ("id"),
        CONSTRAINT "uq_store_owner_accounts_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_store_owner_accounts_email" ON "store_owner_accounts" ("email")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_store_owner_accounts_status" ON "store_owner_accounts" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "store_owner_accounts"`);
  }
}
