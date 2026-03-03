import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMenuItems1743850003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "menu_items" (
        "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
        "store_id"    UUID NOT NULL,
        "name"        VARCHAR(255) NOT NULL,
        "description" VARCHAR(500),
        "price"       NUMERIC(12, 0) NOT NULL,
        "is_in_draft" BOOLEAN NOT NULL DEFAULT false,
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_menu_items" PRIMARY KEY ("id"),
        CONSTRAINT "fk_menu_items_store_id"
          FOREIGN KEY ("store_id") REFERENCES "stores" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_menu_items_store_id" ON "menu_items" ("store_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_menu_items_name_fts"
        ON "menu_items" USING gin(to_tsvector('simple', name))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "menu_items"`);
  }
}
