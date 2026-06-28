import { Entity, Column, Index } from 'typeorm';
import { SoftDeleteEntity } from './base.entity';

@Entity('nationalities')
export class Nationality extends SoftDeleteEntity {
  @Column({ type: 'varchar', length: 150, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 10, unique: true, nullable: true })
  code?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}

@Entity('blood_groups')
export class BloodGroup extends SoftDeleteEntity {
  @Column({ type: 'varchar', length: 10, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 10, unique: true, nullable: true })
  code?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}

@Entity('relationships')
export class Relationship extends SoftDeleteEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 30, unique: true, nullable: true })
  code?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}

@Entity('marital_statuses')
export class MaritalStatus extends SoftDeleteEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 30, unique: true, nullable: true })
  code?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}

@Entity('holiday_types')
export class HolidayType extends SoftDeleteEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 30, unique: true, nullable: true })
  code?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}

@Entity('account_types')
export class AccountTypeLookup extends SoftDeleteEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 30, unique: true, nullable: true })
  code?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}

@Entity('countries')
export class Country extends SoftDeleteEntity {
  @Column({ type: 'varchar', length: 150, unique: true })
  name!: string;

  @Index()
  @Column({ type: 'varchar', length: 10, unique: true, nullable: true })
  code?: string | null;

  @Column({ name: 'dial_code', type: 'varchar', length: 10, nullable: true })
  dialCode?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}

@Entity('leave_plans')
export class LeavePlan extends SoftDeleteEntity {
  @Index()
  @Column({ type: 'varchar', length: 100, unique: true })
  country!: string;

  @Column({ name: 'leave_types', type: 'jsonb', default: {} })
  leaveTypes!: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
