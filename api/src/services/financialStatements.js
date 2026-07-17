import { Account } from '../models/Account.js';
import { LedgerAccount } from '../models/LedgerAccount.js';
import {
  computeAccountClosingBalance,
  formatFilterDate,
  listLedgerAccountOptions,
  parseInputDate
} from './ledgerReport.js';

function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
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

function defaultFinancialYearRange() {
  const today = new Date();
  const year = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  return {
    from: new Date(year, 3, 1),
    to: new Date(year + 1, 2, 31)
  };
}

function classifyNominal(name) {
  const key = String(name || '').toLowerCase();
  const directIncomePattern = /(sales|job work income|direct income)/;
  const directExpensePattern = /(purchase|opening stock|freight inward|carriage inward|direct expense|raw material|consumable)/;
  const incomePattern = /(income|sales|commission received|discount received|interest received|other income)/;
  const expensePattern = /(expense|salary|wages|rent|electricity|depreciation|insurance|repairs|printing|stationery|travel|freight|carriage outward|commission paid|interest paid)/;

  if (directIncomePattern.test(key)) return { side: 'income', trading: 'direct' };
  if (directExpensePattern.test(key)) return { side: 'expense', trading: 'direct' };
  if (incomePattern.test(key)) return { side: 'income', trading: 'indirect' };
  if (expensePattern.test(key)) return { side: 'expense', trading: 'indirect' };
  return { side: 'expense', trading: 'indirect' };
}

function pushRow(rows, section, particular, debit, credit) {
  const dr = roundMoney(debit);
  const cr = roundMoney(credit);
  if (dr <= 0 && cr <= 0) return;
  rows.push({
    serialNo: rows.length + 1,
    section,
    particular: String(particular || ''),
    debit: dr,
    credit: cr,
    debitDisplay: dr === 0 ? '' : dr.toFixed(2),
    creditDisplay: cr === 0 ? '' : cr.toFixed(2)
  });
}

async function collectStatementBuckets(dateFrom, dateTo) {
  const options = await listLedgerAccountOptions();
  const partyAccounts = await Account.find({ activeStatus: { $ne: false } })
    .select('code accountType')
    .lean();
  const ledgerAccounts = await LedgerAccount.find({ activeStatus: { $ne: false } })
    .select('code kind name')
    .lean();

  const partyTypeByCode = new Map(
    partyAccounts.map((a) => [String(a.code || '').toUpperCase(), String(a.accountType || '').toLowerCase()])
  );
  const nominalByCode = new Map(
    ledgerAccounts
      .filter((a) => String(a.kind || '').toLowerCase() === 'nominal')
      .map((a) => [String(a.code || '').toUpperCase(), a])
  );

  const buckets = [];
  for (const option of options) {
    try {
      const summary = await computeAccountClosingBalance(option.code, dateFrom, dateTo);
      const periodDr = roundMoney(summary.periodDr || 0);
      const periodCr = roundMoney(summary.periodCr || 0);
      const closingDr = roundMoney(summary.closingDisplay?.dr || 0);
      const closingCr = roundMoney(summary.closingDisplay?.cr || 0);
      const upperCode = String(option.code || '').toUpperCase();
      const kind = String(option.kind || '').toLowerCase();
      buckets.push({
        code: option.code,
        name: option.name,
        kind,
        partyType: partyTypeByCode.get(upperCode) || '',
        nominal: nominalByCode.get(upperCode) || null,
        periodDr,
        periodCr,
        closingDr,
        closingCr
      });
    } catch {
      // Skip accounts that cannot be resolved or have ledger errors.
    }
  }

  return buckets;
}

