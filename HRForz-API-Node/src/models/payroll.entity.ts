import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Relation,
} from 'typeorm';
import { BaseEntity, SoftDeleteEntity } from './base.entity';
import {
  PaymentMode,
  SalaryComponentType,
  SalaryCalcType,
  ComponentCategory,
  SalaryRevisionType,
  TaxRegime,
  PayrollRunStatus,
  FnFStatus,
  AdjustmentType,
} from '../shared/enums';
import { Employee } from './employee.entity';

@Entity('salary_components')
export class SalaryComponent extends SoftDeleteEntity {
  @Column({ type: 'varchar', length: 150, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  code!: string;

  @Column({ name: 'component_type', type: 'varchar', length: 20 })
  componentType!: SalaryComponentType;

  @Column({ type: 'varchar', length: 30 })
  category!: ComponentCategory;

  @Column({ name: 'calc_type', type: 'varchar', length: 20 })
  calcType!: SalaryCalcType;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  value!: number;

  @Column({ name: 'is_taxable', type: 'boolean', default: false })
  isTaxable!: boolean;

  @Column({ name: 'is_pf_applicable', type: 'boolean', default: false })
  isPfApplicable!: boolean;

  @Column({ name: 'is_esi_applicable', type: 'boolean', default: false })
  isEsiApplicable!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number;
}

@Entity('salary_structures')
export class SalaryStructure extends SoftDeleteEntity {
  @Column({ type: 'varchar', length: 150, unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany('SalaryStructureComponent', 'structure')
  components?: Relation<SalaryStructureComponent[]>;
}

@Entity('salary_structure_components')
export class SalaryStructureComponent extends BaseEntity {
  @Index()
  @Column({ name: 'structure_id', type: 'uuid' })
  structureId!: string;

  @Column({ name: 'component_id', type: 'uuid' })
  componentId!: string;

  @Column({ name: 'calc_type_override', type: 'varchar', length: 20, nullable: true })
  calcTypeOverride?: SalaryCalcType | null;

  @Column({ name: 'value_override', type: 'decimal', precision: 10, scale: 2, nullable: true })
  valueOverride?: number | null;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number;

  @ManyToOne('SalaryStructure', 'components', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'structure_id' })
  structure?: Relation<SalaryStructure>;

  @ManyToOne(() => SalaryComponent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'component_id' })
  component?: SalaryComponent;
}

@Entity('employee_salaries')
export class EmployeeSalary extends SoftDeleteEntity {
  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ name: 'structure_id', type: 'uuid', nullable: true })
  structureId?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  ctc!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  basic!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  hra!: number;

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom!: Date;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo?: Date | null;

  @Column({ name: 'payment_mode', type: 'varchar', length: 20, default: PaymentMode.BANK_TRANSFER })
  paymentMode!: PaymentMode;

  @Column({ name: 'tax_regime', type: 'varchar', length: 10, default: TaxRegime.NEW })
  taxRegime!: TaxRegime;

  @Column({ name: 'is_current', type: 'boolean', default: true })
  isCurrent!: boolean;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;
}


@Entity('payroll_runs')
export class PayrollRun extends SoftDeleteEntity {
  @Column({ type: 'int' })
  month!: number;

  @Column({ type: 'int' })
  year!: number;

  @Column({ type: 'varchar', length: 20, default: PayrollRunStatus.NOT_RUN })
  status!: PayrollRunStatus;

  @Column({ name: 'total_employees', type: 'int', default: 0 })
  totalEmployees!: number;

