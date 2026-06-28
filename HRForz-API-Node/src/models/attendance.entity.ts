import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { BaseEntity, SoftDeleteEntity } from './base.entity';
import { AttendanceStatus, ClockMethod, RegularisationStatus } from '../shared/enums';
import { Employee } from './employee.entity';

@Entity('shift_schedules')
export class ShiftSchedule extends SoftDeleteEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'start_time', type: 'time' })
  startTime!: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime!: string;

  @Column({ name: 'grace_minutes', type: 'int', default: 15 })
  graceMinutes!: number;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}

@Entity('employee_shift_assignments')
export class EmployeeShiftAssignment extends BaseEntity {
  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ name: 'shift_id', type: 'uuid' })
  shiftId!: string;

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom!: Date;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo?: Date | null;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;

  @ManyToOne(() => ShiftSchedule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shift_id' })
  shift?: ShiftSchedule;
}

@Entity('attendance_records')
export class AttendanceRecord extends BaseEntity {
  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Index()
  @Column({ name: 'attendance_date', type: 'date' })
  attendanceDate!: Date;

  @Column({ type: 'varchar', length: 10, default: AttendanceStatus.ABSENT })
  status!: AttendanceStatus;

  @Column({ name: 'clock_in', type: 'timestamptz', nullable: true })
  clockIn?: Date | null;

  @Column({ name: 'clock_out', type: 'timestamptz', nullable: true })
  clockOut?: Date | null;

  @Column({ name: 'clock_in_method', type: 'varchar', length: 20, nullable: true })
  clockInMethod?: ClockMethod | null;

  @Column({ name: 'clock_out_method', type: 'varchar', length: 20, nullable: true })
  clockOutMethod?: ClockMethod | null;

  @Column({ name: 'work_hours', type: 'float', nullable: true })
  workHours?: number | null;

  @Column({ name: 'is_late', type: 'boolean', default: false })
  isLate!: boolean;

  @Column({ name: 'is_early_out', type: 'boolean', default: false })
  isEarlyOut!: boolean;

  @Column({ name: 'overtime_hours', type: 'float', nullable: true })
  overtimeHours?: number | null;

  @Column({ type: 'text', nullable: true })
  remarks?: string | null;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;

  @OneToOne('AttendanceRegularisation', 'attendanceRecord')
  regularisation?: Relation<AttendanceRegularisation>;
}

@Entity('attendance_regularisations')
export class AttendanceRegularisation extends SoftDeleteEntity {
  @Index()
  @Column({ name: 'attendance_record_id', type: 'uuid' })
  attendanceRecordId!: string;

  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ name: 'requested_clock_in', type: 'time', nullable: true })
  requestedClockIn?: string | null;

  @Column({ name: 'requested_clock_out', type: 'time', nullable: true })
  requestedClockOut?: string | null;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ type: 'varchar', length: 20, default: RegularisationStatus.PENDING })
  status!: RegularisationStatus;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy?: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt?: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string | null;

  @OneToOne('AttendanceRecord', 'regularisation', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attendance_record_id' })
  attendanceRecord?: Relation<AttendanceRecord>;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;
}
