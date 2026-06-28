import crypto from 'crypto';
import { EmployeeRepository } from './employees.repository';
import { AuthRepository } from '../auth/auth.repository';
import {
  EmployeeCreateRequest,
  EmployeeUpdateRequest,
  BankDetailsRequest,
  StatutoryDetailsRequest,
  EmployeeStatusUpdateRequest,
  EmployeeResponse,
  EmployeeListItem,
} from './employees.schemas';
import { Employee, EmployeeDocument, User } from '../../models';
import { Conflict, NotFound } from '../../core/exceptions';
import { hashPassword } from '../../core/security/password';
import { Role } from '../../shared/enums';
import { ListingRequest, getListingParams } from '../../shared/schemas/listing';
import { CurrentUser } from '../../core/middleware/auth';
import { FindOptionsWhere } from 'typeorm';

export class EmployeeService {
  private repo: EmployeeRepository;
  private authRepo: AuthRepository;

  constructor() {
    this.repo = new EmployeeRepository();
    this.authRepo = new AuthRepository();
  }

  async create(payload: EmployeeCreateRequest): Promise<EmployeeResponse> {
    const existing = await this.repo.getByEmail(payload.email);
    if (existing) {
      throw new Conflict('Employee with this email already exists');
    }

    const code = await this.repo.getNextEmployeeCode();

    const employee = new Employee();
    employee.employeeCode = code;
    Object.assign(employee, payload);

    const savedEmployee = await this.repo.save(employee);

    // Create user account
    const activationToken = crypto.randomBytes(32).toString('base64url');
    const tempPassword = crypto.randomBytes(16).toString('base64url');

    const user = new User();
    user.email = payload.email;
    user.hashedPassword = await hashPassword(tempPassword);
    user.role = Role.EMPLOYEE;
    user.isActive = false;
    user.isEmailVerified = false;
    user.activationToken = activationToken;
    user.employeeId = savedEmployee.id;

    await this.authRepo.save(user);

    // TODO: Queue email task to send activation link

    return this.toResponse(savedEmployee);
  }

  async get(employeeId: string): Promise<EmployeeResponse> {
    const emp = await this.repo.getById(employeeId);
    if (!emp) {
      throw new NotFound('Employee');
    }
    return this.toResponse(emp);
  }

  async list(request: ListingRequest): Promise<{ items: EmployeeListItem[]; total: number }> {
    const params = getListingParams(request);
    const filter = request.filter as any;

    const conditions: FindOptionsWhere<Employee> = {};
    if (filter.status) conditions.status = filter.status;
    if (filter.departmentId) conditions.departmentId = filter.departmentId;
    if (filter.employmentType) conditions.employmentType = filter.employmentType;

    const [employees, total] = await this.repo.list({
      conditions,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      offset: params.offset,
      limit: params.limit,
      paginate: params.paginate,
    });

    const items = employees.map((e) => this.toListItem(e));
    return { items, total };
  }

