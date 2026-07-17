import {
  calcEmployeePayrollLine,
  periodBoundsFromMonth,
  summarizeAttendance
} from '../services/payrollCalc.js';
const DEPARTMENTS = ['Production', 'Sales', 'Purchase', 'Inventory', 'Finance', 'Administration'];
const DESIGNATIONS = ['Operator', 'Executive', 'Officer', 'Manager', 'Supervisor', 'Assistant'];

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function pickType(index) {
  if (index % 17 === 0) return 'daily';
  if (index % 11 === 0) return 'temporary';
  return 'permanent';
}

/**
 * @param {number} count
 * @param {{ startDate: Date, endDate: Date }} range
 */
export function generatePayrollEmployees(count, range) {
  const employees = [];
  const startDate = range.startDate;
  const endDate = range.endDate;

  for (let i = 0; i < count; i += 1) {
    const code = `EMP-SEED-${String(i + 1).padStart(5, '0')}`;
    const employeeType = pickType(i);
    const dept = DEPARTMENTS[i % DEPARTMENTS.length];
    const designation = DESIGNATIONS[i % DESIGNATIONS.length];
    const monthlySalary = 18000 + (i % 40) * 750;
    const dailyWage = 650 + (i % 20) * 25;

    const row = {
      employeeCode: code,
      fullName: `Payroll Worker ${i + 1}`,
      employeeType,
      department: dept,
      designation,
      email: `${code.toLowerCase()}@ims.local`,
      phone: `98${String(10000000 + i).slice(-8)}`,
      panNo: `ABCDE${String(1000 + (i % 9000)).slice(-4)}${String.fromCharCode(65 + (i % 26))}`,
      payableAccountCode: `PAY-${code}`,
      payableAccountName: `Payroll Worker ${i + 1}`,
      hraPercent: employeeType === 'daily' ? 0 : 40,
      bonusPercent: employeeType === 'daily' ? 0 : 5 + (i % 6),
      tdsPercent: 5 + (i % 8),
      pfApplicable: employeeType !== 'daily',
      esiApplicable: employeeType !== 'daily',
      ptApplicable: employeeType !== 'daily',
      paidDaysPerMonth: 26,
      activeStatus: true
    };

    if (employeeType === 'daily') {
      row.dailyWage = dailyWage;
      row.monthlySalary = 0;
      row.basicSalary = 0;
    } else {
      row.monthlySalary = monthlySalary;
      row.basicSalary = monthlySalary;
      row.dailyWage = 0;
    }

    if (employeeType === 'temporary') {
      const joinOffset = i % 90;
      row.contractStartDate = addDays(startDate, joinOffset);
      row.contractEndDate = addDays(endDate, -(i % 60));
      if (row.contractEndDate < row.contractStartDate) {
        row.contractEndDate = addDays(row.contractStartDate, 180);
      }
    }

    employees.push(row);
  }

  return employees;
}

export function payrollPayableAccounts(employees) {
  const statutory = [
    { accountType: 'supplier', code: 'SAL-PAYROLL', name: 'Salary Payroll Payable', activeStatus: true },
    { accountType: 'supplier', code: 'PF-PAYABLE', name: 'PF Payable', activeStatus: true },
    { accountType: 'supplier', code: 'ESI-PAYABLE', name: 'ESI Payable', activeStatus: true },
    { accountType: 'supplier', code: 'TDS-PAYABLE', name: 'TDS Payable', activeStatus: true }
  ];

  const employeeAccounts = employees.map((e) => ({
    accountType: 'supplier',
    code: e.payableAccountCode,
    name: `${e.fullName} (Salary)`,
    panNo: e.panNo,
    activeStatus: true
  }));

  return [...statutory, ...employeeAccounts];
}

/**
 * @param {number} offset Global record index (0-based).
 * @param {number} count Records in this slice.
 * @param {object[]} employees
 * @param {{ startDate: Date, endDate: Date }} range
 */
