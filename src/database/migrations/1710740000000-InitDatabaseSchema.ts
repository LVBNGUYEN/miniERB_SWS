import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitDatabaseSchema1710740000000 implements MigrationInterface {
  name = 'InitDatabaseSchema1710740000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 0. Enable UUID extension for PostgreSQL
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // 1. Create table iam_users
    await queryRunner.query(`
      CREATE TABLE "iam_users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "created_by" uuid,
        "updated_by" uuid,
        
        "email" character varying NOT NULL,
        "passwordHash" character varying NOT NULL,
        "fullName" character varying,
        "role" character varying NOT NULL DEFAULT 'USER',
        "isActive" boolean NOT NULL DEFAULT true,
        
        CONSTRAINT "UQ_iam_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_iam_users_id" PRIMARY KEY ("id")
      )
    `);

    // 2. Create table prj_projects
    await queryRunner.query(`
      CREATE TABLE "prj_projects" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "created_by" uuid,
        "updated_by" uuid,
        
        "name" character varying NOT NULL,
        "description" text,
        "billing_strategy_id" character varying,
        "status" character varying NOT NULL DEFAULT 'PLANNING',
        "startDate" date,
        "endDate" date,
        
        CONSTRAINT "PK_prj_projects_id" PRIMARY KEY ("id")
      )
    `);

    // 3. Create table prj_tasks
    await queryRunner.query(`
      CREATE TABLE "prj_tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "created_by" uuid,
        "updated_by" uuid,
        
        "project_id" uuid NOT NULL,
        "title" character varying NOT NULL,
        "description" text,
        "status" character varying NOT NULL DEFAULT 'TODO',
        "assignee_id" uuid,
        "due_date" TIMESTAMP,
        
        CONSTRAINT "PK_prj_tasks_id" PRIMARY KEY ("id")
      )
    `);

    // 4. Create table csk_tickets
    await queryRunner.query(`
      CREATE TABLE "csk_tickets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "created_by" uuid,
        "updated_by" uuid,
        
        "project_id" uuid NOT NULL,
        "title" character varying NOT NULL,
        "description" text,
        "type" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'OPEN',
        "reporter_id" uuid,
        "assignee_id" uuid,
        
        CONSTRAINT "PK_csk_tickets_id" PRIMARY KEY ("id")
      )
    `);

    // 5. Create table sys_audit_logs
    await queryRunner.query(`
      CREATE TABLE "sys_audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "created_by" uuid,
        "updated_by" uuid,
        
        "table_name" character varying NOT NULL,
        "record_id" uuid NOT NULL,
        "action" character varying NOT NULL,
        "old_values" jsonb,
        "new_values" jsonb,
        "performed_by" uuid,
        
        CONSTRAINT "PK_sys_audit_logs_id" PRIMARY KEY ("id")
      )
    `);

    // 6. Foreign Key Constraints
    // prj_tasks
    await queryRunner.query(`
      ALTER TABLE "prj_tasks" 
      ADD CONSTRAINT "FK_prj_tasks_project_id" 
      FOREIGN KEY ("project_id") REFERENCES "prj_projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "prj_tasks" 
      ADD CONSTRAINT "FK_prj_tasks_assignee_id" 
      FOREIGN KEY ("assignee_id") REFERENCES "iam_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // csk_tickets
    await queryRunner.query(`
      ALTER TABLE "csk_tickets" 
      ADD CONSTRAINT "FK_csk_tickets_project_id" 
      FOREIGN KEY ("project_id") REFERENCES "prj_projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "csk_tickets" 
      ADD CONSTRAINT "FK_csk_tickets_reporter_id" 
      FOREIGN KEY ("reporter_id") REFERENCES "iam_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "csk_tickets" 
      ADD CONSTRAINT "FK_csk_tickets_assignee_id" 
      FOREIGN KEY ("assignee_id") REFERENCES "iam_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // sys_audit_logs
    await queryRunner.query(`
      ALTER TABLE "sys_audit_logs" 
      ADD CONSTRAINT "FK_sys_audit_logs_performed_by" 
      FOREIGN KEY ("performed_by") REFERENCES "iam_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop Foreign Keys
    await queryRunner.query(`ALTER TABLE "sys_audit_logs" DROP CONSTRAINT "FK_sys_audit_logs_performed_by"`);
    
    await queryRunner.query(`ALTER TABLE "csk_tickets" DROP CONSTRAINT "FK_csk_tickets_assignee_id"`);
    await queryRunner.query(`ALTER TABLE "csk_tickets" DROP CONSTRAINT "FK_csk_tickets_reporter_id"`);
    await queryRunner.query(`ALTER TABLE "csk_tickets" DROP CONSTRAINT "FK_csk_tickets_project_id"`);
    
    await queryRunner.query(`ALTER TABLE "prj_tasks" DROP CONSTRAINT "FK_prj_tasks_assignee_id"`);
    await queryRunner.query(`ALTER TABLE "prj_tasks" DROP CONSTRAINT "FK_prj_tasks_project_id"`);

    // Drop Tables
    await queryRunner.query(`DROP TABLE "sys_audit_logs"`);
    await queryRunner.query(`DROP TABLE "csk_tickets"`);
    await queryRunner.query(`DROP TABLE "prj_tasks"`);
    await queryRunner.query(`DROP TABLE "prj_projects"`);
    await queryRunner.query(`DROP TABLE "iam_users"`);
  }
}
