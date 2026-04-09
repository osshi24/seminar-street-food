import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStoreContentDrafts1743850002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "store_content_drafts" (
        "id"               UUID NOT NULL DEFAULT gen_random_uuid(),
        "store_id"         UUID NOT NULL,
        "name"             VARCHAR(255) NOT NULL,
        "description"      VARCHAR(1000),
        "status"           "draft_status" NOT NULL DEFAULT 'pending',
        "rejection_reason" TEXT,
        "submitted_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        "reviewed_at"      TIMESTAMPTZ,
        "reviewed_by"      UUID,
        CONSTRAINT "pk_store_content_drafts" PRIMARY KEY ("id"),
        CONSTRAINT "fk_store_content_drafts_store_id"
          FOREIGN KEY ("store_id") REFERENCES "stores" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_store_content_drafts_reviewed_by"
          FOREIGN KEY ("reviewed_by") REFERENCES "admin_accounts" ("id") ON DELETE SET NULL
      )
    `);

    // Partial unique index: max 1 pending draft per store
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_store_drafts_one_pending"
        ON "store_content_drafts" ("store_id")
        WHERE status = 'pending'
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_store_drafts_store_id" ON "store_content_drafts" ("store_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_store_drafts_status" ON "store_content_drafts" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "store_content_drafts"`);
  }
}
