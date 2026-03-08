import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateQrCodes1743875000000 implements MigrationInterface {
  name = 'CreateQrCodes1743875000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE qr_codes (
        id          SERIAL        PRIMARY KEY,
        store_id    UUID          NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        token       UUID          NOT NULL DEFAULT gen_random_uuid(),
        is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
        created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        created_by  UUID          NOT NULL REFERENCES store_owner_accounts(id),
        CONSTRAINT uq_qr_token UNIQUE (token)
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_one_active_qr_per_store
        ON qr_codes (store_id)
        WHERE is_active = TRUE
    `);

    await queryRunner.query(`
      CREATE INDEX idx_qr_codes_token ON qr_codes (token)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_qr_codes_store_id ON qr_codes (store_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_qr_codes_store_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_qr_codes_token`);
    await queryRunner.query(`DROP INDEX IF EXISTS uq_one_active_qr_per_store`);
    await queryRunner.query(`DROP TABLE IF EXISTS qr_codes`);
  }
}
