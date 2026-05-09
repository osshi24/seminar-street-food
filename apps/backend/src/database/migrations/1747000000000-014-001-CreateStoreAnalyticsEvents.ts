import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStoreAnalyticsEvents1747000000000 implements MigrationInterface {
  name = '014-001-CreateStoreAnalyticsEvents1747000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "store_analytics_events" (
        "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
        "store_id"   uuid                     NOT NULL,
        "event_type" character varying(50)    NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_store_analytics_events" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_store_analytics_store_created"
      ON "store_analytics_events" ("store_id", "created_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_store_analytics_store_created"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "store_analytics_events"`);
  }
}
