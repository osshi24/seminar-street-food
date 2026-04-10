import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTranslationTables1744300100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS store_translations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        language_code VARCHAR(10) NOT NULL,
        translated_name VARCHAR(500),
        translated_description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(store_id, language_code)
      );

      CREATE INDEX idx_store_translations_store_lang
        ON store_translations(store_id, language_code);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS menu_item_translations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
        language_code VARCHAR(10) NOT NULL,
        translated_name VARCHAR(500),
        translated_description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(menu_item_id, language_code)
      );

      CREATE INDEX idx_menu_item_translations_item_lang
        ON menu_item_translations(menu_item_id, language_code);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS menu_item_translations;`);
    await queryRunner.query(`DROP TABLE IF EXISTS store_translations;`);
  }
}
