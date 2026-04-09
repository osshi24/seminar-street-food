import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReviews1743870001000 implements MigrationInterface {
  name = 'CreateReviews1743870001000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "store_id"    UUID NOT NULL REFERENCES "stores" ("id") ON DELETE CASCADE,
        "customer_id" UUID NOT NULL REFERENCES "customer_google_accounts" ("id"),
        "stars"       SMALLINT NOT NULL CHECK ("stars" BETWEEN 1 AND 5),
        "content"     VARCHAR(500),
        "is_hidden"   BOOLEAN NOT NULL DEFAULT false,
        "hidden_at"   TIMESTAMP WITH TIME ZONE,
        "hidden_by"   UUID REFERENCES "admin_accounts" ("id"),
        "created_at"  TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

        CONSTRAINT "uq_reviews_store_customer" UNIQUE ("store_id", "customer_id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_reviews_store_id" ON "reviews" ("store_id")`);
    await queryRunner.query(`CREATE INDEX "idx_reviews_customer_id" ON "reviews" ("customer_id")`);
    await queryRunner.query(`CREATE INDEX "idx_reviews_store_id_hidden" ON "reviews" ("store_id", "is_hidden")`);
    await queryRunner.query(`CREATE INDEX "idx_reviews_created_at_desc" ON "reviews" ("created_at" DESC)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_reviews_created_at_desc"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_reviews_store_id_hidden"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_reviews_customer_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_reviews_store_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews"`);
  }
}
