import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMenuItemTags1743876001000 implements MigrationInterface {
  name = 'CreateMenuItemTags1743876001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE menu_item_tags (
        menu_item_id  UUID  NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
        tag_id        INT   NOT NULL REFERENCES preference_tags(id),
        PRIMARY KEY (menu_item_id, tag_id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_menu_item_tags_tag_id ON menu_item_tags (tag_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_menu_item_tags_tag_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS menu_item_tags`);
  }
}
