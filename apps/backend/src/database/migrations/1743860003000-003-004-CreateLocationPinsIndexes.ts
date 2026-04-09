import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLocationPinsIndexes1743860003000 implements MigrationInterface {
  name = 'CreateLocationPinsIndexes1743860003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "idx_location_pins_geom" ON "location_pins" USING GIST ("pin_geom")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_location_pins_store_status" ON "location_pins" ("store_id", "status")`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_location_pins_one_approved_per_store"
        ON "location_pins" ("store_id")
        WHERE status = 'approved'
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_location_pins_one_pending_per_store"
        ON "location_pins" ("store_id")
        WHERE status = 'pending'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_location_pins_one_pending_per_store"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_location_pins_one_approved_per_store"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_location_pins_store_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_location_pins_geom"`);
  }
}
