import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity, SoftDeleteEntity } from './base.entity';
import { PermissionType, PermissionStatus, ExcessAction } from '../shared/enums';
import { Employee } from './employee.entity';

@Entity('permission_policies')
export class PermissionPolicy extends BaseEntity {
  @Column({ name: 'max_hours_per_day', type: 'float', default: 2.0 })
  maxHoursPerDay!: number;

  @Column({ name: 'max_hours_per_month', type: 'float', default: 8.0 })
  maxHoursPerMonth!: number;

  @Column({ name: 'excess_action', type: 'varchar', length: 20, default: ExcessAction.LOP })
  excessAction!: ExcessAction;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}

@Entity('permission_requests')
export class PermissionRequest extends SoftDeleteEntity {
  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ name: 'permission_date', type: 'date' })
  permissionDate!: Date;

  @Column({ name: 'permission_type', type: 'varchar', length: 20 })
  permissionType!: PermissionType;

  @Column({ name: 'from_time', type: 'time' })
  fromTime!: string;

  @Column({ name: 'to_time', type: 'time' })
  toTime!: string;

  @Column({ name: 'duration_hours', type: 'float' })
  durationHours!: number;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ type: 'varchar', length: 20, default: PermissionStatus.PENDING })
  status!: PermissionStatus;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy?: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt?: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string | null;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by' })
  approver?: Employee;
}