function computeTradingStatement(buckets) {
  const rows = [];
  let debitTotal = 0;
  let creditTotal = 0;

  for (const account of buckets) {
    const isNominal = account.kind === 'nominal';
    if (!isNominal) continue;

    const classification = classifyNominal(account.nominal?.name || account.name);
    if (classification.trading !== 'direct') continue;

    const expenseAmt = Math.max(0, roundMoney(account.periodDr - account.periodCr));
    const incomeAmt = Math.max(0, roundMoney(account.periodCr - account.periodDr));

    if (classification.side === 'expense' && expenseAmt > 0) {
      pushRow(rows, 'Direct Expenses', account.name, expenseAmt, 0);
      debitTotal = roundMoney(debitTotal + expenseAmt);
    } else if (classification.side === 'income' && incomeAmt > 0) {
      pushRow(rows, 'Direct Incomes', account.name, 0, incomeAmt);
      creditTotal = roundMoney(creditTotal + incomeAmt);
    }
  }

  const grossProfit = roundMoney(creditTotal - debitTotal);
  if (grossProfit > 0) {
    pushRow(rows, 'Transfer', 'Gross Profit c/d', grossProfit, 0);
    debitTotal = roundMoney(debitTotal + grossProfit);
  } else if (grossProfit < 0) {
    const grossLoss = Math.abs(grossProfit);
    pushRow(rows, 'Transfer', 'Gross Loss c/d', 0, grossLoss);
    creditTotal = roundMoney(creditTotal + grossLoss);
  }

  return {
    rows,
    debitTotal,
    creditTotal,
    grossProfit
  };
}

function computeProfitLossStatement(buckets, openingGrossProfit = 0, includeTradingSplit = false) {
  const rows = [];
  let debitTotal = 0;
  let creditTotal = 0;

  if (openingGrossProfit > 0) {
    pushRow(rows, 'Income', 'Gross Profit b/d', 0, openingGrossProfit);
    creditTotal = roundMoney(creditTotal + openingGrossProfit);
  } else if (openingGrossProfit < 0) {
    const grossLoss = Math.abs(openingGrossProfit);
    pushRow(rows, 'Expense', 'Gross Loss b/d', grossLoss, 0);
    debitTotal = roundMoney(debitTotal + grossLoss);
  }

  for (const account of buckets) {
    const isNominal = account.kind === 'nominal';
    if (!isNominal) continue;

    const classification = classifyNominal(account.nominal?.name || account.name);
    if (includeTradingSplit && classification.trading === 'direct') continue;

    const expenseAmt = Math.max(0, roundMoney(account.periodDr - account.periodCr));
    const incomeAmt = Math.max(0, roundMoney(account.periodCr - account.periodDr));

    if (classification.side === 'expense' && expenseAmt > 0) {
      pushRow(rows, includeTradingSplit ? 'Indirect Expenses' : 'Expenses', account.name, expenseAmt, 0);
      debitTotal = roundMoney(debitTotal + expenseAmt);
    } else if (classification.side === 'income' && incomeAmt > 0) {
      pushRow(rows, includeTradingSplit ? 'Indirect Incomes' : 'Incomes', account.name, 0, incomeAmt);
      creditTotal = roundMoney(creditTotal + incomeAmt);
    }
  }

  const netProfit = roundMoney(creditTotal - debitTotal);
  if (netProfit > 0) {
    pushRow(rows, 'Transfer', 'Net Profit transferred to Balance Sheet', netProfit, 0);
    debitTotal = roundMoney(debitTotal + netProfit);
  } else if (netProfit < 0) {
    const netLoss = Math.abs(netProfit);
    pushRow(rows, 'Transfer', 'Net Loss transferred to Balance Sheet', 0, netLoss);
    creditTotal = roundMoney(creditTotal + netLoss);
  }

  return {
    rows,
    debitTotal,
    creditTotal,
    netProfit
  };
}

