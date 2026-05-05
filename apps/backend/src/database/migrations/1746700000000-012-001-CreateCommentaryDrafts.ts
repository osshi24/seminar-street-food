import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommentaryDrafts1746700000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE commentary_drafts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        source_text TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        rejection_reason TEXT,
        reviewed_at TIMESTAMPTZ,
        reviewed_by UUID,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_commentary_drafts_store_id ON commentary_drafts(store_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_commentary_drafts_status ON commentary_drafts(status)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_one_pending_commentary_draft_per_store
        ON commentary_drafts(store_id)
        WHERE status = 'pending'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS commentary_drafts`);
  }
}
