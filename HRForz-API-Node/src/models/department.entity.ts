import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Relation,
} from 'typeorm';
import { SoftDeleteEntity } from './base.entity';

@Entity('departments')
export class Department extends SoftDeleteEntity {
  @Column({ type: 'varchar', length: 150, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 30, unique: true, nullable: true })
  code?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'head_employee_id', type: 'uuid', nullable: true })
  headEmployeeId?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany('Designation', 'department')
  designations?: Relation<Designation[]>;
}

@Entity('designations')
export class Designation extends SoftDeleteEntity {
  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  code?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'int', nullable: true })
  level?: number | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Index()
  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId?: string | null;

  @ManyToOne('Department', 'designations', { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'department_id' })
  department?: Relation<Department>;
}

@Entity('work_locations')
export class WorkLocation extends SoftDeleteEntity {
  @Column({ type: 'varchar', length: 150, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  code?: string | null;

  @Column({ type: 'text', nullable: true })
  address?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state?: string | null;

  @Column({ type: 'varchar', length: 100, default: 'India' })
  country!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
