import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity, SoftDeleteEntity } from './base.entity';
import { LeaveType, LeaveDurationType, LeaveStatus } from '../shared/enums';
import { Employee } from './employee.entity';

@Entity('leave_policies')
export class LeavePolicy extends SoftDeleteEntity {
  @Column({ name: 'leave_type', type: 'varchar', length: 10, unique: true })
  leaveType!: LeaveType;

  @Column({ name: 'annual_quota', type: 'decimal', precision: 5, scale: 1 })
  annualQuota!: number;

  @Column({ name: 'carry_forward_limit', type: 'decimal', precision: 5, scale: 1, default: 0 })
  carryForwardLimit!: number;

  @Column({ name: 'max_consecutive_days', type: 'int', nullable: true })
  maxConsecutiveDays?: number | null;

  @Column({ name: 'is_paid', type: 'boolean', default: true })
  isPaid!: boolean;

  @Column({ name: 'requires_approval', type: 'boolean', default: true })
  requiresApproval!: boolean;

  @Column({ name: 'min_days_notice', type: 'int', default: 0 })
  minDaysNotice!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}

@Entity('leave_balances')
export class LeaveBalance extends BaseEntity {
  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ name: 'leave_type', type: 'varchar', length: 10 })
  leaveType!: LeaveType;

  @Column({ type: 'int' })
  year!: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, default: 0 })
  entitled!: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, default: 0 })
  taken!: number;

  @Column({ name: 'carried_forward', type: 'decimal', precision: 5, scale: 1, default: 0 })
  carriedForward!: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, default: 0 })
  encashed!: number;

  @Column({ name: 'lop_days', type: 'decimal', precision: 5, scale: 1, default: 0 })
  lopDays!: number;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;

  get available(): number {
    return Number(this.entitled) + Number(this.carriedForward) - Number(this.taken);
  }
}

@Entity('leave_requests')
export class LeaveRequest extends SoftDeleteEntity {
  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ name: 'leave_type', type: 'varchar', length: 10 })
  leaveType!: LeaveType;

  @Column({ name: 'duration_type', type: 'varchar', length: 20 })
  durationType!: LeaveDurationType;

  @Column({ name: 'from_date', type: 'date' })
  fromDate!: Date;

  @Column({ name: 'to_date', type: 'date' })
  toDate!: Date;

  @Column({ name: 'days_count', type: 'decimal', precision: 5, scale: 1 })
  daysCount!: number;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ type: 'varchar', length: 20, default: LeaveStatus.PENDING })
  status!: LeaveStatus;

  @Column({ name: 'applied_on', type: 'timestamptz', default: () => 'NOW()' })
  appliedOn!: Date;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy?: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt?: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string | null;

  @Column({ name: 'cancelled_reason', type: 'text', nullable: true })
  cancelledReason?: string | null;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by' })
  approver?: Employee;
}
