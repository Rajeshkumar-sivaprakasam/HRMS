import { Router, Request, Response, NextFunction } from 'express';
import { EmployeeService } from './employees.service';
import {
  EmployeeCreateRequestSchema,
  EmployeeUpdateRequestSchema,
  BankDetailsRequestSchema,
  StatutoryDetailsRequestSchema,
  EmployeeStatusUpdateRequestSchema,
} from './employees.schemas';
import { ListingRequestSchema } from '../../shared/schemas/listing';
import { ApiResponseBuilder } from '../../shared/schemas/response';
import { authMiddleware, hrOnly } from '../../core/middleware/auth';

const router = Router();
const employeeService = new EmployeeService();

// Create employee (HR only)
router.post('/', authMiddleware, hrOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = EmployeeCreateRequestSchema.parse(req.body);
    const emp = await employeeService.create(payload);
    res.status(201).json(ApiResponseBuilder.created(emp, 'Employee created'));
  } catch (err) {
    next(err);
  }
});

// List employees
router.post('/list', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = ListingRequestSchema.parse(req.body);
    const { items, total } = await employeeService.list(request);
    res.json(ApiResponseBuilder.paginated(items, total, request.pagination.page, request.pagination.size));
  } catch (err) {
    next(err);
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const emp = await employeeService.get(req.currentUser!.employeeId);
    res.json(ApiResponseBuilder.ok(emp));
  } catch (err) {
    next(err);
  }
});

// Get employee by ID
router.get('/:employeeId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const emp = await employeeService.get(req.params.employeeId);
    res.json(ApiResponseBuilder.ok(emp));
  } catch (err) {
    next(err);
  }
});

// Update employee
router.put('/:employeeId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = EmployeeUpdateRequestSchema.parse(req.body);
    const emp = await employeeService.update(req.params.employeeId, payload);
    res.json(ApiResponseBuilder.ok(emp, 'Employee updated'));
  } catch (err) {
    next(err);
  }
});

// Update bank details
router.put('/:employeeId/bank-details', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = BankDetailsRequestSchema.parse(req.body);
    const emp = await employeeService.updateBankDetails(req.params.employeeId, payload);
    res.json(ApiResponseBuilder.ok(emp, 'Bank details updated'));
  } catch (err) {
    next(err);
  }
});

// Update statutory details (HR only)
router.put('/:employeeId/statutory', authMiddleware, hrOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = StatutoryDetailsRequestSchema.parse(req.body);
    const emp = await employeeService.updateStatutory(req.params.employeeId, payload);
    res.json(ApiResponseBuilder.ok(emp, 'Statutory details updated'));
  } catch (err) {
    next(err);
  }
});

// Update status (HR only)
router.patch('/:employeeId/status', authMiddleware, hrOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = EmployeeStatusUpdateRequestSchema.parse(req.body);
    const emp = await employeeService.updateStatus(req.params.employeeId, payload);
    res.json(ApiResponseBuilder.ok(emp, 'Status updated'));
  } catch (err) {
    next(err);
  }
});

// Delete employee (HR only)
router.delete('/:employeeId', authMiddleware, hrOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await employeeService.softDelete(req.params.employeeId);
    res.json(ApiResponseBuilder.ok(null, 'Employee deleted'));
  } catch (err) {
    next(err);
  }
});

// Get employee documents
router.get('/:employeeId/documents', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docs = await employeeService.getDocuments(req.params.employeeId);
    res.json(ApiResponseBuilder.ok(docs));
  } catch (err) {
    next(err);
  }
});

// Delete document
router.delete('/:employeeId/documents/:docId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await employeeService.deleteDocument(req.params.employeeId, req.params.docId);
    res.json(ApiResponseBuilder.ok(null, 'Document deleted'));
  } catch (err) {
    next(err);
  }
});

export const employeesRouter = router;
