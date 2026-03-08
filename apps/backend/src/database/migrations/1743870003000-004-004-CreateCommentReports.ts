import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommentReports1743870003000 implements MigrationInterface {
  name = 'CreateCommentReports1743870003000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "comment_report_status" AS ENUM ('pending', 'resolved', 'dismissed')
    `);

    await queryRunner.query(`
      CREATE TABLE "comment_reports" (
        "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "review_id"   UUID NOT NULL REFERENCES "reviews" ("id") ON DELETE CASCADE,
        "reporter_id" UUID NOT NULL REFERENCES "store_owner_accounts" ("id"),
        "reason_id"   INTEGER NOT NULL REFERENCES "report_reasons" ("id"),
        "status"      "comment_report_status" NOT NULL DEFAULT 'pending',
        "created_at"  TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        "resolved_at" TIMESTAMP WITH TIME ZONE,
        "resolved_by" UUID REFERENCES "admin_accounts" ("id"),

        CONSTRAINT "uq_comment_reports_review_reporter" UNIQUE ("review_id", "reporter_id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_comment_reports_review_id" ON "comment_reports" ("review_id")`);
    await queryRunner.query(`CREATE INDEX "idx_comment_reports_status" ON "comment_reports" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_comment_reports_reporter_id" ON "comment_reports" ("reporter_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_comment_reports_reporter_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_comment_reports_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_comment_reports_review_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "comment_reports"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "comment_report_status"`);
  }
}
