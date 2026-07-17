import { Account } from '../models/Account.js';
import { BankEntry } from '../models/BankEntry.js';
import { CashEntry } from '../models/CashEntry.js';
import { CreditNote } from '../models/CreditNote.js';
import { DebitNote } from '../models/DebitNote.js';
import { LedgerAccount } from '../models/LedgerAccount.js';
import { PaymentVoucher } from '../models/PaymentVoucher.js';
import { PurchaseInvoice } from '../models/PurchaseInvoice.js';
import { ReceiptVoucher } from '../models/ReceiptVoucher.js';
import { SalesInvoice } from '../models/SalesInvoice.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function parseMoney(value) {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  if (!Number.isNaN(n)) return roundMoney(n);
  const s = String(value).replace(/,/g, '').trim();
  const p = parseFloat(s);
  return Number.isNaN(p) ? 0 : roundMoney(p);
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

export function parseInputDate(value, fallback) {
  if (!value) return fallback;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const raw = String(value).trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (iso) {
    const local = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isNaN(local.getTime()) ? fallback : local;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function defaultFinancialYearRange() {
  const today = new Date();
  const year = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  return {
    from: new Date(year, 3, 1),
    to: new Date(year + 1, 2, 31)
  };
}

export function formatFilterDate(value) {
  const d = value instanceof Date && !Number.isNaN(value.getTime()) ? value : new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

export function formatLedgerDate(value) {
  const d = value instanceof Date && !Number.isNaN(value.getTime()) ? value : new Date();
  const day = String(d.getDate()).padStart(2, '0');
  return `${day}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
}

function isPosted(doc) {
  const status = String(doc?.status ?? 'Posted').trim();
  return status !== 'Cancelled' && status !== 'Draft';
}

function isCashMode(mode) {
  const m = String(mode ?? '').trim().toLowerCase();
  return m === '' || m === 'cash';
}

function isBankMode(mode) {
  return String(mode ?? '').trim().toLowerCase() === 'bank';
}

function voucherCashBank(value) {
  return String(value ?? 'CASH').trim().toUpperCase();
}

function getDocNet(doc) {
  const bill = Number(doc.billAmount);
  if (bill > 0) return roundMoney(bill);
  return parseMoney(doc.totals?.net ?? doc.totals?.saleAmount ?? doc.totals?.orderAmount);
}

function getCashInvoiceAmount(doc) {
  const paymentType = String(doc.paymentType ?? 'credit').toLowerCase();
  if (paymentType === 'cash') return getDocNet(doc);
  if (paymentType === 'partial') {
    const paid = Number(doc.paidAmount) || 0;
    if (paid > 0 && isCashMode(doc.paymentMode)) return roundMoney(paid);
  }
  return 0;
}

function getCreditInvoiceAmount(doc) {
  const paymentType = String(doc.paymentType ?? 'credit').toLowerCase();
  if (paymentType === 'cash') return 0;
  if (paymentType === 'partial') {
    const balance = Number(doc.balanceDue);
    if (balance > 0) return roundMoney(balance);
    return roundMoney(getDocNet(doc) - (Number(doc.paidAmount) || 0));
  }
  return getDocNet(doc);
}

function openingSignedBalance(account) {
  const amt = roundMoney(account.openingBalance);
  return account.openingBalanceType === 'Cr' ? -amt : amt;
}

function signedFromDrCr(dr, cr) {
  return roundMoney(dr) - roundMoney(cr);
}

function splitSignedAmount(signed, nature) {
  const isCreditNature = nature === 'liability' || nature === 'income';
  let normalized = signed;
  if (isCreditNature) normalized = -signed;

  if (normalized >= 0) {
    return { dr: roundMoney(normalized), cr: 0 };
  }
  return { dr: 0, cr: roundMoney(Math.abs(normalized)) };
}

function displayClosing(signed, nature) {
  const isCreditNature = nature === 'liability' || nature === 'income';
  let normalized = signed;
  if (isCreditNature) normalized = -signed;

  if (normalized >= 0) {
    return { dr: roundMoney(normalized), cr: 0, column: 'dr' };
  }
  return { dr: 0, cr: roundMoney(Math.abs(normalized)), column: 'cr' };
}

function lineSortKey(line) {
  const t = line.sortDate instanceof Date ? line.sortDate.getTime() : 0;
  return `${t}|${line.entryType}|${line.entryNo}|${line.particular}`;
}

function codesMatch(left, right) {
  return String(left ?? '').trim().toUpperCase() === String(right ?? '').trim().toUpperCase();
}

function namesMatch(left, right) {
  return String(left ?? '').trim().toLowerCase() === String(right ?? '').trim().toLowerCase();
}

export async function resolveLedgerAccount(accountCode) {
  const raw = String(accountCode ?? '').trim();
  if (!raw) throw new Error('Account code is required');

  const aliases = {
    CASH: '3',
    CASHINHAND: '3',
    'CASH IN HAND': '3'
  };
  const lookupCode = aliases[raw.toUpperCase()] ?? raw;

  let ledger = await LedgerAccount.findOne({
    $or: [{ code: lookupCode }, { code: new RegExp(`^${lookupCode}$`, 'i') }]
  }).lean();

  if (!ledger) {
    const party = await Account.findOne({
      $or: [{ code: lookupCode }, { code: new RegExp(`^${lookupCode}$`, 'i') }]
    }).lean();
    if (party) {
      return {
        code: party.code,
        name: party.name,
        kind: 'party',
        partyType: party.accountType,
        openingBalance: 0,
        openingBalanceType: 'Dr',
        nature: party.accountType === 'supplier' ? 'liability' : 'asset'
      };
    }
    throw new Error(`Account not found: ${accountCode}`);
  }

  const nature =
    ledger.kind === 'bank' || ledger.kind === 'cash'
      ? 'asset'
      : ledger.kind === 'party'
        ? ledger.partyType === 'supplier'
          ? 'liability'
          : 'asset'
        : 'asset';

  return {
    code: ledger.code,
    name: ledger.name,
    kind: ledger.kind,
    openingBalance: ledger.openingBalance,
    openingBalanceType: ledger.openingBalanceType,
    nature
  };
}

async function collectRawLines(account) {
  const lines = [];
  const code = account.code;
  const name = account.name;
  const kind = account.kind;

  const push = (line) => {
    if (!line.sortDate || !isPosted(line.source ?? {})) return;
    lines.push({
      sortDate: line.sortDate,
      entryDate: formatLedgerDate(line.sortDate),
      entryType: line.entryType ?? '',
      entryNo: line.entryNo ?? '',
      particular: line.particular ?? '',
      dr: roundMoney(line.dr),
      cr: roundMoney(line.cr),
      manualNo: line.manualNo ?? '',
      signed: signedFromDrCr(line.dr, line.cr)
    });
  };

  if (kind === 'cash') {
    const receipts = await ReceiptVoucher.find({ status: { $ne: 'Cancelled' } }).lean();
    receipts.forEach((v) => {
      if (voucherCashBank(v.cashBank) !== 'CASH') return;
      push({
        source: v,
        sortDate: v.voucherDate,
        entryType: 'Receipt Voucher',
        entryNo: String(v.voucherNo ?? ''),
        particular: v.narration?.trim() || `${v.accountName || 'Receipt'} — Receipt`,
        dr: v.amount,
        cr: 0,
        manualNo: v.refNo ?? ''
      });
    });

    const payments = await PaymentVoucher.find({ status: { $ne: 'Cancelled' } }).lean();
    payments.forEach((v) => {
      if (voucherCashBank(v.cashBank) !== 'CASH') return;
      push({
        source: v,
        sortDate: v.voucherDate,
        entryType: 'Payment Voucher',
        entryNo: String(v.voucherNo ?? ''),
        particular: v.narration?.trim() || `${v.accountName || 'Payment'} — Payment`,
        dr: 0,
        cr: v.amount,
        manualNo: v.refNo ?? ''
      });
    });

    const sales = await SalesInvoice.find({ status: { $ne: 'Cancelled' } }).lean();
    sales.forEach((doc) => {
      const amt = getCashInvoiceAmount(doc);
      if (amt <= 0) return;
      push({
        source: doc,
        sortDate: doc.invoiceDate || doc.createdAt,
        entryType: 'Cash Sale',
        entryNo: String(doc.docNo ?? ''),
        particular: `Sales Account Cash Sale${doc.customer ? ` — ${doc.customer}` : ''}`,
        dr: amt,
        cr: 0,
        manualNo: doc.formattedDocNo || String(doc.docNo ?? '')
      });
    });

    const purchases = await PurchaseInvoice.find({ status: { $ne: 'Cancelled' } }).lean();
    purchases.forEach((doc) => {
      const paymentType = String(doc.paymentType ?? 'credit').toLowerCase();
      if (paymentType !== 'cash') {
        if (paymentType === 'partial') {
          const paid = Number(doc.paidAmount) || 0;
          if (!(paid > 0 && isCashMode(doc.paymentMode))) return;
        } else return;
      }
      const amt =
        paymentType === 'partial'
          ? roundMoney(doc.paidAmount)
          : getDocNet(doc);
      if (amt <= 0) return;
      push({
        source: doc,
        sortDate: doc.invoiceDate || doc.createdAt,
        entryType: 'Cash Purchase',
        entryNo: String(doc.docNo ?? ''),
        particular: `Purchases Account Cash${doc.supplier ? ` — ${doc.supplier}` : ''}`,
        dr: 0,
        cr: amt,
        manualNo: doc.formattedDocNo || String(doc.docNo ?? '')
      });
    });

    const cashEntries = await CashEntry.find({ status: { $ne: 'Cancelled' } }).lean();
    cashEntries.forEach((doc) => {
      const amt = roundMoney(doc.totalAmount);
      if (amt <= 0) return;
      const firstLine = doc.lines?.[0]?.particular;
      push({
        source: doc,
        sortDate: doc.entryDate,
        entryType: 'Cash Expense',
        entryNo: String(doc.entryNo ?? ''),
        particular: firstLine || 'Cash expense',
        dr: 0,
        cr: amt,
        manualNo: String(doc.entryNo ?? '')
      });
    });
  } else if (kind === 'bank') {
    const receipts = await ReceiptVoucher.find({ status: { $ne: 'Cancelled' } }).lean();
    receipts.forEach((v) => {
      if (voucherCashBank(v.cashBank) === 'CASH') return;
      push({
        source: v,
        sortDate: v.voucherDate,
        entryType: 'Receipt Voucher',
        entryNo: String(v.voucherNo ?? ''),
        particular: v.narration?.trim() || `${v.accountName || 'Receipt'} — Bank receipt`,
        dr: v.amount,
        cr: 0,
        manualNo: v.refNo ?? ''
      });
    });

    const payments = await PaymentVoucher.find({ status: { $ne: 'Cancelled' } }).lean();
    payments.forEach((v) => {
      if (voucherCashBank(v.cashBank) === 'CASH') return;
      push({
        source: v,
        sortDate: v.voucherDate,
        entryType: 'Payment Voucher',
        entryNo: String(v.voucherNo ?? ''),
        particular: v.narration?.trim() || `${v.accountName || 'Payment'} — Bank payment`,
        dr: 0,
        cr: v.amount,
        manualNo: v.refNo ?? ''
      });
    });

    const bankEntries = await BankEntry.find({ status: { $ne: 'Cancelled' } }).lean();
    bankEntries.forEach((v) => {
      const isDeposit = voucherCashBank(v.cashBank) === 'DEPOSIT';
      push({
        source: v,
        sortDate: v.voucherDate,
        entryType: 'Bank Entry',
        entryNo: String(v.voucherNo ?? ''),
        particular: v.narration?.trim() || `${v.accountName || 'Bank'} — ${isDeposit ? 'Deposit' : 'Withdrawal'}`,
        dr: isDeposit ? v.amount : 0,
        cr: isDeposit ? 0 : v.amount,
        manualNo: v.refNo ?? ''
      });
    });

    const sales = await SalesInvoice.find({ status: { $ne: 'Cancelled' } }).lean();
    sales.forEach((doc) => {
      const paymentType = String(doc.paymentType ?? 'credit').toLowerCase();
      if (paymentType === 'cash' && isBankMode(doc.paymentMode)) {
        const amt = getDocNet(doc);
        if (amt <= 0) return;
        push({
          source: doc,
          sortDate: doc.invoiceDate || doc.createdAt,
          entryType: 'Bank Sale',
          entryNo: String(doc.docNo ?? ''),
          particular: `Sales Account Bank Sale — ${doc.customer || ''}`,
          dr: amt,
          cr: 0,
          manualNo: doc.formattedDocNo || String(doc.docNo ?? '')
        });
      }
    });
  } else if (kind === 'party') {
    const isSupplier = account.partyType === 'supplier' || account.nature === 'liability';

    if (!isSupplier) {
      const sales = await SalesInvoice.find({ status: { $ne: 'Cancelled' } }).lean();
      sales.forEach((doc) => {
        if (!namesMatch(doc.customer, name) && !codesMatch(doc.customerCode, code)) return;
        const amt = getCreditInvoiceAmount(doc);
        if (amt <= 0) return;
        push({
          source: doc,
          sortDate: doc.invoiceDate || doc.createdAt,
          entryType: 'Sales Invoice',
          entryNo: String(doc.docNo ?? ''),
          particular: `To ${doc.customer || name} — Sales`,
          dr: amt,
          cr: 0,
          manualNo: doc.formattedDocNo || String(doc.docNo ?? '')
        });
      });

      const receipts = await ReceiptVoucher.find({ status: { $ne: 'Cancelled' } }).lean();
      receipts.forEach((v) => {
        if (!codesMatch(v.accountCode, code) && !namesMatch(v.accountName, name)) return;
        push({
          source: v,
          sortDate: v.voucherDate,
          entryType: 'Receipt Voucher',
          entryNo: String(v.voucherNo ?? ''),
          particular: v.narration?.trim() || `Receipt from ${v.accountName || name}`,
          dr: 0,
          cr: v.amount,
          manualNo: v.refNo ?? ''
        });
      });

      const creditNotes = await CreditNote.find({ status: { $ne: 'Cancelled' } }).lean();
      creditNotes.forEach((v) => {
        if (!codesMatch(v.accountCode, code) && !namesMatch(v.accountName, name)) return;
        const amt = roundMoney(v.totalAmount || v.amount);
        push({
          source: v,
          sortDate: v.voucherDate,
          entryType: 'Credit Note',
          entryNo: String(v.voucherNo ?? ''),
          particular: v.narration?.trim() || `Credit note — ${v.accountName || name}`,
          dr: 0,
          cr: amt,
          manualNo: v.refNo ?? ''
        });
      });
    } else {
      const purchases = await PurchaseInvoice.find({ status: { $ne: 'Cancelled' } }).lean();
      purchases.forEach((doc) => {
        if (!namesMatch(doc.supplier, name) && !codesMatch(doc.supplierCode, code)) return;
        const paymentType = String(doc.paymentType ?? 'credit').toLowerCase();
        if (paymentType === 'cash') return;
        const amt =
          paymentType === 'partial'
            ? roundMoney(doc.balanceDue > 0 ? doc.balanceDue : getDocNet(doc) - (doc.paidAmount || 0))
            : getDocNet(doc);
        if (amt <= 0) return;
        push({
          source: doc,
          sortDate: doc.invoiceDate || doc.createdAt,
          entryType: 'Purchase Invoice',
          entryNo: String(doc.docNo ?? ''),
          particular: `By ${doc.supplier || name} — Purchase`,
          dr: 0,
          cr: amt,
          manualNo: doc.formattedDocNo || String(doc.docNo ?? '')
        });
      });

      const payments = await PaymentVoucher.find({ status: { $ne: 'Cancelled' } }).lean();
      payments.forEach((v) => {
        if (!codesMatch(v.accountCode, code) && !namesMatch(v.accountName, name)) return;
        push({
          source: v,
          sortDate: v.voucherDate,
          entryType: 'Payment Voucher',
          entryNo: String(v.voucherNo ?? ''),
          particular: v.narration?.trim() || `Payment to ${v.accountName || name}`,
          dr: v.amount,
          cr: 0,
          manualNo: v.refNo ?? ''
        });
      });

      const debitNotes = await DebitNote.find({ status: { $ne: 'Cancelled' } }).lean();
      debitNotes.forEach((v) => {
        if (!codesMatch(v.accountCode, code) && !namesMatch(v.accountName, name)) return;
        const amt = roundMoney(v.totalAmount || v.amount);
        push({
          source: v,
          sortDate: v.voucherDate,
          entryType: 'Debit Note',
          entryNo: String(v.voucherNo ?? ''),
          particular: v.narration?.trim() || `Debit note — ${v.accountName || name}`,
          dr: amt,
          cr: 0,
          manualNo: v.refNo ?? ''
        });
      });
    }
  }

  lines.sort((a, b) => lineSortKey(a).localeCompare(lineSortKey(b)));
  return lines;
}

async function ensureDefaultLedgerAccounts() {
  const count = await LedgerAccount.countDocuments();
  if (count > 0) return;

  await LedgerAccount.insertMany([
    {
      code: '3',
      name: 'Cash In Hand',
      kind: 'cash',
      openingBalance: 2050,
      openingBalanceType: 'Dr',
      activeStatus: true
    },
    {
      code: 'BANK',
      name: 'Bank Account',
      kind: 'bank',
      openingBalance: 0,
      openingBalanceType: 'Dr',
      activeStatus: true
    }
  ]);
}

export async function listLedgerAccountOptions() {
  await ensureDefaultLedgerAccounts();
  const system = await LedgerAccount.find({ activeStatus: { $ne: false } })
    .sort({ code: 1 })
    .lean();
  const parties = await Account.find({ activeStatus: { $ne: false } })
    .sort({ code: 1 })
    .lean();

  const options = [];
  system.forEach((a) => {
    options.push({
      code: a.code,
      name: a.name,
      display: `${a.code} — ${a.name}`,
      kind: a.kind
    });
  });
  parties.forEach((a) => {
    options.push({
      code: a.code,
      name: a.name,
      display: `${a.code} — ${a.name}`,
      kind: 'party'
    });
  });
  return options;
}

export async function computeAccountClosingBalance(accountCode, dateFrom, dateTo) {
  await ensureDefaultLedgerAccounts();
  const fy = defaultFinancialYearRange();
  const fromDate = startOfDay(parseInputDate(dateFrom, fy.from));
  const toDate = endOfDay(parseInputDate(dateTo, fy.to));

  if (fromDate > toDate) {
    throw new Error('From date cannot be after to date');
  }

  const account = await resolveLedgerAccount(accountCode);
  const rawLines = await collectRawLines(account);

  const openingBase = openingSignedBalance(account);
  let beforeSum = 0;
  rawLines.forEach((line) => {
    const d = startOfDay(line.sortDate);
    if (d < fromDate) beforeSum += line.signed;
  });

  const openingSigned = roundMoney(openingBase + beforeSum);
  const openingSplit = splitSignedAmount(openingSigned, account.nature);

  const periodLines = rawLines.filter((line) => {
    const d = startOfDay(line.sortDate);
    return d >= fromDate && d <= toDate;
  });

  let periodDr = 0;
  let periodCr = 0;
  periodLines.forEach((line) => {
    periodDr += line.dr;
    periodCr += line.cr;
  });
  periodDr = roundMoney(periodDr);
  periodCr = roundMoney(periodCr);

  const closingSigned = roundMoney(openingSigned + periodDr - periodCr);
  const closingDisplay = displayClosing(closingSigned, account.nature);

  return {
    accountCode: account.code,
    accountName: account.name,
    openingSplit,
    periodDr,
    periodCr,
    closingDisplay,
    periodLines,
    fromDate,
    toDate,
    transactionCount: periodLines.length
  };
}

export async function computeLedgerReport(params) {
  const summary = await computeAccountClosingBalance(
    params.accountCode,
    params.dateFrom,
    params.dateTo
  );

  const {
    accountCode,
    accountName,
    openingSplit,
    periodDr,
    periodCr,
    closingDisplay,
    periodLines,
    fromDate,
    toDate
  } = summary;

  const rows = [
    {
      rowType: 'opening',
      entryDate: formatLedgerDate(fromDate),
      entryType: '',
      entryNo: '',
      particular: 'Opening Balance',
      dr: openingSplit.dr,
      cr: openingSplit.cr,
      manualNo: '',
      drDisplay: openingSplit.dr > 0 ? formatAmount(openingSplit.dr) : '',
      crDisplay: openingSplit.cr > 0 ? formatAmount(openingSplit.cr) : ''
    },
    ...periodLines.map((line) => ({
      rowType: 'transaction',
      entryDate: line.entryDate,
      entryType: line.entryType,
      entryNo: line.entryNo,
      particular: line.particular,
      dr: line.dr,
      cr: line.cr,
      manualNo: line.manualNo,
      drDisplay: line.dr > 0 ? formatAmount(line.dr) : '',
      crDisplay: line.cr > 0 ? formatAmount(line.cr) : '0'
    })),
    {
      rowType: 'total',
      entryDate: formatLedgerDate(toDate),
      entryType: '',
      entryNo: '',
      particular: 'Total :',
      dr: periodDr,
      cr: periodCr,
      manualNo: '',
      drDisplay: formatAmount(periodDr),
      crDisplay: formatAmount(periodCr)
    },
    {
      rowType: 'closing',
      entryDate: formatLedgerDate(toDate),
      entryType: '',
      entryNo: '',
      particular: 'Closing Balance',
      dr: closingDisplay.dr,
      cr: closingDisplay.cr,
      manualNo: '',
      drDisplay: closingDisplay.column === 'dr' ? formatAmount(closingDisplay.dr) : '',
      crDisplay: closingDisplay.column === 'cr' ? formatAmount(closingDisplay.cr) : '',
      closingColumn: closingDisplay.column
    }
  ];

  const totalMovementDr = roundMoney(openingSplit.dr + periodDr);
  const totalMovementCr = roundMoney(openingSplit.cr + periodCr);

  return {
    accountCode,
    accountName,
    dateFrom: fromDate.toISOString(),
    dateTo: toDate.toISOString(),
    dateFromLabel: formatFilterDate(fromDate),
    dateToLabel: formatFilterDate(toDate),
    openingBalance: openingSplit.dr > 0 ? openingSplit.dr : openingSplit.cr,
    openingBalanceSide: openingSplit.dr > 0 ? 'Dr' : openingSplit.cr > 0 ? 'Cr' : 'Dr',
    periodDebit: periodDr,
    periodCredit: periodCr,
    footerDebit: totalMovementDr,
    footerCredit: totalMovementCr,
    closingBalance: closingDisplay.column === 'dr' ? closingDisplay.dr : closingDisplay.cr,
    closingBalanceSide: closingDisplay.column === 'dr' ? 'Dr' : 'Cr',
    rows,
    transactionCount: periodLines.length
  };
}

function formatAmount(value) {
  const n = roundMoney(value);
  if (n === 0) return '0';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}
