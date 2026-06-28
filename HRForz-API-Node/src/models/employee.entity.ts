import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { SoftDeleteEntity, BaseEntity } from './base.entity';
import {
  EmployeeStatus,
  EmploymentType,
  WorkLocationType,
  Gender,
  AccountType,
} from '../shared/enums';
import { Department, Designation, WorkLocation } from './department.entity';
import { User } from './user.entity';

@Entity('employees')
export class Employee extends SoftDeleteEntity {
  @Index()
  @Column({ name: 'employee_code', type: 'varchar', length: 50, unique: true })
  employeeCode!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName!: string;

  @Index()
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender?: Gender | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: Date | null;

  @Column({ name: 'profile_picture_url', type: 'text', nullable: true })
  profilePictureUrl?: string | null;

  // Employment
  @Column({ type: 'varchar', length: 30, default: EmployeeStatus.ACTIVE })
  status!: EmployeeStatus;

  @Column({ name: 'employment_type', type: 'varchar', length: 30, default: EmploymentType.FULL_TIME })
  employmentType!: EmploymentType;

  @Column({ name: 'work_location_type', type: 'varchar', length: 30, default: WorkLocationType.OFFICE })
  workLocationType!: WorkLocationType;

  @Column({ name: 'date_of_joining', type: 'date', nullable: true })
  dateOfJoining?: Date | null;

  @Column({ name: 'date_of_leaving', type: 'date', nullable: true })
  dateOfLeaving?: Date | null;

  @Column({ name: 'probation_end_date', type: 'date', nullable: true })
  probationEndDate?: Date | null;

  @Column({ name: 'notice_period_days', type: 'int', nullable: true })
  noticePeriodDays?: number | null;

  // Org relationships
  @Index()
  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId?: string | null;

  @Index()
  @Column({ name: 'designation_id', type: 'uuid', nullable: true })
  designationId?: string | null;

  @Column({ name: 'work_location_id', type: 'uuid', nullable: true })
  workLocationId?: string | null;

  @Index()
  @Column({ name: 'reporting_manager_id', type: 'uuid', nullable: true })
  reportingManagerId?: string | null;

  // Personal address
  @Column({ name: 'address_line1', type: 'varchar', length: 255, nullable: true })
  addressLine1?: string | null;

  @Column({ name: 'address_line2', type: 'varchar', length: 255, nullable: true })
  addressLine2?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  pincode?: string | null;

  @Column({ type: 'varchar', length: 100, default: 'India' })
  country!: string;

  // Bank
  @Column({ name: 'bank_name', type: 'varchar', length: 150, nullable: true })
  bankName?: string | null;

  @Column({ name: 'account_number', type: 'varchar', length: 50, nullable: true })
  accountNumber?: string | null;

  @Column({ name: 'ifsc_code', type: 'varchar', length: 20, nullable: true })
  ifscCode?: string | null;

  @Column({ name: 'account_type', type: 'varchar', length: 20, nullable: true })
  accountType?: AccountType | null;

  // Statutory
  @Column({ name: 'pan_number', type: 'varchar', length: 20, nullable: true })
  panNumber?: string | null;

  @Column({ name: 'aadhar_number', type: 'varchar', length: 20, nullable: true })
  aadharNumber?: string | null;

  // PF Details
  @Column({ name: 'pf_status', type: 'varchar', length: 20, nullable: true })
  pfStatus?: string | null;

  @Column({ name: 'pf_number', type: 'varchar', length: 50, nullable: true })
  pfNumber?: string | null;

  @Column({ name: 'pf_uan_number', type: 'varchar', length: 20, nullable: true })
  pfUanNumber?: string | null;

  @Column({ name: 'pf_join_date', type: 'date', nullable: true })
  pfJoinDate?: Date | null;

  @Column({ name: 'pf_account_name', type: 'varchar', length: 150, nullable: true })
  pfAccountName?: string | null;

  // ESI Details
  @Column({ name: 'esic_number', type: 'varchar', length: 20, nullable: true })
  esicNumber?: string | null;

  @Column({ name: 'esi_status', type: 'varchar', length: 20, nullable: true })
  esiStatus?: string | null;

  // PT Details
  @Column({ name: 'pt_state', type: 'varchar', length: 100, nullable: true })
  ptState?: string | null;

  @Column({ name: 'pt_registered_location', type: 'varchar', length: 100, nullable: true })
  ptRegisteredLocation?: string | null;

  // Emergency contact
  @Column({ name: 'emergency_contact_name', type: 'varchar', length: 150, nullable: true })
  emergencyContactName?: string | null;

  @Column({ name: 'emergency_contact_phone', type: 'varchar', length: 20, nullable: true })
  emergencyContactPhone?: string | null;

  @Column({ name: 'emergency_contact_relation', type: 'varchar', length: 50, nullable: true })
  emergencyContactRelation?: string | null;

  // Current salary (denormalized)
  @Column({ name: 'current_ctc', type: 'decimal', precision: 12, scale: 2, nullable: true })
  currentCtc?: number | null;

  // Relations
  @OneToOne('User', 'employee')
  user?: Relation<User>;

  @ManyToOne(() => Department, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @ManyToOne(() => Designation, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'designation_id' })
  designation?: Designation;

  @ManyToOne(() => WorkLocation, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'work_location_id' })
  workLocation?: WorkLocation;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reporting_manager_id' })
  reportingManager?: Employee;

  @OneToMany('EmployeeDocument', 'employee')
  documents?: Relation<EmployeeDocument[]>;
}

@Entity('employee_documents')
export class EmployeeDocument extends BaseEntity {
  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ name: 'document_type', type: 'varchar', length: 100 })
  documentType!: string;

  @Column({ name: 'document_name', type: 'varchar', length: 255 })
  documentName!: string;

  @Column({ name: 'file_url', type: 'text' })
  fileUrl!: string;

  @Column({ name: 'file_key', type: 'varchar', length: 500 })
  fileKey!: string;

  @Column({ name: 'uploaded_by', type: 'uuid', nullable: true })
  uploadedBy?: string | null;

  @ManyToOne('Employee', 'documents', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee!: Relation<Employee>;
}
