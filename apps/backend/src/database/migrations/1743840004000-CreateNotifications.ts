import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1743840004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "recipient_type" "notification_recipient_type" NOT NULL,
        "recipient_id" uuid NOT NULL,
        "event_type" varchar(100) NOT NULL,
        "title" varchar(500) NOT NULL,
        "body" text,
        "is_read" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_notifications" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_recipient" ON "notifications" ("recipient_type", "recipient_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_unread" ON "notifications" ("recipient_type", "recipient_id")
      WHERE is_read = FALSE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notifications"`);
  }
}
