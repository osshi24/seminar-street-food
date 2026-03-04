import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePreferenceTags1743876000000 implements MigrationInterface {
  name = 'CreatePreferenceTags1743876000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE preference_tags (
        id          SERIAL        PRIMARY KEY,
        name_vi     VARCHAR(100)  NOT NULL,
        name_en     VARCHAR(100)  NOT NULL,
        group_type  VARCHAR(50)   NOT NULL
                    CHECK (group_type IN ('dish_type', 'flavor', 'allergen')),
        created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_preference_tags_group_type ON preference_tags (group_type)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_preference_tags_group_type`);
    await queryRunner.query(`DROP TABLE IF EXISTS preference_tags`);
  }
}
