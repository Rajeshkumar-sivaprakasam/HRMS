import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('organisations')
export class Organisation extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'legal_name', type: 'varchar', length: 255, nullable: true })
  legalName?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gstin?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  pan?: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  cin?: string | null;

  @Column({ name: 'pf_registration_number', type: 'varchar', length: 50, nullable: true })
  pfRegistrationNumber?: string | null;

  @Column({ name: 'esi_registration_number', type: 'varchar', length: 50, nullable: true })
  esiRegistrationNumber?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string | null;

  @Column({ name: 'address_line1', type: 'varchar', length: 255, nullable: true })
  addressLine1?: string | null;

  @Column({ name: 'address_line2', type: 'varchar', length: 255, nullable: true })
  addressLine2?: string | null;

  @Column({ name: 'address_line3', type: 'varchar', length: 255, nullable: true })
  addressLine3?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  pincode?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  tin?: string | null;

  @Column({ type: 'varchar', length: 100, default: 'India' })
  country!: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl?: string | null;

  @Column({ name: 'logo_key', type: 'varchar', length: 500, nullable: true })
  logoKey?: string | null;

  @Column({ name: 'financial_year_start_month', type: 'int', default: 4 })
  financialYearStartMonth!: number;

  @Column({ name: 'payroll_cycle_day', type: 'int', default: 28 })
  payrollCycleDay!: number;

  @Column({ name: 'is_pf_applicable', type: 'boolean', default: true })
  isPfApplicable!: boolean;

  @Column({ name: 'is_esi_applicable', type: 'boolean', default: true })
  isEsiApplicable!: boolean;

  @Column({ name: 'is_professional_tax_applicable', type: 'boolean', default: false })
  isProfessionalTaxApplicable!: boolean;
}
