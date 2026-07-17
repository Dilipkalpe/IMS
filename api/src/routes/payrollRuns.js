import { Router } from 'express';
import { PayrollRun } from '../models/PayrollRun.js';
import { PayrollEmployee } from '../models/PayrollEmployee.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { getNextSequence } from '../models/Counter.js';
import {
  calcEmployeePayrollLine,
  periodBoundsFromMonth,
  summarizeAttendance
} from '../services/payrollCalc.js';
import { postPayrollPayment } from '../services/payrollFinance.js';

const router = Router();

function toPayload(body) {
  const { _id, id, __v, createdAt, updatedAt, ...rest } = body ?? {};
  return rest;
}

function rollupRun(lines) {
  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;
  let totalTds = 0;
  let totalPf = 0;
  let totalEsi = 0;
  for (const line of lines) {
    totalGross += Number(line.earnings?.gross) || 0;
    totalDeductions += Number(line.deductions?.total) || 0;
    totalNet += Number(line.netPay) || 0;
    totalTds += Number(line.deductions?.tds) || 0;
    totalPf += Number(line.deductions?.pf) || 0;
    totalEsi += Number(line.deductions?.esi) || 0;
  }
  return {
    employeeCount: lines.length,
    totalGross: Math.round(totalGross * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    totalNet: Math.round(totalNet * 100) / 100,
    totalTds: Math.round(totalTds * 100) / 100,
    totalPf: Math.round(totalPf * 100) / 100,
    totalEsi: Math.round(totalEsi * 100) / 100
  };
}

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 100, periodMonth, status } = req.query;
    const filter = {};
    if (periodMonth) filter.periodMonth = String(periodMonth);
    if (status) filter.status = String(status);
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.max(Number(limit) || 100, 1);
    const skip = (pageNum - 1) * limitNum;
    const [items, total] = await Promise.all([
      PayrollRun.find(filter).sort({ runNo: -1 }).skip(skip).limit(limitNum).lean(),
      PayrollRun.countDocuments(filter)
    ]);
    res.json({ items, total, page: pageNum, limit: limitNum });
  } catch (err) {
    next(err);
  }
});

router.get('/next-no', async (_req, res, next) => {
  try {
    const runNo = await getNextSequence('payroll_run', 1);
    res.json({ runNo });
  } catch (err) {
    next(err);
  }
});

router.get('/by-no/:runNo', async (req, res, next) => {
  try {
    const item = await PayrollRun.findOne({ runNo: Number(req.params.runNo) }).lean();
    if (!item) return res.status(404).json({ error: 'Payroll run not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.post('/process', async (req, res, next) => {
  try {
    const { periodMonth, bonusPercent, processedBy, remark, reprocess } = req.body ?? {};
    const { periodFrom, periodTo, periodMonth: monthKey } = periodBoundsFromMonth(periodMonth);

    const existing = await PayrollRun.findOne({ periodMonth: monthKey, status: { $ne: 'cancelled' } });
    if (existing) {
      const allowReplace = reprocess === true || reprocess === 'true';
      if (!allowReplace) {
        return res.status(409).json({
          error: `Payroll already exists for ${monthKey} (run #${existing.runNo}).`,
          existingRunNo: existing.runNo,
          existingStatus: existing.status,
          canReprocess: existing.status !== 'paid'
        });
      }
      if (existing.status === 'paid') {
        return res.status(409).json({
          error: `Payroll for ${monthKey} is paid (run #${existing.runNo}). Paid runs cannot be reprocessed.`,
          existingRunNo: existing.runNo,
          existingStatus: existing.status,
          canReprocess: false
        });
      }
      await PayrollRun.deleteOne({ runNo: existing.runNo });
    }

    const employees = await PayrollEmployee.find({ activeStatus: true }).lean();
    if (employees.length === 0) {
      return res.status(400).json({ error: 'No active payroll employees found' });
    }

    const lines = [];
    const runNo = await getNextSequence('payroll_run', 1);

    for (const employee of employees) {
      const records = await AttendanceRecord.find({
        employeeCode: employee.employeeCode,
        attendanceDate: { $gte: periodFrom, $lte: periodTo }
      }).lean();
      const att = summarizeAttendance(records, periodFrom, periodTo);
      const line = calcEmployeePayrollLine(employee, att, { bonusPercent, periodFrom, periodTo });
      line.payslipNo = `PS-${monthKey.replace('-', '')}-${employee.employeeCode}`;
      lines.push(line);
    }

    const totals = rollupRun(lines);
    const run = await PayrollRun.create({
      runNo,
      periodMonth: monthKey,
      periodFrom,
      periodTo,
      processedAt: new Date(),
      processedBy: processedBy || '',
      status: 'processed',
      remark: remark || '',
      lines,
      ...totals
    });

    res.status(201).json(run);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.post('/by-no/:runNo/post-payment', async (req, res, next) => {
  try {
    const result = await postPayrollPayment(Number(req.params.runNo), req.body ?? {});
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.put('/by-no/:runNo/status', async (req, res, next) => {
  try {
    const { status } = req.body ?? {};
    const item = await PayrollRun.findOneAndUpdate(
      { runNo: Number(req.params.runNo) },
      { status },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'Payroll run not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/by-no/:runNo', async (req, res, next) => {
  try {
    const runNo = Number(req.params.runNo);
    const item = await PayrollRun.findOne({ runNo });
    if (!item) return res.status(404).json({ error: 'Payroll run not found' });
    if (item.status === 'paid') {
      return res.status(400).json({ error: 'Paid payroll runs cannot be deleted' });
    }
    await PayrollRun.deleteOne({ runNo });
    res.json({ deleted: true, runNo });
  } catch (err) {
    next(err);
  }
});

export default router;
