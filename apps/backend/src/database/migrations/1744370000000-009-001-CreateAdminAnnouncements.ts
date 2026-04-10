import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminAnnouncements1744370000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "admin_announcement_recipient_mode" AS ENUM ('single_store', 'multi_store', 'all_stores')
    `);
    await queryRunner.query(`
      CREATE TYPE "admin_announcement_status" AS ENUM ('draft', 'sent')
    `);

    await queryRunner.query(`
      CREATE TABLE "admin_announcements" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "admin_id" uuid NOT NULL,
        "title" varchar(500) NOT NULL,
        "body" text NOT NULL,
        "recipient_mode" "admin_announcement_recipient_mode" NOT NULL,
        "store_ids" uuid[],
        "status" "admin_announcement_status" NOT NULL DEFAULT 'draft',
        "recipient_count" integer NOT NULL DEFAULT 0,
        "failed_email_details" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "sent_at" timestamptz,
        CONSTRAINT "pk_admin_announcements" PRIMARY KEY ("id"),
        CONSTRAINT "fk_admin_announcements_admin_id" FOREIGN KEY ("admin_id") REFERENCES "admin_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_admin_announcements_admin_id" ON "admin_announcements" ("admin_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_admin_announcements_status" ON "admin_announcements" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_admin_announcements_sent_at" ON "admin_announcements" ("sent_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "admin_announcements"`);
    await queryRunner.query(`DROP TYPE "admin_announcement_status"`);
    await queryRunner.query(`DROP TYPE "admin_announcement_recipient_mode"`);
  }
}

