import { MigrationInterface, QueryRunner } from 'typeorm';

export class OnboardingTables1700000000005 implements MigrationInterface {
  name = 'OnboardingTables1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Employee Onboardings
    await queryRunner.query(`
      CREATE TABLE "employee_onboardings" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "auto_employee_code" VARCHAR(50) NOT NULL UNIQUE,
        "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
        "created_by" uuid REFERENCES "employees"("id") ON DELETE SET NULL,
        "first_name" VARCHAR(100),
        "middle_name" VARCHAR(100),
        "last_name" VARCHAR(100),
        "date_of_birth" DATE,
        "gender" VARCHAR(20),
        "marital_status" VARCHAR(30),
        "nationality" VARCHAR(100),
        "blood_group" VARCHAR(10),
        "pan_number" VARCHAR(20),
        "personal_email" VARCHAR(255),
        "mobile_number" VARCHAR(20),
        "current_address" TEXT,
        "permanent_address" TEXT,
        "emergency_contact_name" VARCHAR(150),
        "emergency_contact_phone" VARCHAR(20),
        "emergency_contact_relation" VARCHAR(50),
        "profile_picture_key" VARCHAR(500),
        "profile_picture_url" TEXT,
        "job_title" VARCHAR(150),
        "job_code" VARCHAR(50),
        "sub_department" VARCHAR(100),
        "grade_band" VARCHAR(50),
        "department_id" uuid REFERENCES "departments"("id") ON DELETE SET NULL,
        "work_location_id" uuid REFERENCES "work_locations"("id") ON DELETE SET NULL,
        "employment_type" VARCHAR(30),
        "date_of_joining" DATE,
        "shift_id" uuid REFERENCES "shift_schedules"("id") ON DELETE SET NULL,
        "probation_end_date" DATE,
        "notice_period_days" INT,
        "reporting_manager_id" uuid REFERENCES "employees"("id") ON DELETE SET NULL,
        "buddy_id" uuid REFERENCES "employees"("id") ON DELETE SET NULL,
        "annual_ctc" DECIMAL(12, 2),
        "ctc_effective_from" DATE,
        "salary_structure_id" uuid REFERENCES "salary_structures"("id") ON DELETE SET NULL,
        "ctc_breakdown" JSONB,
        "bank_name" VARCHAR(150),
        "bank_branch" VARCHAR(150),
        "account_number" VARCHAR(50),
        "ifsc_code" VARCHAR(20),
        "account_type" VARCHAR(20),
        "leave_plan" VARCHAR(100),
        "holiday_calendar" VARCHAR(100),
        "leave_allocations" JSONB,
        "cost_centre" VARCHAR(100),
        "business_unit" VARCHAR(100),
        "legal_entity" VARCHAR(100),
        "workspace_team" VARCHAR(100),
        "work_email" VARCHAR(255),
        "activated_at" TIMESTAMPTZ,
        "activated_by" uuid REFERENCES "employees"("id") ON DELETE SET NULL
      )
    `);

    // Onboarding Documents
    await queryRunner.query(`
      CREATE TABLE "onboarding_documents" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "onboarding_id" uuid NOT NULL REFERENCES "employee_onboardings"("id") ON DELETE CASCADE,
        "category" VARCHAR(50) NOT NULL,
        "document_name" VARCHAR(255) NOT NULL,
        "file_key" VARCHAR(500) NOT NULL,
        "file_url" TEXT NOT NULL,
        "is_required" BOOLEAN NOT NULL DEFAULT false,
        "status" VARCHAR(20) NOT NULL DEFAULT 'uploaded',
        "rejection_reason" TEXT,
        "uploaded_by" uuid REFERENCES "employees"("id") ON DELETE SET NULL,
        "verified_by" uuid REFERENCES "employees"("id") ON DELETE SET NULL,
        "verified_at" TIMESTAMPTZ
      )
    `);

    // Additional payroll tables
    await queryRunner.query(`
      CREATE TABLE "salary_revisions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
        "revision_type" VARCHAR(20) NOT NULL,
        "old_ctc" DECIMAL(12, 2) NOT NULL,
        "new_ctc" DECIMAL(12, 2) NOT NULL,
        "hike_percentage" DECIMAL(6, 2),
        "effective_from" DATE NOT NULL,
        "reason" TEXT,
        "approved_by" uuid REFERENCES "employees"("id") ON DELETE SET NULL,
        "letter_url" TEXT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "tds_declarations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
        "financial_year" VARCHAR(10) NOT NULL,
        "tax_regime" VARCHAR(10) NOT NULL DEFAULT 'new',
        "declared_amount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
        "approved_amount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
        "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
        "declaration_data" TEXT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "fnf_settlements" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "employee_id" uuid NOT NULL UNIQUE REFERENCES "employees"("id") ON DELETE CASCADE,
        "last_working_day" DATE NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
        "notice_period_days" INT NOT NULL DEFAULT 0,
        "notice_shortfall_days" INT NOT NULL DEFAULT 0,
        "notice_recovery_amount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
        "leave_encashment_days" DECIMAL(5, 1) NOT NULL DEFAULT 0,
        "leave_encashment_amount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
        "gratuity_amount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
        "other_deductions" DECIMAL(12, 2) NOT NULL DEFAULT 0,
        "other_earnings" DECIMAL(12, 2) NOT NULL DEFAULT 0,
        "net_payable" DECIMAL(12, 2) NOT NULL DEFAULT 0,
        "processed_by" uuid REFERENCES "employees"("id") ON DELETE SET NULL,
        "settlement_date" DATE,
        "remarks" TEXT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "payroll_adjustments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "employee_id" uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
        "month" INT NOT NULL,
        "year" INT NOT NULL,
        "adjustment_type" VARCHAR(20) NOT NULL,
        "amount" DECIMAL(12, 2) NOT NULL,
        "reason" TEXT NOT NULL,
        "is_applied" BOOLEAN NOT NULL DEFAULT false,
        "created_by" uuid REFERENCES "employees"("id") ON DELETE SET NULL
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "idx_onboarding_code" ON "employee_onboardings"("auto_employee_code")`);
    await queryRunner.query(`CREATE INDEX "idx_onboarding_created_by" ON "employee_onboardings"("created_by")`);
    await queryRunner.query(`CREATE INDEX "idx_onboarding_docs" ON "onboarding_documents"("onboarding_id")`);
    await queryRunner.query(`CREATE INDEX "idx_salary_revision_emp" ON "salary_revisions"("employee_id")`);
    await queryRunner.query(`CREATE INDEX "idx_tds_emp" ON "tds_declarations"("employee_id")`);
    await queryRunner.query(`CREATE INDEX "idx_fnf_emp" ON "fnf_settlements"("employee_id")`);
    await queryRunner.query(`CREATE INDEX "idx_adjustment_emp" ON "payroll_adjustments"("employee_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "payroll_adjustments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fnf_settlements" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tds_declarations" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "salary_revisions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "onboarding_documents" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employee_onboardings" CASCADE`);
  }
}