  async update(employeeId: string, payload: EmployeeUpdateRequest): Promise<EmployeeResponse> {
    const emp = await this.repo.getById(employeeId);
    if (!emp) {
      throw new NotFound('Employee');
    }

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined) {
        (emp as any)[key] = value;
      }
    });

    const saved = await this.repo.save(emp);
    return this.toResponse(saved);
  }

  async updateBankDetails(
    employeeId: string,
    payload: BankDetailsRequest
  ): Promise<EmployeeResponse> {
    const emp = await this.repo.getById(employeeId);
    if (!emp) {
      throw new NotFound('Employee');
    }

    emp.bankName = payload.bankName;
    emp.accountNumber = payload.accountNumber;
    emp.ifscCode = payload.ifscCode;
    emp.accountType = payload.accountType;

    const saved = await this.repo.save(emp);
    return this.toResponse(saved);
  }

  async updateStatutory(
    employeeId: string,
    payload: StatutoryDetailsRequest
  ): Promise<EmployeeResponse> {
    const emp = await this.repo.getById(employeeId);
    if (!emp) {
      throw new NotFound('Employee');
    }

    if (payload.panNumber !== undefined) emp.panNumber = payload.panNumber;
    if (payload.aadharNumber !== undefined) emp.aadharNumber = payload.aadharNumber;
    if (payload.pfUanNumber !== undefined) emp.pfUanNumber = payload.pfUanNumber;
    if (payload.esicNumber !== undefined) emp.esicNumber = payload.esicNumber;

    const saved = await this.repo.save(emp);
    return this.toResponse(saved);
  }

  async updateStatus(
    employeeId: string,
    payload: EmployeeStatusUpdateRequest
  ): Promise<EmployeeResponse> {
    const emp = await this.repo.getById(employeeId);
    if (!emp) {
      throw new NotFound('Employee');
    }

    emp.status = payload.status;
    if (payload.dateOfLeaving) {
      emp.dateOfLeaving = payload.dateOfLeaving;
    }

    const saved = await this.repo.save(emp);
    return this.toResponse(saved);
  }

  async softDelete(employeeId: string): Promise<void> {
    const emp = await this.repo.getById(employeeId);
    if (!emp) {
      throw new NotFound('Employee');
    }
    await this.repo.softDelete(emp);
  }

  async getDocuments(employeeId: string): Promise<EmployeeDocument[]> {
    await this.get(employeeId); // Verify employee exists
    return this.repo.getDocuments(employeeId);
  }

  async uploadDocument(
    employeeId: string,
    documentType: string,
    documentName: string,
    fileKey: string,
    fileUrl: string,
    actor: CurrentUser
  ): Promise<EmployeeDocument> {
    await this.get(employeeId);

    const doc = new EmployeeDocument();
    doc.employeeId = employeeId;
    doc.documentType = documentType;
    doc.documentName = documentName;
    doc.fileKey = fileKey;
    doc.fileUrl = fileUrl;
    doc.uploadedBy = actor.employeeId;

    return this.repo.addDocument(doc);
  }

  async deleteDocument(employeeId: string, docId: string): Promise<void> {
    await this.get(employeeId);

    const doc = await this.repo.getDocument(docId);
    if (!doc || doc.employeeId !== employeeId) {
      throw new NotFound('Document');
    }

    await this.repo.deleteDocument(doc);
  }

  private toResponse(emp: Employee): EmployeeResponse {
    return {
      id: emp.id,
      employeeCode: emp.employeeCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone || null,
      gender: emp.gender || null,
      dateOfBirth: emp.dateOfBirth || null,
      status: emp.status,
      employmentType: emp.employmentType,
      workLocationType: emp.workLocationType,
      dateOfJoining: emp.dateOfJoining || null,
      dateOfLeaving: emp.dateOfLeaving || null,
      probationEndDate: emp.probationEndDate || null,
      noticePeriodDays: emp.noticePeriodDays || null,
      departmentId: emp.departmentId || null,
      designationId: emp.designationId || null,
      workLocationId: emp.workLocationId || null,
      reportingManagerId: emp.reportingManagerId || null,
      addressLine1: emp.addressLine1 || null,
      addressLine2: emp.addressLine2 || null,
      city: emp.city || null,
      state: emp.state || null,
      pincode: emp.pincode || null,
      country: emp.country,
      bankName: emp.bankName || null,
      accountNumber: emp.accountNumber || null,
      ifscCode: emp.ifscCode || null,
      accountType: emp.accountType || null,
      panNumber: emp.panNumber || null,
      aadharNumber: emp.aadharNumber || null,
      pfUanNumber: emp.pfUanNumber || null,
      esicNumber: emp.esicNumber || null,
      emergencyContactName: emp.emergencyContactName || null,
      emergencyContactPhone: emp.emergencyContactPhone || null,
      emergencyContactRelation: emp.emergencyContactRelation || null,
      currentCtc: emp.currentCtc || null,
      profilePictureUrl: emp.profilePictureUrl || null,
    };
  }

  private toListItem(emp: Employee): EmployeeListItem {
    return {
      id: emp.id,
      employeeCode: emp.employeeCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone || null,
      status: emp.status,
      employmentType: emp.employmentType,
      dateOfJoining: emp.dateOfJoining || null,
      departmentId: emp.departmentId || null,
      designationId: emp.designationId || null,
      workLocationId: emp.workLocationId || null,
      profilePictureUrl: emp.profilePictureUrl || null,
      departmentName: emp.department?.name || null,
      designationName: emp.designation?.name || null,
      workLocationName: emp.workLocation?.name || null,
      workLocationCity: emp.workLocation?.city || null,
    };
  }
}
