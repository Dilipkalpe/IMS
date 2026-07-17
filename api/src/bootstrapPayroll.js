import { PayrollEmployee } from './models/PayrollEmployee.js';
import { Account } from './models/Account.js';

const sampleEmployees = [
  {
    employeeCode: 'EMP-1001',
    fullName: 'John Smith',
    department: 'Sales',
    designation: 'Executive',
    panNo: 'ABCDE1234A',
    employeeType: 'permanent',
    monthlySalary: 28000,
    basicSalary: 28000,
    hraPercent: 40,
    bonusPercent: 5,
    tdsPercent: 5,
    linkedUserEmployeeId: 'EMP-1001',
    activeStatus: true
  },
  {
    employeeCode: 'EMP-1002',
    fullName: 'Rahul Pillai',
    department: 'Sales',
    designation: 'Manager',
    panNo: 'ABCDE1234B',
    employeeType: 'temporary',
    monthlySalary: 45000,
    basicSalary: 45000,
    contractStartDate: new Date('2026-01-01'),
    contractEndDate: new Date('2026-12-31'),
    hraPercent: 40,
    bonusPercent: 10,
    tdsPercent: 10,
    linkedUserEmployeeId: 'EMP-1002',
    activeStatus: true
  },
  {
    employeeCode: 'EMP-1003',
    fullName: 'Kavita Mehta',
    department: 'Purchase',
    designation: 'Officer',
    panNo: 'ABCDE1234C',
    employeeType: 'permanent',
    monthlySalary: 32000,
    basicSalary: 32000,
    hraPercent: 40,
    tdsPercent: 5,
    linkedUserEmployeeId: 'EMP-1003',
    activeStatus: true
  },
  {
    employeeCode: 'EMP-1004',
    fullName: 'Store Keeper',
    department: 'Inventory',
    designation: 'Store Keeper',
    panNo: 'ABCDE1234D',
    employeeType: 'daily',
    dailyWage: 850,
    basicSalary: 0,
    monthlySalary: 0,
    hraPercent: 0,
    tdsPercent: 0,
    linkedUserEmployeeId: 'EMP-1004',
    activeStatus: true
  },
  {
    employeeCode: 'EMP-1005',
    fullName: 'Finance User',
    department: 'Finance',
    designation: 'Accountant',
    panNo: 'ABCDE1234E',
    employeeType: 'permanent',
    monthlySalary: 38000,
    basicSalary: 38000,
    hraPercent: 40,
    tdsPercent: 8,
    linkedUserEmployeeId: 'EMP-1005',
    activeStatus: true
  }
];

const payrollAccounts = [
  { accountType: 'supplier', code: 'SAL-PAYROLL', name: 'Salary Payroll Payable', activeStatus: true },
  { accountType: 'supplier', code: 'PF-PAYABLE', name: 'PF Payable', activeStatus: true },
  { accountType: 'supplier', code: 'ESI-PAYABLE', name: 'ESI Payable', activeStatus: true },
  { accountType: 'supplier', code: 'TDS-PAYABLE', name: 'TDS Payable', activeStatus: true }
];

export async function bootstrapPayrollIfEmpty() {
  const empCount = await PayrollEmployee.countDocuments();
  if (empCount === 0) {
    await PayrollEmployee.insertMany(
      sampleEmployees.map((e) => ({
        ...e,
        payableAccountCode: `PAY-${e.employeeCode}`,
        payableAccountName: e.fullName
      }))
    );
    console.log(`Payroll: seeded ${sampleEmployees.length} employees`);
  }

  for (const acc of payrollAccounts) {
    const exists = await Account.findOne({ code: acc.code });
    if (!exists) await Account.create(acc);
  }

  for (const e of sampleEmployees) {
    const payCode = `PAY-${e.employeeCode}`;
    const exists = await Account.findOne({ code: payCode });
    if (!exists) {
      await Account.create({
        accountType: 'supplier',
        code: payCode,
        name: `${e.fullName} (Salary)`,
        panNo: e.panNo,
        activeStatus: true
      });
    }
  }
}
