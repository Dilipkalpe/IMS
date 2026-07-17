import {
  computeAccountClosingBalance,
  formatFilterDate,
  listLedgerAccountOptions,
  parseInputDate
} from './ledgerReport.js';

function defaultFinancialYearRange() {
  const today = new Date();
  const year = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  return {
    from: new Date(year, 3, 1),
    to: new Date(year + 1, 2, 31)
  };
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function formatAmount(value) {
  const n = roundMoney(value);
  if (n === 0) return '0';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export async function computeTrialBalance(params) {
  const includeZero = String(params.includeZero || '').toLowerCase() === 'true';
  const fy = defaultFinancialYearRange();
  const fromDate = startOfDay(parseInputDate(params.dateFrom, fy.from));
  const toDate = endOfDay(parseInputDate(params.dateTo, fy.to));
  if (fromDate > toDate) {
    throw new Error('From date cannot be after to date');
  }

  const accounts = await listLedgerAccountOptions();
  if (accounts.length === 0) {
    return {
      dateFromLabel: '',
      dateToLabel: '',
      rows: [],
      totalDr: 0,
      totalCr: 0,
      totalDrDisplay: '0',
      totalCrDisplay: '0',
      accountCount: 0,
      isBalanced: true
    };
  }

  const summaries = [];
  let dateFromLabel = '';
  let dateToLabel = '';

  for (const account of accounts) {
    try {
      const summary = await computeAccountClosingBalance(
        account.code,
        params.dateFrom,
        params.dateTo
      );
      if (!dateFromLabel) {
        dateFromLabel = formatFilterDate(summary.fromDate);
        dateToLabel = formatFilterDate(summary.toDate);
      }
      summaries.push(summary);
    } catch {
      // Skip accounts that cannot be resolved.
    }
  }

  if (summaries.length === 0) {
    return {
      dateFromLabel: formatFilterDate(fromDate),
      dateToLabel: formatFilterDate(toDate),
      rows: [],
      totalDr: 0,
      totalCr: 0,
      totalDrDisplay: '0',
      totalCrDisplay: '0',
      accountCount: 0,
      isBalanced: true
    };
  }

  const rows = [];
  let totalDr = 0;
  let totalCr = 0;

  for (const summary of summaries) {
    const net = roundMoney(summary.periodDr - summary.periodCr);
    const dr = net > 0 ? net : 0;
    const cr = net < 0 ? Math.abs(net) : 0;
    const hasActivity = summary.transactionCount > 0 || summary.periodDr > 0 || summary.periodCr > 0;

    if (!includeZero && dr === 0 && cr === 0 && !hasActivity) {
      continue;
    }

    rows.push({
      serialNo: rows.length + 1,
      accountCode: summary.accountCode,
      accountName: summary.accountName,
      drBalance: dr,
      crBalance: cr,
      drDisplay: dr > 0 ? formatAmount(dr) : '0',
      crDisplay: cr > 0 ? formatAmount(cr) : '0',
      debitDisplay: dr > 0 ? formatAmount(dr) : '0',
      creditDisplay: cr > 0 ? formatAmount(cr) : '0'
    });

    totalDr = roundMoney(totalDr + dr);
    totalCr = roundMoney(totalCr + cr);
  }

  rows.forEach((row, index) => {
    row.serialNo = index + 1;
  });

  return {
    dateFromLabel,
    dateToLabel,
    rows,
    totalDr,
    totalCr,
    totalDrDisplay: formatAmount(totalDr),
    totalCrDisplay: formatAmount(totalCr),
    accountCount: rows.length,
    isBalanced: Math.abs(totalDr - totalCr) < 0.01
  };
}
