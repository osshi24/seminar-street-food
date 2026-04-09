import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommentaryTranslations1743850006000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "commentary_translations" (
        "id"             UUID NOT NULL DEFAULT gen_random_uuid(),
        "commentary_id"  UUID NOT NULL,
        "language_code"  VARCHAR(10) NOT NULL,
        "translated_text" TEXT NOT NULL,
        "audio_url"      TEXT,
        "audio_s3_key"   TEXT,
        "created_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_commentary_translations" PRIMARY KEY ("id"),
        CONSTRAINT "fk_commentary_translations_commentary_id"
          FOREIGN KEY ("commentary_id") REFERENCES "commentaries" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_commentary_translations_unique"
        ON "commentary_translations" ("commentary_id", "language_code")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_commentary_translations_commentary_id"
        ON "commentary_translations" ("commentary_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "commentary_translations"`);
  }
}
