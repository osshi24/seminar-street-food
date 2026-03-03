import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLocationPinStatusEnum1743860001000 implements MigrationInterface {
  name = 'CreateLocationPinStatusEnum1743860001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "location_pin_status" AS ENUM ('pending', 'approved', 'rejected', 'superseded')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TYPE IF EXISTS "location_pin_status"`);
  }
}
