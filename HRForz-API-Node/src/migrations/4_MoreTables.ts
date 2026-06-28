import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoreTables1700000000004 implements MigrationInterface {
  name = 'MoreTables1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Employee Salaries
    await queryRunner.query(`
      CREATE TABLE "employee_salaries" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
        "structure_id" uuid REFERENCES "salary_structures"("id") ON DELETE SET NULL,
        "ctc" DECIMAL(12, 2) NOT NULL,
        "basic" DECIMAL(12, 2) NOT NULL,
        "hra" DECIMAL(12, 2) NOT NULL,
        "effective_from" DATE NOT NULL,
        "effective_to" DATE,
        "payment_mode" VARCHAR(20) NOT NULL DEFAULT 'bank_transfer',
        "tax_regime" VARCHAR(10) NOT NULL DEFAULT 'new',
        "is_current" BOOLEAN NOT NULL DEFAULT true
      )
    `);

    // Payroll Runs
    await queryRunner.query(`
      CREATE TABLE "payroll_runs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "month" INT NOT NULL,
        "year" INT NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'not_run',
        "total_employees" INT NOT NULL DEFAULT 0,
        "total_gross" DECIMAL(14, 2) NOT NULL DEFAULT 0,
        "total_deductions" DECIMAL(14, 2) NOT NULL DEFAULT 0,
        "total_net" DECIMAL(14, 2) NOT NULL DEFAULT 0,
        "processed_by" uuid REFERENCES "employees"("id") ON DELETE SET NULL,
        "processed_at" TIMESTAMPTZ,
        "approved_by" uuid REFERENCES "employees"("id") ON DELETE SET NULL,
        "approved_at" TIMESTAMPTZ,
        "locked_at" TIMESTAMPTZ,
        "remarks" TEXT
      )
    `);

    // Payslips
    await queryRunner.query(`
      CREATE TABLE "payslips" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "payroll_run_id" uuid NOT NULL REFERENCES "payroll_runs"("id") ON DELETE CASCADE,
        "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
        "month" INT NOT NULL,
        "year" INT NOT NULL,
        "working_days" INT NOT NULL,
        "paid_days" DECIMAL(5, 1) NOT NULL,
        "lop_days" DECIMAL(5, 1) NOT NULL DEFAULT 0,
        "gross_salary" DECIMAL(12, 2) NOT NULL,
        "total_deductions" DECIMAL(12, 2) NOT NULL,
        "net_salary" DECIMAL(12, 2) NOT NULL,
        "pf_employee" DECIMAL(10, 2) NOT NULL DEFAULT 0,
        "pf_employer" DECIMAL(10, 2) NOT NULL DEFAULT 0,
        "esi_employee" DECIMAL(10, 2) NOT NULL DEFAULT 0,
        "esi_employer" DECIMAL(10, 2) NOT NULL DEFAULT 0,
        "tds" DECIMAL(10, 2) NOT NULL DEFAULT 0,
        "pdf_url" TEXT,
        "pdf_key" VARCHAR(500),
        "is_published" BOOLEAN NOT NULL DEFAULT false,
        "component_breakdown" TEXT
      )
    `);

    // Helpdesk Categories
    await queryRunner.query(`
      CREATE TABLE "helpdesk_categories" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "name" VARCHAR(150) NOT NULL UNIQUE,
        "description" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true
      )
    `);

    // Helpdesk Tickets
    await queryRunner.query(`
      CREATE TABLE "helpdesk_tickets" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "ticket_number" VARCHAR(30) NOT NULL UNIQUE,
        "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
        "category_id" uuid REFERENCES "helpdesk_categories"("id") ON DELETE SET NULL,
        "subject" VARCHAR(255) NOT NULL,
        "description" TEXT NOT NULL,
        "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
        "status" VARCHAR(20) NOT NULL DEFAULT 'open',
        "assigned_to" uuid REFERENCES "employees"("id") ON DELETE SET NULL,
        "resolved_at" TIMESTAMPTZ,
        "closed_at" TIMESTAMPTZ,
        "attachment_url" TEXT
      )
    `);

    // Helpdesk Comments
    await queryRunner.query(`
      CREATE TABLE "helpdesk_comments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "ticket_id" uuid NOT NULL REFERENCES "helpdesk_tickets"("id") ON DELETE CASCADE,
        "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
        "comment" TEXT NOT NULL,
        "is_internal" BOOLEAN NOT NULL DEFAULT false
      )
    `);

    // Announcements
    await queryRunner.query(`
      CREATE TABLE "announcements" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "title" VARCHAR(255) NOT NULL,
        "content" TEXT NOT NULL,
        "target_audience" VARCHAR(30) NOT NULL DEFAULT 'all',
        "target_department_id" uuid REFERENCES "departments"("id") ON DELETE SET NULL,
        "published_by" uuid REFERENCES "employees"("id") ON DELETE SET NULL,
        "published_at" DATE,
        "expires_at" DATE,
        "is_published" BOOLEAN NOT NULL DEFAULT false,
        "is_pinned" BOOLEAN NOT NULL DEFAULT false,
        "attachment_url" TEXT
      )
    `);

    // Notifications
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "recipient_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
        "notification_type" VARCHAR(50) NOT NULL,
        "title" VARCHAR(255) NOT NULL,
        "body" TEXT NOT NULL,
        "reference_id" uuid,
        "reference_type" VARCHAR(50),
        "is_read" BOOLEAN NOT NULL DEFAULT false,
        "read_at" TIMESTAMPTZ
      )
    `);

    // Audit Logs
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "actor_id" uuid REFERENCES "employees"("id") ON DELETE SET NULL,
        "actor_email" VARCHAR(255),
        "action" VARCHAR(100) NOT NULL,
        "resource_type" VARCHAR(100) NOT NULL,
        "resource_id" VARCHAR(100),
        "old_values" TEXT,
        "new_values" TEXT,
        "ip_address" VARCHAR(45),
        "user_agent" VARCHAR(500),
        "request_id" VARCHAR(100)
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "idx_emp_salary_employee" ON "employee_salaries"("employee_id")`);
    await queryRunner.query(`CREATE INDEX "idx_payslips_run" ON "payslips"("payroll_run_id")`);
    await queryRunner.query(`CREATE INDEX "idx_payslips_employee" ON "payslips"("employee_id")`);
    await queryRunner.query(`CREATE INDEX "idx_tickets_employee" ON "helpdesk_tickets"("employee_id")`);
    await queryRunner.query(`CREATE INDEX "idx_tickets_number" ON "helpdesk_tickets"("ticket_number")`);
    await queryRunner.query(`CREATE INDEX "idx_comments_ticket" ON "helpdesk_comments"("ticket_id")`);
    await queryRunner.query(`CREATE INDEX "idx_notifications_recipient" ON "notifications"("recipient_id")`);
    await queryRunner.query(`CREATE INDEX "idx_audit_actor" ON "audit_logs"("actor_id")`);
    await queryRunner.query(`CREATE INDEX "idx_audit_action" ON "audit_logs"("action")`);
    await queryRunner.query(`CREATE INDEX "idx_audit_resource" ON "audit_logs"("resource_type")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "announcements" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "helpdesk_comments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "helpdesk_tickets" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "helpdesk_categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payslips" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payroll_runs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employee_salaries" CASCADE`);
  }
}
