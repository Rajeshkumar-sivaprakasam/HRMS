import { MigrationInterface, QueryRunner } from 'typeorm';

export class HRTables1700000000002 implements MigrationInterface {
  name = 'HRTables1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Employee Documents
    await queryRunner.query(`
      CREATE TABLE "employee_documents" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
        "document_type" VARCHAR(100) NOT NULL,
        "document_name" VARCHAR(255) NOT NULL,
        "file_url" TEXT NOT NULL,
        "file_key" VARCHAR(500) NOT NULL,
        "uploaded_by" uuid REFERENCES "employees"("id") ON DELETE SET NULL
      )
    `);

    // Attendance Records
    await queryRunner.query(`
      CREATE TABLE "attendance_records" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
        "attendance_date" DATE NOT NULL,
        "status" VARCHAR(10) NOT NULL DEFAULT 'A',
        "clock_in" TIMESTAMPTZ,
        "clock_out" TIMESTAMPTZ,
        "clock_in_method" VARCHAR(20),
        "clock_out_method" VARCHAR(20),
        "work_hours" FLOAT,
        "is_late" BOOLEAN NOT NULL DEFAULT false,
        "is_early_out" BOOLEAN NOT NULL DEFAULT false,
        "overtime_hours" FLOAT,
        "remarks" TEXT
      )
    `);

    // Attendance Regularisations
    await queryRunner.query(`
      CREATE TABLE "attendance_regularisations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "attendance_record_id" uuid NOT NULL REFERENCES "attendance_records"("id") ON DELETE CASCADE,
        "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
        "requested_clock_in" TIME,
        "requested_clock_out" TIME,
        "reason" TEXT NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
        "approved_by" uuid REFERENCES "employees"("id") ON DELETE SET NULL,
        "approved_at" TIMESTAMPTZ,
        "rejection_reason" TEXT
      )
    `);

    // Employee Shift Assignments
    await queryRunner.query(`
      CREATE TABLE "employee_shift_assignments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
        "shift_id" uuid NOT NULL REFERENCES "shift_schedules"("id") ON DELETE CASCADE,
        "effective_from" DATE NOT NULL,
        "effective_to" DATE
      )
    `);

    // Leave Policies
    await queryRunner.query(`
      CREATE TABLE "leave_policies" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "leave_type" VARCHAR(10) NOT NULL UNIQUE,
        "annual_quota" DECIMAL(5, 1) NOT NULL,
        "carry_forward_limit" DECIMAL(5, 1) NOT NULL DEFAULT 0,
        "max_consecutive_days" INT,
        "is_paid" BOOLEAN NOT NULL DEFAULT true,
        "requires_approval" BOOLEAN NOT NULL DEFAULT true,
        "min_days_notice" INT NOT NULL DEFAULT 0,
        "is_active" BOOLEAN NOT NULL DEFAULT true
      )
    `);

    // Leave Balances
    await queryRunner.query(`
      CREATE TABLE "leave_balances" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
        "leave_type" VARCHAR(10) NOT NULL,
        "year" INT NOT NULL,
        "entitled" DECIMAL(5, 1) NOT NULL DEFAULT 0,
        "taken" DECIMAL(5, 1) NOT NULL DEFAULT 0,
        "carried_forward" DECIMAL(5, 1) NOT NULL DEFAULT 0,
        "encashed" DECIMAL(5, 1) NOT NULL DEFAULT 0,
        "lop_days" DECIMAL(5, 1) NOT NULL DEFAULT 0
      )
    `);

    // Leave Requests
    await queryRunner.query(`
      CREATE TABLE "leave_requests" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
        "leave_type" VARCHAR(10) NOT NULL,
        "duration_type" VARCHAR(20) NOT NULL,
        "from_date" DATE NOT NULL,
        "to_date" DATE NOT NULL,
        "days_count" DECIMAL(5, 1) NOT NULL,
        "reason" TEXT NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
        "applied_on" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "approved_by" uuid REFERENCES "employees"("id") ON DELETE SET NULL,
        "approved_at" TIMESTAMPTZ,
        "rejection_reason" TEXT,
        "cancelled_reason" TEXT
      )
    `);

    // Permission Policies
    await queryRunner.query(`
      CREATE TABLE "permission_policies" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "max_hours_per_day" FLOAT NOT NULL DEFAULT 2.0,
        "max_hours_per_month" FLOAT NOT NULL DEFAULT 8.0,
        "excess_action" VARCHAR(20) NOT NULL DEFAULT 'lop',
        "is_active" BOOLEAN NOT NULL DEFAULT true
      )
    `);

    // Permission Requests
    await queryRunner.query(`
      CREATE TABLE "permission_requests" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
        "permission_date" DATE NOT NULL,
        "permission_type" VARCHAR(20) NOT NULL,
        "from_time" TIME NOT NULL,
        "to_time" TIME NOT NULL,
        "duration_hours" FLOAT NOT NULL,
        "reason" TEXT NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
        "approved_by" uuid REFERENCES "employees"("id") ON DELETE SET NULL,
        "approved_at" TIMESTAMPTZ,
        "rejection_reason" TEXT
      )
    `);

    // Holidays
    await queryRunner.query(`
      CREATE TABLE "holidays" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "name" VARCHAR(150) NOT NULL,
        "holiday_date" DATE NOT NULL,
        "holiday_type_id" uuid REFERENCES "holiday_types"("id") ON DELETE RESTRICT,
        "description" TEXT,
        "year" INT NOT NULL,
        "is_optional" BOOLEAN NOT NULL DEFAULT false,
        "work_location_id" uuid REFERENCES "work_locations"("id") ON DELETE SET NULL
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "idx_emp_docs_employee" ON "employee_documents"("employee_id")`);
    await queryRunner.query(`CREATE INDEX "idx_attendance_employee" ON "attendance_records"("employee_id")`);
    await queryRunner.query(`CREATE INDEX "idx_attendance_date" ON "attendance_records"("attendance_date")`);
    await queryRunner.query(`CREATE INDEX "idx_regularisation_employee" ON "attendance_regularisations"("employee_id")`);
    await queryRunner.query(`CREATE INDEX "idx_regularisation_record" ON "attendance_regularisations"("attendance_record_id")`);
    await queryRunner.query(`CREATE INDEX "idx_shift_assign_employee" ON "employee_shift_assignments"("employee_id")`);
    await queryRunner.query(`CREATE INDEX "idx_leave_balance_employee" ON "leave_balances"("employee_id")`);
    await queryRunner.query(`CREATE INDEX "idx_leave_request_employee" ON "leave_requests"("employee_id")`);
    await queryRunner.query(`CREATE INDEX "idx_permission_employee" ON "permission_requests"("employee_id")`);
    await queryRunner.query(`CREATE INDEX "idx_holidays_date" ON "holidays"("holiday_date")`);
    await queryRunner.query(`CREATE INDEX "idx_holidays_year" ON "holidays"("year")`);
    await queryRunner.query(`CREATE INDEX "idx_holidays_type" ON "holidays"("holiday_type_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "holidays" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permission_requests" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permission_policies" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "leave_requests" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "leave_balances" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "leave_policies" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employee_shift_assignments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attendance_regularisations" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attendance_records" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employee_documents" CASCADE`);
  }
}
