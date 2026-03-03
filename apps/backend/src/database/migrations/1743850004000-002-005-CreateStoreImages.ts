import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStoreImages1743850004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "store_images" (
        "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
        "store_id"    UUID NOT NULL,
        "url"         TEXT NOT NULL,
        "s3_key"      TEXT NOT NULL,
        "order_index" SMALLINT NOT NULL DEFAULT 0,
        "is_in_draft" BOOLEAN NOT NULL DEFAULT false,
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_store_images" PRIMARY KEY ("id"),
        CONSTRAINT "fk_store_images_store_id"
          FOREIGN KEY ("store_id") REFERENCES "stores" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_store_images_store_id" ON "store_images" ("store_id", "order_index")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_store_images_active"
        ON "store_images" ("store_id")
        WHERE is_in_draft = false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "store_images"`);
  }
}
