import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomerGoogleAccounts1743870000000 implements MigrationInterface {
  name = 'CreateCustomerGoogleAccounts1743870000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "customer_google_accounts" (
        "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "google_id"    VARCHAR(255) NOT NULL UNIQUE,
        "email"        VARCHAR(255) NOT NULL UNIQUE,
        "display_name" VARCHAR(255) NOT NULL,
        "avatar_url"   TEXT,
        "created_at"   TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_customer_google_accounts_google_id"
        ON "customer_google_accounts" ("google_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_customer_google_accounts_google_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_google_accounts"`);
  }
}
