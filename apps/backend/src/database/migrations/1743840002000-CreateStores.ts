import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStores1743840002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "stores" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "owner_id" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "status" "store_status" NOT NULL DEFAULT 'inactive',
        "description" text,
        "address" varchar(500),
        "latitude" decimal(10, 8),
        "longitude" decimal(11, 8),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_stores" PRIMARY KEY ("id"),
        CONSTRAINT "uq_stores_owner_id" UNIQUE ("owner_id"),
        CONSTRAINT "fk_stores_owner_id" FOREIGN KEY ("owner_id")
          REFERENCES "store_owner_accounts" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_stores_owner_id" ON "stores" ("owner_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_stores_status" ON "stores" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "stores"`);
  }
}