export function generateAttendanceSlice(offset, count, employees, range) {
  const records = [];
  const spanDays = Math.max(
    1,
    Math.floor((range.endDate.getTime() - range.startDate.getTime()) / (24 * 60 * 60 * 1000))
  );

  for (let i = 0; i < count; i += 1) {
    const globalIndex = offset + i;
    const emp = employees[globalIndex % employees.length];
    const dayOffset = Math.floor(globalIndex / employees.length);
    const attendanceDate = addDays(range.startDate, dayOffset);
    attendanceDate.setHours(12, 0, 0, 0);

    const roll = globalIndex % 20;
    let status = 'present';
    let workedHours = 8;
    let overtimeHours = 0;
    if (roll === 0) {
      status = 'absent';
      workedHours = 0;
    } else if (roll === 1) {
      status = 'leave';
      workedHours = 0;
    } else if (roll === 2) {
      status = 'half_day';
      workedHours = 4;
    } else if (roll === 3) {
      status = 'holiday';
      workedHours = 0;
    } else if (roll % 9 === 0) {
      overtimeHours = 2;
    }

    records.push({
      employeeCode: emp.employeeCode,
      employeeName: emp.fullName,
      attendanceDate,
      status,
      checkIn: status === 'present' || status === 'half_day' ? '09:00' : '',
      checkOut: status === 'present' ? '18:00' : status === 'half_day' ? '13:00' : '',
      workedHours,
      overtimeHours,
      remark: status === 'leave' ? 'Approved leave' : ''
    });
  }

  return records;
}

/** Merge attendance rows into per employee-month buckets for payroll run generation. */
export function mergeAttendanceBuckets(buckets, records) {
  for (const record of records) {
    const key = `${record.employeeCode}|${monthKey(record.attendanceDate)}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(record);
  }
}

/**
 * @param {object[]} employees
 * @param {Map<string, object[]>} attendanceBuckets
 * @param {{ startDate: Date, endDate: Date, months: number }} range
 */
export function generatePayrollRuns(employees, attendanceBuckets, range) {
  const runs = [];
  let runNo = 0;

  const cursor = new Date(range.startDate);
  cursor.setDate(1);
  const end = new Date(range.endDate);

  while (cursor <= end) {
    const periodMonth = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`;
    const { periodFrom, periodTo } = periodBoundsFromMonth(periodMonth);

    const lines = [];
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let totalTds = 0;
    let totalPf = 0;
    let totalEsi = 0;

    for (const employee of employees) {
      const key = `${employee.employeeCode}|${periodMonth}`;
      const monthRecords = attendanceBuckets.get(key) ?? [];
      const summary = summarizeAttendance(monthRecords, periodFrom, periodTo);
      const line = calcEmployeePayrollLine(employee, summary, {
        periodFrom,
        periodTo,
        bonusPercent: 0
      });
      line.payslipNo = `PS-${periodMonth.replace('-', '')}-${employee.employeeCode}`;

      totalGross += line.earnings.gross;
      totalDeductions += line.deductions.total;
      totalNet += line.netPay;
      totalTds += line.deductions.tds;
      totalPf += line.deductions.pf;
      totalEsi += line.deductions.esi;
      lines.push(line);
    }

    runNo += 1;
    const isRecent = periodTo >= addDays(range.endDate, -60);
    runs.push({
      runNo,
      periodMonth,
      periodFrom,
      periodTo,
      processedAt: periodTo,
      processedBy: 'seed',
      status: isRecent ? 'processed' : 'paid',
      employeeCount: lines.length,
      totalGross: round2(totalGross),
      totalDeductions: round2(totalDeductions),
      totalNet: round2(totalNet),
      totalTds: round2(totalTds),
      totalPf: round2(totalPf),
      totalEsi: round2(totalEsi),
      remark: `Seeded payroll ${periodMonth}`,
      lines
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return { runs, runNo };
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export function resolvePayrollEmployeeCount(attendanceTarget, months, spanDays) {
  const fromEnv = Number(process.env.SEED_PAYROLL_EMPLOYEES);
  if (fromEnv > 0) return fromEnv;
  const targetDaysPerMonth = 22;
  const minBySpan = Math.ceil(attendanceTarget / (spanDays + 1));
  const minByMonth = Math.ceil(attendanceTarget / (months * targetDaysPerMonth));
  return Math.max(200, minBySpan, minByMonth);
}
