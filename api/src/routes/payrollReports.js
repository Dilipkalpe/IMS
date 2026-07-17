import { Router } from 'express';
import { PayrollRun } from '../models/PayrollRun.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { PayrollEmployee } from '../models/PayrollEmployee.js';
import { employeeTypeLabel, normalizeEmployeeType } from '../constants/payrollEmployeeTypes.js';
import { periodBoundsFromMonth, summarizeAttendance } from '../services/payrollCalc.js';
import { buildPayslipHtml } from '../services/payslipDocument.js';
import { Company } from '../models/Company.js';

const router = Router();

function payslipPayload(run, line, employee) {
  return {
    companyNote: 'Salary payslip — statutory deductions as per employee profile',
    runNo: run.runNo,
    periodMonth: run.periodMonth,
    periodFrom: run.periodFrom,
    periodTo: run.periodTo,
    processedAt: run.processedAt,
    status: run.status,
    employee,
    payslip: line
  };
}

router.get('/payslip-by-period', async (req, res, next) => {
  try {
    const { periodMonth, employeeCode, runNo } = req.query;
    const code = String(employeeCode || '').trim().toUpperCase();
    if (!code) return res.status(400).json({ error: 'employeeCode is required' });

    let run;
    if (runNo) {
      run = await PayrollRun.findOne({ runNo: Number(runNo) }).lean();
    } else if (periodMonth) {
      run = await PayrollRun.findOne({
        periodMonth: String(periodMonth),
        status: { $ne: 'cancelled' }
      })
        .sort({ runNo: -1 })
        .lean();
    } else {
      return res.status(400).json({ error: 'periodMonth or runNo is required' });
    }

    if (!run) {
      return res.status(404).json({
        error: periodMonth
          ? `No payroll processed for ${periodMonth}. Use Payroll Processing → Process Payroll first.`
          : `Payroll run #${runNo} not found. Process payroll for a month first.`
      });
    }

    const line = (run.lines ?? []).find((l) => l.employeeCode === code);
    if (!line) {
      return res.status(404).json({
        error: `${code} is not on payroll run #${run.runNo} (${run.periodMonth}). Check employee was active and included in the run.`
      });
    }
    const employee = await PayrollEmployee.findOne({ employeeCode: code }).lean();
    res.json(payslipPayload(run, line, employee));
  } catch (err) {
    next(err);
  }
});

router.get('/payslip/:runNo/:employeeCode', async (req, res, next) => {
  try {
    const runNo = Number(req.params.runNo);
    const employeeCode = String(req.params.employeeCode).trim().toUpperCase();
    const run = await PayrollRun.findOne({ runNo }).lean();
    if (!run) {
      return res.status(404).json({
        error: `Payroll run #${runNo} not found. Go to Payroll Processing → Process Payroll for a month, then open Payslip again.`
      });
    }
    const line = (run.lines ?? []).find((l) => l.employeeCode === employeeCode);
    if (!line) return res.status(404).json({ error: 'Employee not on this payroll run' });
    const employee = await PayrollEmployee.findOne({ employeeCode }).lean();
    res.json(payslipPayload(run, line, employee));
  } catch (err) {
    next(err);
  }
});

router.get('/tax-summary', async (req, res, next) => {
  try {
    const { periodMonth, runNo } = req.query;
    let run;
    if (runNo) {
      run = await PayrollRun.findOne({ runNo: Number(runNo) }).lean();
    } else if (periodMonth) {
      run = await PayrollRun.findOne({ periodMonth: String(periodMonth), status: { $ne: 'cancelled' } })
        .sort({ runNo: -1 })
        .lean();
    } else {
      return res.status(400).json({ error: 'periodMonth or runNo is required' });
    }
    if (!run) return res.status(404).json({ error: 'Payroll run not found' });

    const rows = (run.lines ?? []).map((l) => ({
      employeeCode: l.employeeCode,
      employeeName: l.employeeName,
      employeeType: l.employeeType ?? 'permanent',
      employeeTypeLabel: l.employeeTypeLabel ?? employeeTypeLabel(l.employeeType),
      panNo: l.panNo,
      gross: l.earnings?.gross ?? 0,
      taxableIncome: l.taxableIncome ?? 0,
      tds: l.deductions?.tds ?? 0,
      pf: l.deductions?.pf ?? 0,
      esi: l.deductions?.esi ?? 0,
      professionalTax: l.deductions?.professionalTax ?? 0,
      netPay: l.netPay ?? 0
    }));

    res.json({
      runNo: run.runNo,
      periodMonth: run.periodMonth,
      totals: {
        gross: run.totalGross,
        tds: run.totalTds,
        pf: run.totalPf,
        esi: run.totalEsi,
        net: run.totalNet
      },
      employees: rows
    });
  } catch (err) {
    next(err);
  }
});

router.get('/staff-hours', async (req, res, next) => {
  try {
    const { periodMonth } = req.query;
    if (!periodMonth) return res.status(400).json({ error: 'periodMonth is required (YYYY-MM)' });
    const { periodFrom, periodTo } = periodBoundsFromMonth(periodMonth);
    const employees = await PayrollEmployee.find({ activeStatus: true }).lean();
    const rows = [];
    for (const emp of employees) {
      const records = await AttendanceRecord.find({
        employeeCode: emp.employeeCode,
        attendanceDate: { $gte: periodFrom, $lte: periodTo }
      }).lean();
      rows.push({
        employeeCode: emp.employeeCode,
        employeeName: emp.fullName,
        employeeType: normalizeEmployeeType(emp.employeeType),
        employeeTypeLabel: employeeTypeLabel(emp.employeeType),
        department: emp.department,
        ...summarizeAttendance(records, periodFrom, periodTo),
      });
    }
    res.json({ periodMonth, periodFrom, periodTo, employees: rows });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.get('/payslip-html', async (req, res, next) => {
  try {
    const { periodMonth, employeeCode, runNo } = req.query;
    const code = String(employeeCode || '').trim().toUpperCase();
    if (!code) return res.status(400).json({ error: 'employeeCode is required' });

    let run;
    if (runNo) {
      run = await PayrollRun.findOne({ runNo: Number(runNo) }).lean();
    } else if (periodMonth) {
      run = await PayrollRun.findOne({ periodMonth: String(periodMonth), status: { $ne: 'cancelled' } })
        .sort({ runNo: -1 })
        .lean();
    } else {
      return res.status(400).json({ error: 'periodMonth or runNo is required' });
    }
    if (!run) return res.status(404).json({ error: 'Payroll run not found' });

    const line = (run.lines ?? []).find((l) => l.employeeCode === code);
    if (!line) return res.status(404).json({ error: 'Employee not on payroll run' });
    const employee = await PayrollEmployee.findOne({ employeeCode: code }).lean();
    const company = await Company.findOne({ isDefault: true }).lean();
    const report = {
      runNo: run.runNo,
      periodMonth: run.periodMonth,
      employee,
      payslip: line
    };
    const html = buildPayslipHtml(report, company?.businessName || 'IMS Company');
    res.type('html').send(html);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

export default router;
