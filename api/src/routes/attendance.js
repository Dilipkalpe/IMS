import { Router } from 'express';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { PayrollEmployee } from '../models/PayrollEmployee.js';
import { periodBoundsFromMonth, summarizeAttendance } from '../services/payrollCalc.js';

const router = Router();

function toPayload(body) {
  const { _id, id, __v, createdAt, updatedAt, ...rest } = body ?? {};
  return rest;
}

function normalizeDate(d) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) {
    throw Object.assign(new Error('Invalid attendanceDate'), { status: 400 });
  }
  return dt;
}

router.get('/', async (req, res, next) => {
  try {
    const { employeeCode, dateFrom, dateTo, periodMonth, page = 1, limit = 500 } = req.query;
    const filter = {};
    if (employeeCode) filter.employeeCode = String(employeeCode).trim().toUpperCase();
    if (periodMonth) {
      const { periodFrom, periodTo } = periodBoundsFromMonth(periodMonth);
      filter.attendanceDate = { $gte: periodFrom, $lte: periodTo };
    } else if (dateFrom || dateTo) {
      filter.attendanceDate = {};
      if (dateFrom) filter.attendanceDate.$gte = normalizeDate(dateFrom);
      if (dateTo) filter.attendanceDate.$lte = normalizeDate(dateTo);
    }
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.max(Number(limit) || 500, 1);
    const skip = (pageNum - 1) * limitNum;
    const [items, total] = await Promise.all([
      AttendanceRecord.find(filter).sort({ attendanceDate: -1, employeeCode: 1 }).skip(skip).limit(limitNum).lean(),
      AttendanceRecord.countDocuments(filter)
    ]);
    res.json({ items, total, page: pageNum, limit: limitNum });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.get('/summary', async (req, res, next) => {
  try {
    const { employeeCode, periodMonth } = req.query;
    if (!employeeCode || !periodMonth) {
      return res.status(400).json({ error: 'employeeCode and periodMonth are required' });
    }
    const code = String(employeeCode).trim().toUpperCase();
    const { periodFrom, periodTo } = periodBoundsFromMonth(periodMonth);
    const records = await AttendanceRecord.find({
      employeeCode: code,
      attendanceDate: { $gte: periodFrom, $lte: periodTo }
    }).lean();
    res.json({
      employeeCode: code,
      periodMonth,
      ...summarizeAttendance(records, periodFrom, periodTo)
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = toPayload(req.body);
    payload.employeeCode = String(payload.employeeCode || '').trim().toUpperCase();
    payload.attendanceDate = normalizeDate(payload.attendanceDate);
    if (!payload.employeeCode) return res.status(400).json({ error: 'employeeCode is required' });
    if (!payload.employeeName) {
      const emp = await PayrollEmployee.findOne({ employeeCode: payload.employeeCode }).lean();
      payload.employeeName = emp?.fullName || '';
    }
    const item = await AttendanceRecord.create(payload);
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Attendance already exists for this date' });
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.post('/bulk', async (req, res, next) => {
  try {
    const rows = req.body?.records ?? req.body ?? [];
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'records array is required' });
    }
    const results = { inserted: 0, updated: 0, errors: [] };
    for (const row of rows) {
      try {
        const payload = toPayload(row);
        payload.employeeCode = String(payload.employeeCode || '').trim().toUpperCase();
        payload.attendanceDate = normalizeDate(payload.attendanceDate);
        const existing = await AttendanceRecord.findOne({
          employeeCode: payload.employeeCode,
          attendanceDate: payload.attendanceDate
        });
        if (existing) {
          await AttendanceRecord.updateOne({ _id: existing._id }, payload);
          results.updated += 1;
        } else {
          await AttendanceRecord.create(payload);
          results.inserted += 1;
        }
      } catch (e) {
        results.errors.push({ row, error: e.message });
      }
    }
    res.json(results);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const payload = toPayload(req.body);
    if (payload.attendanceDate) payload.attendanceDate = normalizeDate(payload.attendanceDate);
    if (payload.employeeCode) payload.employeeCode = String(payload.employeeCode).trim().toUpperCase();
    const item = await AttendanceRecord.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });
    if (!item) return res.status(404).json({ error: 'Attendance record not found' });
    res.json(item);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const item = await AttendanceRecord.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Attendance record not found' });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

export default router;
