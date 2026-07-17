import { normalizeEmployeeType } from '../constants/payrollEmployeeTypes.js';

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function resolveMonthlySalary(employee) {
  const monthly = parseNumber(employee?.monthlySalary);
  if (monthly > 0) return monthly;
  return parseNumber(employee?.basicSalary);
}

/** Normalizes payload and keeps legacy basicSalary in sync for permanent/temporary employees. */
export function normalizePayrollEmployeePayload(body = {}) {
  const payload = { ...body };
  const employeeType = normalizeEmployeeType(payload.employeeType);
  payload.employeeType = employeeType;

  if (payload.employeeCode) {
    payload.employeeCode = String(payload.employeeCode).trim().toUpperCase();
  }
  if (payload.panNo) {
    payload.panNo = String(payload.panNo).trim().toUpperCase();
  }

  payload.monthlySalary = parseNumber(payload.monthlySalary);
  payload.dailyWage = parseNumber(payload.dailyWage);
  payload.contractStartDate = parseDate(payload.contractStartDate);
  payload.contractEndDate = parseDate(payload.contractEndDate);
  payload.dateOfJoining = parseDate(payload.dateOfJoining);
  payload.dateOfLeaving = parseDate(payload.dateOfLeaving);

  if (employeeType === 'permanent' || employeeType === 'temporary') {
    if (payload.monthlySalary <= 0 && parseNumber(payload.basicSalary) > 0) {
      payload.monthlySalary = parseNumber(payload.basicSalary);
    }
    payload.basicSalary = payload.monthlySalary;
    payload.dailyWage = 0;
    if (employeeType === 'permanent') {
      payload.contractStartDate = null;
      payload.contractEndDate = null;
    }
  } else if (employeeType === 'daily') {
    payload.monthlySalary = 0;
    payload.basicSalary = 0;
    payload.contractStartDate = null;
    payload.contractEndDate = null;
  }

  return payload;
}

export function validatePayrollEmployee(payload) {
  const errors = [];
  const employeeType = normalizeEmployeeType(payload.employeeType);

  if (!String(payload.employeeCode ?? '').trim()) errors.push('Employee code is required.');
  if (!String(payload.fullName ?? '').trim()) errors.push('Full name is required.');

  if (employeeType === 'permanent' || employeeType === 'temporary') {
    if (parseNumber(payload.monthlySalary) <= 0) {
      errors.push('Monthly salary is required for permanent and temporary employees.');
    }
  }

  if (employeeType === 'temporary') {
    if (!payload.contractStartDate) errors.push('Contract start date is required for temporary employees.');
    if (!payload.contractEndDate) errors.push('Contract end date is required for temporary employees.');
    if (payload.contractStartDate && payload.contractEndDate) {
      if (new Date(payload.contractStartDate) > new Date(payload.contractEndDate)) {
        errors.push('Contract end date must be on or after contract start date.');
      }
    }
  }

  if (employeeType === 'daily') {
    if (parseNumber(payload.dailyWage) <= 0) {
      errors.push('Daily wage rate is required for daily wage employees.');
    }
  }

  return { ok: errors.length === 0, errors };
}
