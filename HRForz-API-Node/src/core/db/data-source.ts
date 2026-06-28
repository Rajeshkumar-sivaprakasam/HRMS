import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from '../../config';

// Import all entities
import { User } from '../../models/user.entity';
import { Employee, EmployeeDocument } from '../../models/employee.entity';
import { Department, Designation, WorkLocation } from '../../models/department.entity';
import { Organisation } from '../../models/organisation.entity';
import { AttendanceRecord, AttendanceRegularisation, ShiftSchedule, EmployeeShiftAssignment } from '../../models/attendance.entity';
import { LeavePolicy, LeaveBalance, LeaveRequest } from '../../models/leave.entity';
import { PermissionPolicy, PermissionRequest } from '../../models/permission.entity';
import { Holiday } from '../../models/holiday.entity';
import { SalaryComponent, SalaryStructure, SalaryStructureComponent, EmployeeSalary, PayrollRun, Payslip, SalaryRevision, TDSDeclaration, FnFSettlement, PayrollAdjustment } from '../../models/payroll.entity';
import { HelpdeskCategory, HelpdeskTicket, HelpdeskComment } from '../../models/helpdesk.entity';
import { Announcement } from '../../models/announcement.entity';
import { Notification } from '../../models/notification.entity';
import { AuditLog } from '../../models/audit.entity';
import { EmployeeOnboarding, OnboardingDocument } from '../../models/onboarding.entity';
import { Nationality, BloodGroup, Relationship, MaritalStatus, HolidayType, AccountTypeLookup, Country, LeavePlan } from '../../models/lookup.entity';

export const entities = [
  User,
  Employee,
  EmployeeDocument,
  Department,
  Designation,
  WorkLocation,
  Organisation,
  AttendanceRecord,
  AttendanceRegularisation,
  ShiftSchedule,
  EmployeeShiftAssignment,
  LeavePolicy,
  LeaveBalance,
  LeaveRequest,
  PermissionPolicy,
  PermissionRequest,
  Holiday,
  SalaryComponent,
  SalaryStructure,
  SalaryStructureComponent,
  EmployeeSalary,
  PayrollRun,
  Payslip,
  SalaryRevision,
  TDSDeclaration,
  FnFSettlement,
  PayrollAdjustment,
  HelpdeskCategory,
  HelpdeskTicket,
  HelpdeskComment,
  Announcement,
  Notification,
  AuditLog,
  EmployeeOnboarding,
  OnboardingDocument,
  Nationality,
  BloodGroup,
  Relationship,
  MaritalStatus,
  HolidayType,
  AccountTypeLookup,
  Country,
  LeavePlan,
];

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: config.DATABASE_URL,
  synchronize: false, // Use migrations in production
  logging: config.DB_LOGGING,
  entities,
  migrations: ['src/migrations/*.ts'],
  poolSize: config.DB_POOL_SIZE,
  extra: {
    max: config.DB_POOL_SIZE,
  },
};

export const AppDataSource = new DataSource(dataSourceOptions);

export async function initializeDatabase(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
}

export function getRepository<T extends object>(entity: new () => T) {
  return AppDataSource.getRepository(entity);
}
