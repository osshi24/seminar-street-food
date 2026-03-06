import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStoreEnums1743850000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // draft_status enum
    await queryRunner.query(`
      CREATE TYPE "draft_status" AS ENUM ('pending', 'approved', 'rejected')
    `);

    // commentary_pipeline_status enum
    await queryRunner.query(`
      CREATE TYPE "commentary_pipeline_status" AS ENUM ('pending', 'running', 'completed', 'failed')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TYPE "commentary_pipeline_status"`);
    await queryRunner.query(`DROP TYPE "draft_status"`);
  }
}