  @Column({ name: 'total_gross', type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalGross!: number;

  @Column({ name: 'total_deductions', type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalDeductions!: number;

  @Column({ name: 'total_net', type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalNet!: number;

  @Column({ name: 'processed_by', type: 'uuid', nullable: true })
  processedBy?: string | null;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt?: Date | null;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy?: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt?: Date | null;

  @Column({ name: 'locked_at', type: 'timestamptz', nullable: true })
  lockedAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  remarks?: string | null;

  @OneToMany('Payslip', 'payrollRun')
  payslips?: Relation<Payslip[]>;
}

@Entity('payslips')
export class Payslip extends BaseEntity {
  @Index()
  @Column({ name: 'payroll_run_id', type: 'uuid' })
  payrollRunId!: string;

  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ type: 'int' })
  month!: number;

  @Column({ type: 'int' })
  year!: number;

  @Column({ name: 'working_days', type: 'int' })
  workingDays!: number;

  @Column({ name: 'paid_days', type: 'decimal', precision: 5, scale: 1 })
  paidDays!: number;

  @Column({ name: 'lop_days', type: 'decimal', precision: 5, scale: 1, default: 0 })
  lopDays!: number;

  @Column({ name: 'gross_salary', type: 'decimal', precision: 12, scale: 2 })
  grossSalary!: number;

  @Column({ name: 'total_deductions', type: 'decimal', precision: 12, scale: 2 })
  totalDeductions!: number;

  @Column({ name: 'net_salary', type: 'decimal', precision: 12, scale: 2 })
  netSalary!: number;

  @Column({ name: 'pf_employee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  pfEmployee!: number;

  @Column({ name: 'pf_employer', type: 'decimal', precision: 10, scale: 2, default: 0 })
  pfEmployer!: number;

  @Column({ name: 'esi_employee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  esiEmployee!: number;

  @Column({ name: 'esi_employer', type: 'decimal', precision: 10, scale: 2, default: 0 })
  esiEmployer!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tds!: number;

  @Column({ name: 'pdf_url', type: 'text', nullable: true })
  pdfUrl?: string | null;

  @Column({ name: 'pdf_key', type: 'varchar', length: 500, nullable: true })
  pdfKey?: string | null;

  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished!: boolean;

  @Column({ name: 'component_breakdown', type: 'text', nullable: true })
  componentBreakdown?: string | null;

  @ManyToOne('PayrollRun', 'payslips', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payroll_run_id' })
  payrollRun?: Relation<PayrollRun>;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;
}

@Entity('salary_revisions')
export class SalaryRevision extends SoftDeleteEntity {
  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ name: 'revision_type', type: 'varchar', length: 20 })
  revisionType!: SalaryRevisionType;

  @Column({ name: 'old_ctc', type: 'decimal', precision: 12, scale: 2 })
  oldCtc!: number;

  @Column({ name: 'new_ctc', type: 'decimal', precision: 12, scale: 2 })
  newCtc!: number;

  @Column({ name: 'hike_percentage', type: 'decimal', precision: 6, scale: 2, nullable: true })
  hikePercentage?: number | null;

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom!: Date;

  @Column({ type: 'text', nullable: true })
  reason?: string | null;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy?: string | null;

  @Column({ name: 'letter_url', type: 'text', nullable: true })
  letterUrl?: string | null;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;
}

@Entity('tds_declarations')
export class TDSDeclaration extends SoftDeleteEntity {
  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ name: 'financial_year', type: 'varchar', length: 10 })
  financialYear!: string;

  @Column({ name: 'tax_regime', type: 'varchar', length: 10, default: TaxRegime.NEW })
  taxRegime!: TaxRegime;

  @Column({ name: 'declared_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  declaredAmount!: number;

  @Column({ name: 'approved_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  approvedAmount!: number;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: string;

  @Column({ name: 'declaration_data', type: 'text', nullable: true })
  declarationData?: string | null;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;
}

@Entity('fnf_settlements')
export class FnFSettlement extends SoftDeleteEntity {
  @Index()
  @Column({ name: 'employee_id', type: 'uuid', unique: true })
  employeeId!: string;

  @Column({ name: 'last_working_day', type: 'date' })
  lastWorkingDay!: Date;

  @Column({ type: 'varchar', length: 20, default: FnFStatus.DRAFT })
  status!: FnFStatus;

  @Column({ name: 'notice_period_days', type: 'int', default: 0 })
  noticePeriodDays!: number;

  @Column({ name: 'notice_shortfall_days', type: 'int', default: 0 })
  noticeShortfallDays!: number;

  @Column({ name: 'notice_recovery_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  noticeRecoveryAmount!: number;

  @Column({ name: 'leave_encashment_days', type: 'decimal', precision: 5, scale: 1, default: 0 })
  leaveEncashmentDays!: number;

  @Column({ name: 'leave_encashment_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  leaveEncashmentAmount!: number;

  @Column({ name: 'gratuity_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  gratuityAmount!: number;

  @Column({ name: 'other_deductions', type: 'decimal', precision: 12, scale: 2, default: 0 })
  otherDeductions!: number;

  @Column({ name: 'other_earnings', type: 'decimal', precision: 12, scale: 2, default: 0 })
  otherEarnings!: number;

  @Column({ name: 'net_payable', type: 'decimal', precision: 12, scale: 2, default: 0 })
  netPayable!: number;

  @Column({ name: 'processed_by', type: 'uuid', nullable: true })
  processedBy?: string | null;

  @Column({ name: 'settlement_date', type: 'date', nullable: true })
  settlementDate?: Date | null;

  @Column({ type: 'text', nullable: true })
  remarks?: string | null;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;
}

@Entity('payroll_adjustments')
export class PayrollAdjustment extends SoftDeleteEntity {
  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ type: 'int' })
  month!: number;

  @Column({ type: 'int' })
  year!: number;

  @Column({ name: 'adjustment_type', type: 'varchar', length: 20 })
  adjustmentType!: AdjustmentType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ name: 'is_applied', type: 'boolean', default: false })
  isApplied!: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string | null;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;
}
