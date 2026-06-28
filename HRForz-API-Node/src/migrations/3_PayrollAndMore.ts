import { MigrationInterface, QueryRunner } from 'typeorm';

export class PayrollAndMore1700000000003 implements MigrationInterface {
  name = 'PayrollAndMore1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Salary Components
    await queryRunner.query(`
      CREATE TABLE "salary_components" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "name" VARCHAR(150) NOT NULL UNIQUE,
        "code" VARCHAR(30) NOT NULL UNIQUE,
        "component_type" VARCHAR(20) NOT NULL,
        "category" VARCHAR(30) NOT NULL,
        "calc_type" VARCHAR(20) NOT NULL,
        "value" DECIMAL(10, 2) NOT NULL DEFAULT 0,
        "is_taxable" BOOLEAN NOT NULL DEFAULT false,
        "is_pf_applicable" BOOLEAN NOT NULL DEFAULT false,
        "is_esi_applicable" BOOLEAN NOT NULL DEFAULT false,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "display_order" INT NOT NULL DEFAULT 0
      )
    `);

    // Salary Structures
    await queryRunner.query(`
      CREATE TABLE "salary_structures" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        "name" VARCHAR(150) NOT NULL UNIQUE,
        "description" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true
      )
    `);

    // Salary Structure Components
    await queryRunner.query(`
      CREATE TABLE "salary_structure_components" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "structure_id" uuid NOT NULL REFERENCES "salary_structures"("id") ON DELETE CASCADE,
        "component_id" uuid NOT NULL REFERENCES "salary_components"("id") ON DELETE CASCADE,
        "calc_type_override" VARCHAR(20),
        "value_override" DECIMAL(10, 2),
        "display_order" INT NOT NULL DEFAULT 0
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "salary_structure_components" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "salary_structures" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "salary_components" CASCADE`);
  }
}
