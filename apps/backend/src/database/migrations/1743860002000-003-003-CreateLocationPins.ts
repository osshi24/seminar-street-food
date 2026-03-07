import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLocationPins1743860002000 implements MigrationInterface {
  name = 'CreateLocationPins1743860002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "location_pins" (
        "id"               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
        "store_id"         UUID            NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
        "latitude"         NUMERIC(10, 8)  NOT NULL,
        "longitude"        NUMERIC(11, 8)  NOT NULL,
        "pin_geom"         GEOMETRY(POINT, 4326) GENERATED ALWAYS AS (
                             ST_SetSRID(ST_MakePoint(longitude::float8, latitude::float8), 4326)
                           ) STORED,
        "status"           "location_pin_status" NOT NULL DEFAULT 'pending',
        "rejection_reason" TEXT            NULL,
        "submitted_at"     TIMESTAMPTZ     NOT NULL DEFAULT now(),
        "reviewed_at"      TIMESTAMPTZ     NULL,
        "reviewed_by"      UUID            NULL REFERENCES "admin_accounts"("id") ON DELETE SET NULL,
        "created_at"       TIMESTAMPTZ     NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "location_pins"`);
  }
}
