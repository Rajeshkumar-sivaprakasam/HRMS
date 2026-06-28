import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Relation,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import {
  OnboardingStatus,
  DocumentCategory,
  DocumentStatus,
  Gender,
  EmploymentType,
  AccountType,
} from '../shared/enums';
import { Employee } from './employee.entity';
import { Department, WorkLocation } from './department.entity';

@Entity('employee_onboardings')
export class EmployeeOnboarding extends BaseEntity {
  @Index()
  @Column({ name: 'auto_employee_code', type: 'varchar', length: 50, unique: true })
  autoEmployeeCode!: string;

  @Column({ type: 'varchar', length: 20, default: OnboardingStatus.DRAFT })
  status!: OnboardingStatus;

  @Index()
  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string | null;

  // Step 1: Personal
  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true })
  firstName?: string | null;

  @Column({ name: 'middle_name', type: 'varchar', length: 100, nullable: true })
  middleName?: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
  lastName?: string | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender?: Gender | null;

  @Column({ name: 'marital_status', type: 'varchar', length: 30, nullable: true })
  maritalStatus?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nationality?: string | null;

  @Column({ name: 'blood_group', type: 'varchar', length: 10, nullable: true })
  bloodGroup?: string | null;

  @Column({ name: 'pan_number', type: 'varchar', length: 20, nullable: true })
  panNumber?: string | null;

  @Column({ name: 'personal_email', type: 'varchar', length: 255, nullable: true })
  personalEmail?: string | null;

  @Column({ name: 'mobile_number', type: 'varchar', length: 20, nullable: true })
  mobileNumber?: string | null;

  @Column({ name: 'current_address', type: 'text', nullable: true })
  currentAddress?: string | null;

  @Column({ name: 'permanent_address', type: 'text', nullable: true })
  permanentAddress?: string | null;

  @Column({ name: 'emergency_contact_name', type: 'varchar', length: 150, nullable: true })
  emergencyContactName?: string | null;

  @Column({ name: 'emergency_contact_phone', type: 'varchar', length: 20, nullable: true })
  emergencyContactPhone?: string | null;

  @Column({ name: 'emergency_contact_relation', type: 'varchar', length: 50, nullable: true })
  emergencyContactRelation?: string | null;

  @Column({ name: 'profile_picture_key', type: 'varchar', length: 500, nullable: true })
  profilePictureKey?: string | null;

  @Column({ name: 'profile_picture_url', type: 'text', nullable: true })
  profilePictureUrl?: string | null;

  // Step 2: Employment
  @Column({ name: 'job_title', type: 'varchar', length: 150, nullable: true })
  jobTitle?: string | null;

  @Column({ name: 'job_code', type: 'varchar', length: 50, nullable: true })
  jobCode?: string | null;

  @Column({ name: 'sub_department', type: 'varchar', length: 100, nullable: true })
  subDepartment?: string | null;

  @Column({ name: 'grade_band', type: 'varchar', length: 50, nullable: true })
  gradeBand?: string | null;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId?: string | null;

  @Column({ name: 'work_location_id', type: 'uuid', nullable: true })
  workLocationId?: string | null;

  @Column({ name: 'employment_type', type: 'varchar', length: 30, nullable: true })
  employmentType?: EmploymentType | null;

  @Column({ name: 'date_of_joining', type: 'date', nullable: true })
  dateOfJoining?: Date | null;

  @Column({ name: 'shift_id', type: 'uuid', nullable: true })
  shiftId?: string | null;

  @Column({ name: 'probation_end_date', type: 'date', nullable: true })
  probationEndDate?: Date | null;

  @Column({ name: 'notice_period_days', type: 'int', nullable: true })
  noticePeriodDays?: number | null;

  @Column({ name: 'reporting_manager_id', type: 'uuid', nullable: true })
  reportingManagerId?: string | null;

  @Column({ name: 'buddy_id', type: 'uuid', nullable: true })
  buddyId?: string | null;

  // Step 3: CTC & Bank
  @Column({ name: 'annual_ctc', type: 'decimal', precision: 12, scale: 2, nullable: true })
  annualCtc?: number | null;

  @Column({ name: 'ctc_effective_from', type: 'date', nullable: true })
  ctcEffectiveFrom?: Date | null;

  @Column({ name: 'salary_structure_id', type: 'uuid', nullable: true })
  salaryStructureId?: string | null;

  @Column({ name: 'ctc_breakdown', type: 'jsonb', nullable: true })
  ctcBreakdown?: Record<string, unknown> | null;

  @Column({ name: 'bank_name', type: 'varchar', length: 150, nullable: true })
  bankName?: string | null;

  @Column({ name: 'bank_branch', type: 'varchar', length: 150, nullable: true })
  bankBranch?: string | null;

  @Column({ name: 'account_number', type: 'varchar', length: 50, nullable: true })
  accountNumber?: string | null;

  @Column({ name: 'ifsc_code', type: 'varchar', length: 20, nullable: true })
  ifscCode?: string | null;

  @Column({ name: 'account_type', type: 'varchar', length: 20, nullable: true })
  accountType?: AccountType | null;

  // Step 4: Leave & Org
  @Column({ name: 'leave_plan', type: 'varchar', length: 100, nullable: true })
  leavePlan?: string | null;

  @Column({ name: 'holiday_calendar', type: 'varchar', length: 100, nullable: true })
  holidayCalendar?: string | null;

  @Column({ name: 'leave_allocations', type: 'jsonb', nullable: true })
  leaveAllocations?: Record<string, unknown> | null;

  @Column({ name: 'cost_centre', type: 'varchar', length: 100, nullable: true })
  costCentre?: string | null;

  @Column({ name: 'business_unit', type: 'varchar', length: 100, nullable: true })
  businessUnit?: string | null;

  @Column({ name: 'legal_entity', type: 'varchar', length: 100, nullable: true })
  legalEntity?: string | null;

  @Column({ name: 'workspace_team', type: 'varchar', length: 100, nullable: true })
  workspaceTeam?: string | null;

  // Activation meta
  @Column({ name: 'work_email', type: 'varchar', length: 255, nullable: true })
  workEmail?: string | null;

  @Column({ name: 'activated_at', type: 'timestamptz', nullable: true })
  activatedAt?: Date | null;

  @Column({ name: 'activated_by', type: 'uuid', nullable: true })
  activatedBy?: string | null;

  // Relations
  @OneToMany('OnboardingDocument', 'onboarding', { cascade: true })
  documents?: Relation<OnboardingDocument[]>;

  @ManyToOne(() => Department, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @ManyToOne(() => WorkLocation, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'work_location_id' })
  workLocation?: WorkLocation;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reporting_manager_id' })
  reportingManager?: Employee;
}

@Entity('onboarding_documents')
export class OnboardingDocument extends BaseEntity {
  @Index()
  @Column({ name: 'onboarding_id', type: 'uuid' })
  onboardingId!: string;

  @Column({ type: 'varchar', length: 50 })
  category!: DocumentCategory;

  @Column({ name: 'document_name', type: 'varchar', length: 255 })
  documentName!: string;

  @Column({ name: 'file_key', type: 'varchar', length: 500 })
  fileKey!: string;

  @Column({ name: 'file_url', type: 'text' })
  fileUrl!: string;

  @Column({ name: 'is_required', type: 'boolean', default: false })
  isRequired!: boolean;

  @Column({ type: 'varchar', length: 20, default: DocumentStatus.UPLOADED })
  status!: DocumentStatus;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string | null;

  @Column({ name: 'uploaded_by', type: 'uuid', nullable: true })
  uploadedBy?: string | null;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy?: string | null;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt?: Date | null;

  @ManyToOne('EmployeeOnboarding', 'documents', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'onboarding_id' })
  onboarding?: Relation<EmployeeOnboarding>;
}
