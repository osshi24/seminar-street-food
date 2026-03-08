import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReportReasons1743870002000 implements MigrationInterface {
  name = 'CreateReportReasons1743870002000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "report_reasons" (
        "id"         SERIAL PRIMARY KEY,
        "label_vi"   VARCHAR(100) NOT NULL,
        "label_en"   VARCHAR(100) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
      )
    `);

    await queryRunner.query(`
      INSERT INTO "report_reasons" ("label_vi", "label_en") VALUES
        ('Spam hoặc quảng cáo',              'Spam or advertisement'),
        ('Nội dung không phù hợp',           'Inappropriate content'),
        ('Thông tin sai lệch',               'Misleading information'),
        ('Ngôn ngữ thù địch hoặc xúc phạm', 'Hate speech or offensive language'),
        ('Không liên quan đến gian hàng',    'Not relevant to the store')
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "report_reasons"`);
  }
}
