import { Router } from 'express';
import { PayrollEmployee } from '../models/PayrollEmployee.js';
import {
  normalizePayrollEmployeePayload,
  validatePayrollEmployee,
} from '../services/payrollEmployeeValidation.js';

const router = Router();

function toPayload(body) {
  const { _id, id, __v, createdAt, updatedAt, ...rest } = body ?? {};
  return rest;
}

function validationError(res, errors) {
  return res.status(400).json({ error: errors.join(' '), errors });
}

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 200, search, activeOnly, employeeType } = req.query;
    const filter = {};
    if (activeOnly === 'true') filter.activeStatus = true;
    if (employeeType) filter.employeeType = String(employeeType).trim().toLowerCase();
    if (search) {
      const term = String(search).trim();
      filter.$or = [
        { employeeCode: new RegExp(term, 'i') },
        { fullName: new RegExp(term, 'i') },
        { department: new RegExp(term, 'i') },
        { panNo: new RegExp(term, 'i') },
      ];
    }
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.max(Number(limit) || 200, 1);
    const skip = (pageNum - 1) * limitNum;
    const [items, total] = await Promise.all([
      PayrollEmployee.find(filter).sort({ employeeCode: 1 }).skip(skip).limit(limitNum).lean(),
      PayrollEmployee.countDocuments(filter),
    ]);
    res.json({ items, total, page: pageNum, limit: limitNum });
  } catch (err) {
    next(err);
  }
});

router.get('/by-code/:code', async (req, res, next) => {
  try {
    const item = await PayrollEmployee.findOne({
      employeeCode: String(req.params.code).trim().toUpperCase(),
    }).lean();
    if (!item) return res.status(404).json({ error: 'Employee not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = normalizePayrollEmployeePayload(toPayload(req.body));
    const validation = validatePayrollEmployee(payload);
    if (!validation.ok) return validationError(res, validation.errors);
    const item = await PayrollEmployee.create(payload);
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Employee code already exists' });
    next(err);
  }
});

router.put('/by-code/:code', async (req, res, next) => {
  try {
    const payload = normalizePayrollEmployeePayload(toPayload(req.body));
    const validation = validatePayrollEmployee({
      ...payload,
      employeeCode: payload.employeeCode || String(req.params.code).trim().toUpperCase(),
    });
    if (!validation.ok) return validationError(res, validation.errors);
    const item = await PayrollEmployee.findOneAndUpdate(
      { employeeCode: String(req.params.code).trim().toUpperCase() },
      payload,
      { new: true, runValidators: true },
    );
    if (!item) return res.status(404).json({ error: 'Employee not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/by-code/:code', async (req, res, next) => {
  try {
    const item = await PayrollEmployee.findOneAndDelete({
      employeeCode: String(req.params.code).trim().toUpperCase(),
    });
    if (!item) return res.status(404).json({ error: 'Employee not found' });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

export default router;
