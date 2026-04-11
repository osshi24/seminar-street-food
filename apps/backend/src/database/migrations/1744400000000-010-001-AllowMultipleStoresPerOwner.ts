import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowMultipleStoresPerOwner1744400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop the unique constraint that blocks multiple stores per owner
    await queryRunner.query(`
      ALTER TABLE "stores" DROP CONSTRAINT IF EXISTS "uq_stores_owner_id";
    `);

    // 2. Add trigger to enforce max 3 stores per owner
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION check_store_owner_limit()
      RETURNS TRIGGER AS $$
      BEGIN
        IF (SELECT COUNT(*) FROM stores WHERE owner_id = NEW.owner_id) >= 3 THEN
          RAISE EXCEPTION 'STORE_LIMIT_EXCEEDED: Owner may not have more than 3 stores';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_store_owner_limit
        BEFORE INSERT ON stores
        FOR EACH ROW EXECUTE FUNCTION check_store_owner_limit();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_store_owner_limit ON stores;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS check_store_owner_limit;`);
    await queryRunner.query(`
      ALTER TABLE "stores" ADD CONSTRAINT "uq_stores_owner_id" UNIQUE ("owner_id");
    `);
  }
}
