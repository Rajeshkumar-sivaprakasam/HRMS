import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000001 implements MigrationInterface {
  name = 'InitialSchema1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Lookup tables
    await queryRunner.query(`
      CREATE TABLE "nationalities" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "name" VARCHAR(150) NOT NULL UNIQUE,
        "code" VARCHAR(10) UNIQUE,
        "description" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "blood_groups" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "name" VARCHAR(10) NOT NULL UNIQUE,
        "code" VARCHAR(10) UNIQUE,
        "description" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "relationships" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "name" VARCHAR(100) NOT NULL UNIQUE,
        "code" VARCHAR(30) UNIQUE,
        "description" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "marital_statuses" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "name" VARCHAR(100) NOT NULL UNIQUE,
        "code" VARCHAR(30) UNIQUE,
        "description" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "holiday_types" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "name" VARCHAR(100) NOT NULL UNIQUE,
        "code" VARCHAR(30) UNIQUE,
        "description" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "account_types" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "name" VARCHAR(100) NOT NULL UNIQUE,
        "code" VARCHAR(30) UNIQUE,
        "description" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "countries" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "name" VARCHAR(150) NOT NULL UNIQUE,
        "code" VARCHAR(10) UNIQUE,
        "dial_code" VARCHAR(10),
        "description" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "leave_plans" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "country" VARCHAR(100) NOT NULL UNIQUE,
        "leave_types" JSONB NOT NULL DEFAULT '{}',
        "description" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true
      )
    `);

    // Organisation
    await queryRunner.query(`
      CREATE TABLE "organisations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "name" VARCHAR(255) NOT NULL,
        "legal_name" VARCHAR(255),
        "gstin" VARCHAR(20),
        "pan" VARCHAR(20),
        "cin" VARCHAR(30),
        "pf_registration_number" VARCHAR(50),
        "esi_registration_number" VARCHAR(50),
        "website" VARCHAR(255),
        "email" VARCHAR(255),
        "phone" VARCHAR(20),
        "address_line1" VARCHAR(255),
        "address_line2" VARCHAR(255),
        "address_line3" VARCHAR(255),
        "city" VARCHAR(100),
        "state" VARCHAR(100),
        "pincode" VARCHAR(20),
        "tin" VARCHAR(20),
        "country" VARCHAR(100) NOT NULL DEFAULT 'India',
        "logo_url" TEXT,
        "logo_key" VARCHAR(500),
        "financial_year_start_month" INT NOT NULL DEFAULT 4,
        "payroll_cycle_day" INT NOT NULL DEFAULT 28,
        "is_pf_applicable" BOOLEAN NOT NULL DEFAULT true,
        "is_esi_applicable" BOOLEAN NOT NULL DEFAULT true,
        "is_professional_tax_applicable" BOOLEAN NOT NULL DEFAULT false
      )
    `);

    // Departments
    await queryRunner.query(`
      CREATE TABLE "departments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "name" VARCHAR(150) NOT NULL UNIQUE,
        "code" VARCHAR(30) UNIQUE,
        "description" TEXT,
        "head_employee_id" uuid,
        "is_active" BOOLEAN NOT NULL DEFAULT true
      )
    `);

    // Designations
    await queryRunner.query(`
      CREATE TABLE "designations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "name" VARCHAR(150) NOT NULL,
        "code" VARCHAR(30),
        "description" TEXT,
        "level" INT,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "department_id" uuid REFERENCES "departments"("id") ON DELETE SET NULL
      )
    `);

    // Work Locations
    await queryRunner.query(`
      CREATE TABLE "work_locations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "name" VARCHAR(150) NOT NULL UNIQUE,
        "code" VARCHAR(30),
        "address" TEXT,
        "city" VARCHAR(100),
        "state" VARCHAR(100),
        "country" VARCHAR(100) NOT NULL DEFAULT 'India',
        "is_active" BOOLEAN NOT NULL DEFAULT true
      )
    `);

    // Shift Schedules
    await queryRunner.query(`
      CREATE TABLE "shift_schedules" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "name" VARCHAR(100) NOT NULL,
        "start_time" TIME NOT NULL,
        "end_time" TIME NOT NULL,
        "grace_minutes" INT NOT NULL DEFAULT 15,
        "is_default" BOOLEAN NOT NULL DEFAULT false,
        "is_active" BOOLEAN NOT NULL DEFAULT true
      )
    `);

    // Employees
    await queryRunner.query(`
      CREATE TABLE "employees" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "employee_code" VARCHAR(50) NOT NULL UNIQUE,
        "first_name" VARCHAR(100) NOT NULL,
        "last_name" VARCHAR(100) NOT NULL,
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "phone" VARCHAR(20),
        "gender" VARCHAR(20),
        "date_of_birth" DATE,
        "profile_picture_url" TEXT,
        "status" VARCHAR(30) NOT NULL DEFAULT 'active',
        "employment_type" VARCHAR(30) NOT NULL DEFAULT 'full_time',
        "work_location_type" VARCHAR(30) NOT NULL DEFAULT 'office',
        "date_of_joining" DATE,
        "date_of_leaving" DATE,
        "probation_end_date" DATE,
        "notice_period_days" INT,
        "department_id" uuid REFERENCES "departments"("id") ON DELETE SET NULL,
        "designation_id" uuid REFERENCES "designations"("id") ON DELETE SET NULL,
        "work_location_id" uuid REFERENCES "work_locations"("id") ON DELETE SET NULL,
        "reporting_manager_id" uuid REFERENCES "employees"("id") ON DELETE SET NULL,
        "address_line1" VARCHAR(255),
        "address_line2" VARCHAR(255),
        "city" VARCHAR(100),
        "state" VARCHAR(100),
        "pincode" VARCHAR(20),
        "country" VARCHAR(100) NOT NULL DEFAULT 'India',
        "bank_name" VARCHAR(150),
        "account_number" VARCHAR(50),
        "ifsc_code" VARCHAR(20),
        "account_type" VARCHAR(20),
        "pan_number" VARCHAR(20),
        "aadhar_number" VARCHAR(20),
        "pf_status" VARCHAR(20),
        "pf_number" VARCHAR(50),
        "pf_uan_number" VARCHAR(20),
        "pf_join_date" DATE,
        "pf_account_name" VARCHAR(150),
        "esic_number" VARCHAR(20),
        "esi_status" VARCHAR(20),
        "pt_state" VARCHAR(100),
        "pt_registered_location" VARCHAR(100),
        "emergency_contact_name" VARCHAR(150),
        "emergency_contact_phone" VARCHAR(20),
        "emergency_contact_relation" VARCHAR(50),
        "current_ctc" DECIMAL(12, 2)
      )
    `);

    // Add FK from departments to employees for head
    await queryRunner.query(`
      ALTER TABLE "departments" 
      ADD CONSTRAINT "fk_dept_head" 
      FOREIGN KEY ("head_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL
    `);

    // Users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "hashed_password" VARCHAR(255) NOT NULL,
        "role" VARCHAR(50) NOT NULL DEFAULT 'employee',
        "is_active" BOOLEAN NOT NULL DEFAULT false,
        "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
        "activation_token" VARCHAR(255),
        "password_reset_token" VARCHAR(255),
        "employee_id" uuid REFERENCES "employees"("id") ON DELETE SET NULL
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "idx_employees_email" ON "employees"("email")`);
    await queryRunner.query(`CREATE INDEX "idx_employees_code" ON "employees"("employee_code")`);
    await queryRunner.query(`CREATE INDEX "idx_employees_dept" ON "employees"("department_id")`);
    await queryRunner.query(`CREATE INDEX "idx_employees_manager" ON "employees"("reporting_manager_id")`);
    await queryRunner.query(`CREATE INDEX "idx_users_email" ON "users"("email")`);
    await queryRunner.query(`CREATE INDEX "idx_users_employee" ON "users"("employee_id")`);
    await queryRunner.query(`CREATE INDEX "idx_designations_dept" ON "designations"("department_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`ALTER TABLE "departments" DROP CONSTRAINT IF EXISTS "fk_dept_head"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employees" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "shift_schedules" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "work_locations" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "designations" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "departments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "organisations" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "leave_plans" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "countries" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "account_types" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "holiday_types" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "marital_statuses" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "relationships" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blood_groups" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "nationalities" CASCADE`);
  }
}