function computeBalanceSheetStatement(buckets, netProfit) {
  const rows = [];
  let assetsTotal = 0;
  let liabilitiesTotal = 0;

  for (const account of buckets) {
    if (account.kind === 'nominal') continue;

    let side = 'asset';
    if (account.kind === 'party') {
      side = account.partyType === 'supplier' ? 'liability' : 'asset';
    } else if (account.kind === 'cash' || account.kind === 'bank') {
      side = 'asset';
    }

    const dr = roundMoney(account.closingDr);
    const cr = roundMoney(account.closingCr);
    const amount = side === 'asset' ? dr : cr;
    if (amount <= 0) continue;

    if (side === 'asset') {
      pushRow(rows, 'Assets', account.name, amount, 0);
      assetsTotal = roundMoney(assetsTotal + amount);
    } else {
      pushRow(rows, 'Liabilities', account.name, 0, amount);
      liabilitiesTotal = roundMoney(liabilitiesTotal + amount);
    }
  }

  if (netProfit > 0) {
    pushRow(rows, 'Liabilities', 'Current Year Profit', 0, netProfit);
    liabilitiesTotal = roundMoney(liabilitiesTotal + netProfit);
  } else if (netProfit < 0) {
    const loss = Math.abs(netProfit);
    pushRow(rows, 'Assets', 'Current Year Loss', loss, 0);
    assetsTotal = roundMoney(assetsTotal + loss);
  }

  if (assetsTotal > liabilitiesTotal) {
    const diff = roundMoney(assetsTotal - liabilitiesTotal);
    pushRow(rows, 'Liabilities', 'Balancing Figure', 0, diff);
    liabilitiesTotal = roundMoney(liabilitiesTotal + diff);
  } else if (liabilitiesTotal > assetsTotal) {
    const diff = roundMoney(liabilitiesTotal - assetsTotal);
    pushRow(rows, 'Assets', 'Balancing Figure', diff, 0);
    assetsTotal = roundMoney(assetsTotal + diff);
  }

  return {
    rows,
    debitTotal: assetsTotal,
    creditTotal: liabilitiesTotal
  };
}

async function buildReport(dateFrom, dateTo, mode) {
  const buckets = await collectStatementBuckets(dateFrom, dateTo);
  const trading = computeTradingStatement(buckets);
  const withTrading = computeProfitLossStatement(buckets, trading.grossProfit, true);

  let report;
  if (mode === 'trading-account') {
    report = {
      title: 'Trading Account',
      ...trading,
      netAmount: trading.grossProfit,
      netAmountLabel: trading.grossProfit >= 0 ? 'Gross Profit' : 'Gross Loss'
    };
  } else if (mode === 'profit-loss') {
    const plain = computeProfitLossStatement(buckets, 0, false);
    report = {
      title: 'Profit & Loss Account',
      ...plain,
      netAmount: plain.netProfit,
      netAmountLabel: plain.netProfit >= 0 ? 'Net Profit' : 'Net Loss'
    };
  } else if (mode === 'profit-loss-trading') {
    report = {
      title: 'Profit & Loss with Trading',
      ...withTrading,
      netAmount: withTrading.netProfit,
      netAmountLabel: withTrading.netProfit >= 0 ? 'Net Profit' : 'Net Loss',
      grossProfit: trading.grossProfit
    };
  } else if (mode === 'balance-sheet') {
    const balance = computeBalanceSheetStatement(buckets, withTrading.netProfit);
    report = {
      title: 'Balance Sheet',
      ...balance,
      netAmount: roundMoney(balance.creditTotal - balance.debitTotal),
      netAmountLabel: 'Difference'
    };
  } else {
    throw new Error(`Unknown financial statement mode: ${mode}`);
  }

  return report;
}

export async function computeFinancialStatementReport(params, mode) {
  const fy = defaultFinancialYearRange();
  const fromDate = startOfDay(parseInputDate(params.dateFrom, fy.from));
  const toDate = endOfDay(parseInputDate(params.dateTo, fy.to));

  if (fromDate > toDate) {
    throw new Error('From date cannot be after to date');
  }

  const report = await buildReport(fromDate, toDate, mode);
  return {
    title: report.title,
    dateFrom: fromDate.toISOString(),
    dateTo: toDate.toISOString(),
    dateFromLabel: formatFilterDate(fromDate),
    dateToLabel: formatFilterDate(toDate),
    rows: report.rows,
    debitTotal: report.debitTotal,
    creditTotal: report.creditTotal,
    netAmount: report.netAmount,
    netAmountLabel: report.netAmountLabel,
    grossProfit: report.grossProfit ?? 0,
    count: report.rows.length
  };
}
