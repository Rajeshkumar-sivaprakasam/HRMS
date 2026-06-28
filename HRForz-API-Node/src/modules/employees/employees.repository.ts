import { Repository, IsNull, Like, FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '../../core/db';
import { Employee, EmployeeDocument } from '../../models';
import { config } from '../../config';

export class EmployeeRepository {
  private repo: Repository<Employee>;
  private docRepo: Repository<EmployeeDocument>;

  constructor() {
    this.repo = AppDataSource.getRepository(Employee);
    this.docRepo = AppDataSource.getRepository(EmployeeDocument);
  }

  async getByEmail(email: string): Promise<Employee | null> {
    return this.repo.findOne({
      where: { email, deletedAt: IsNull() },
    });
  }

  async getById(id: string): Promise<Employee | null> {
    return this.repo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['department', 'designation', 'workLocation', 'reportingManager'],
    });
  }

  async getNextEmployeeCode(): Promise<string> {
    const result = await this.repo
      .createQueryBuilder('e')
      .select('MAX(CAST(SUBSTRING(e.employee_code, :prefixLen + 1) AS INTEGER))', 'maxCode')
      .where('e.employee_code LIKE :prefix', {
        prefix: `${config.EMPLOYEE_CODE_PREFIX}%`,
        prefixLen: config.EMPLOYEE_CODE_PREFIX.length,
      })
      .getRawOne();

    const next = (result?.maxCode || 0) + 1;
    return `${config.EMPLOYEE_CODE_PREFIX}${next.toString().padStart(config.EMPLOYEE_CODE_PADDING, '0')}`;
  }

  async save(employee: Employee): Promise<Employee> {
    return this.repo.save(employee);
  }

  async softDelete(employee: Employee): Promise<void> {
    employee.deletedAt = new Date();
    await this.repo.save(employee);
  }

  async list(options: {
    conditions: FindOptionsWhere<Employee>;
    sortBy: string;
    sortOrder: 'ASC' | 'DESC';
    offset: number;
    limit: number;
    paginate: boolean;
  }): Promise<[Employee[], number]> {
    const qb = this.repo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.department', 'department')
      .leftJoinAndSelect('e.designation', 'designation')
      .leftJoinAndSelect('e.workLocation', 'workLocation')
      .where('e.deleted_at IS NULL');

    // Apply conditions
    if (options.conditions.status) {
      qb.andWhere('e.status = :status', { status: options.conditions.status });
    }
    if (options.conditions.departmentId) {
      qb.andWhere('e.department_id = :deptId', { deptId: options.conditions.departmentId });
    }
    if (options.conditions.employmentType) {
      qb.andWhere('e.employment_type = :empType', { empType: options.conditions.employmentType });
    }

    // Sort
    const sortColumn = this.getSortColumn(options.sortBy);
    qb.orderBy(sortColumn, options.sortOrder);

    if (options.paginate) {
      qb.skip(options.offset).take(options.limit);
    }

    return qb.getManyAndCount();
  }

  private getSortColumn(sortBy: string): string {
    const mapping: Record<string, string> = {
      createdAt: 'e.created_at',
      firstName: 'e.first_name',
      lastName: 'e.last_name',
      email: 'e.email',
      employeeCode: 'e.employee_code',
      dateOfJoining: 'e.date_of_joining',
    };
    return mapping[sortBy] || 'e.created_at';
  }

  async getDocuments(employeeId: string): Promise<EmployeeDocument[]> {
    return this.docRepo.find({
      where: { employeeId },
      order: { createdAt: 'DESC' },
    });
  }

  async addDocument(doc: EmployeeDocument): Promise<EmployeeDocument> {
    return this.docRepo.save(doc);
  }

  async getDocument(docId: string): Promise<EmployeeDocument | null> {
    return this.docRepo.findOne({ where: { id: docId } });
  }

  async deleteDocument(doc: EmployeeDocument): Promise<void> {
    await this.docRepo.remove(doc);
  }
}
