import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMonitoringTables1745000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "system_metrics" (
        "id" BIGSERIAL PRIMARY KEY,
        "ts" timestamptz NOT NULL DEFAULT now(),
        "mem_heap_used" bigint NOT NULL,
        "mem_heap_total" bigint NOT NULL,
        "mem_rss" bigint NOT NULL,
        "cpu_user_us" bigint NOT NULL,
        "cpu_system_us" bigint NOT NULL,
        "event_loop_lag_ms" numeric(10,3) NOT NULL,
        "uptime_sec" integer NOT NULL,
        "load_avg_1" numeric(10,3),
        "requests_total" integer NOT NULL DEFAULT 0,
        "errors_total" integer NOT NULL DEFAULT 0,
        "avg_latency_ms" numeric(10,3),
        "p95_latency_ms" numeric(10,3),
        "queues" jsonb,
        "pg_pool" jsonb
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_system_metrics_ts" ON "system_metrics" ("ts" DESC)`,
    );

    await queryRunner.query(`
      CREATE TABLE "request_logs" (
        "id" BIGSERIAL PRIMARY KEY,
        "ts" timestamptz NOT NULL DEFAULT now(),
        "method" varchar(10) NOT NULL,
        "route" varchar(255) NOT NULL,
        "status_code" integer NOT NULL,
        "duration_ms" integer NOT NULL,
        "user_id" uuid,
        "user_role" varchar(32),
        "ip" varchar(64),
        "user_agent" varchar(500),
        "error_code" varchar(64),
        "error_message" text
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_request_logs_ts" ON "request_logs" ("ts" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_request_logs_status_ts" ON "request_logs" ("status_code", "ts" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_request_logs_route_ts" ON "request_logs" ("route", "ts" DESC)`,
    );

    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" BIGSERIAL PRIMARY KEY,
        "ts" timestamptz NOT NULL DEFAULT now(),
        "actor_id" uuid,
        "actor_role" varchar(32) NOT NULL,
        "actor_name" varchar(255),
        "action" varchar(100) NOT NULL,
        "resource_type" varchar(64),
        "resource_id" varchar(100),
        "metadata" jsonb,
        "ip" varchar(64)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_ts" ON "audit_logs" ("ts" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_actor_ts" ON "audit_logs" ("actor_id", "ts" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_action_ts" ON "audit_logs" ("action", "ts" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_resource" ON "audit_logs" ("resource_type", "resource_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "request_logs"`);
    await queryRunner.query(`DROP TABLE "system_metrics"`);
  }
}
