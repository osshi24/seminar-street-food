import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommentaries1743850005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "commentaries" (
        "id"              UUID NOT NULL DEFAULT gen_random_uuid(),
        "store_id"        UUID NOT NULL,
        "source_text"     VARCHAR(1000) NOT NULL,
        "pipeline_status" "commentary_pipeline_status" NOT NULL DEFAULT 'pending',
        "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_commentaries" PRIMARY KEY ("id"),
        CONSTRAINT "fk_commentaries_store_id"
          FOREIGN KEY ("store_id") REFERENCES "stores" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_commentaries_store_id" ON "commentaries" ("store_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_commentaries_pipeline_status"
        ON "commentaries" ("pipeline_status")
        WHERE pipeline_status IN ('pending', 'running')
    `);

    // Now add active_commentary_id FK to stores (deferred to avoid circular ref)
    await queryRunner.query(`
      ALTER TABLE "stores"
        ADD COLUMN IF NOT EXISTS "active_commentary_id" UUID,
        ADD CONSTRAINT "fk_stores_active_commentary_id"
          FOREIGN KEY ("active_commentary_id") REFERENCES "commentaries" ("id")
          ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "stores" DROP CONSTRAINT IF EXISTS "fk_stores_active_commentary_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "stores" DROP COLUMN IF EXISTS "active_commentary_id"
    `);
    await queryRunner.query(`DROP TABLE "commentaries"`);
  }
}
