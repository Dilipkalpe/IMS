import { PayrollRun } from '../models/PayrollRun.js';
import { PayrollEmployee } from '../models/PayrollEmployee.js';
import { PaymentVoucher } from '../models/PaymentVoucher.js';
import { ReceiptVoucher } from '../models/ReceiptVoucher.js';
import { Account } from '../models/Account.js';
import { getNextSequence } from '../models/Counter.js';

const DEFAULT_CONSOLIDATED_ACCOUNT = 'SAL-PAYROLL';

async function resolveAccount(code, fallbackName) {
  const c = String(code || '').trim().toUpperCase();
  if (!c) return { accountCode: '', accountName: fallbackName || '' };
  const acc = await Account.findOne({ code: c }).lean();
  return {
    accountCode: c,
    accountName: acc?.name || fallbackName || c
  };
}

async function createPaymentVoucher({
  amount,
  accountCode,
  accountName,
  cashBank,
  voucherDate,
  narration,
  refNo,
  run,
  sourceEmployeeCode = ''
}) {
  const voucherNo = await getNextSequence('payment_voucher', 1);
  return PaymentVoucher.create({
    voucherType: 'payment',
    voucherNo,
    refNo: refNo || `PR-${run.runNo}`,
    voucherDate: voucherDate || new Date(),
    cashBank: cashBank || 'BANK',
    accountCode,
    accountName,
    amount: Number(amount) || 0,
    narration,
    status: 'Posted',
    sourceDocType: 'payroll_run',
    sourceDocId: String(run._id),
    sourceFormattedDocNo: `PAYROLL-${run.periodMonth}-R${run.runNo}`,
    sourcePayrollRunNo: run.runNo,
    sourceEmployeeCode: String(sourceEmployeeCode || '').trim().toUpperCase()
  });
}

async function createReceiptVoucher({
  amount,
  accountCode,
  accountName,
  cashBank,
  voucherDate,
  narration,
  refNo,
  run
}) {
  const voucherNo = await getNextSequence('receipt_voucher', 1);
  return ReceiptVoucher.create({
    voucherType: 'receipt',
    voucherNo,
    refNo: refNo || `PR-ACR-${run.runNo}`,
    voucherDate: voucherDate || new Date(),
    cashBank: cashBank || 'BANK',
    accountCode,
    accountName,
    amount: Number(amount) || 0,
    narration,
    status: 'Posted',
    sourceDocType: 'payroll_run',
    sourceDocId: String(run._id),
    sourceFormattedDocNo: `PAYROLL-${run.periodMonth}-R${run.runNo}`
  });
}

/**
 * Post salary payment vouchers linked to accounts (Finance → Payment Voucher / Ledger).
 */
export async function postPayrollPayment(runNo, options = {}) {
  const run = await PayrollRun.findOne({ runNo: Number(runNo) });
  if (!run) throw Object.assign(new Error('Payroll run not found'), { status: 404 });
  if (run.status === 'paid') {
    throw Object.assign(new Error('Payroll run is already paid and vouchers were created'), { status: 409 });
  }
  if (run.status !== 'processed') {
    throw Object.assign(new Error('Only processed payroll can be posted to accounts. Process payroll first.'), {
      status: 400
    });
  }

  const cashBank = String(options.cashBank || 'BANK').toUpperCase();
  const paymentMode = String(options.paymentMode || 'per_employee').toLowerCase();
  const voucherDate = options.voucherDate ? new Date(options.voucherDate) : new Date();
  const consolidatedCode = String(options.consolidatedAccountCode || DEFAULT_CONSOLIDATED_ACCOUNT).toUpperCase();
  const createAccrualReceipt = options.createAccrualReceipt !== false;
  const createStatutory = options.createStatutoryPayments === true;

  const paymentVoucherNos = [];
  const receiptVoucherNos = [];
  const statutoryVoucherNos = [];

  if (paymentMode === 'consolidated') {
    const acc = await resolveAccount(consolidatedCode, 'Salary payroll');
    const pv = await createPaymentVoucher({
      amount: run.totalNet,
      accountCode: acc.accountCode,
      accountName: acc.accountName,
      cashBank,
      voucherDate,
      narration: `Salary payment — ${run.periodMonth} payroll run #${run.runNo} (${run.employeeCount} employees)`,
      refNo: `PR-${run.runNo}-NET`,
      run
    });
    paymentVoucherNos.push(pv.voucherNo);
  } else {
    const employees = await PayrollEmployee.find({
      employeeCode: { $in: (run.lines ?? []).map((l) => l.employeeCode) }
    }).lean();
    const byCode = Object.fromEntries(employees.map((e) => [e.employeeCode, e]));

    for (const line of run.lines ?? []) {
      if ((Number(line.netPay) || 0) <= 0) continue;
      const emp = byCode[line.employeeCode] ?? {};
      const payCode = emp.payableAccountCode || consolidatedCode;
      const acc = await resolveAccount(payCode, line.employeeName || line.employeeCode);
      const pv = await createPaymentVoucher({
        amount: line.netPay,
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        cashBank,
        voucherDate,
        narration: `Salary ${run.periodMonth} — ${line.employeeName} (${line.employeeCode})`,
        refNo: `PR-${run.runNo}-${line.employeeCode}`,
        run,
        sourceEmployeeCode: line.employeeCode
      });
      paymentVoucherNos.push(pv.voucherNo);
    }
  }

  if (createAccrualReceipt && (Number(run.totalGross) || 0) > 0) {
    const acc = await resolveAccount(consolidatedCode, 'Salary payroll');
    const rv = await createReceiptVoucher({
      amount: run.totalGross,
      accountCode: acc.accountCode,
      accountName: acc.accountName,
      cashBank,
      voucherDate,
      narration: `Payroll accrual (gross) — ${run.periodMonth} run #${run.runNo} — offset before net payment`,
      refNo: `PR-ACR-${run.runNo}`,
      run
    });
    receiptVoucherNos.push(rv.voucherNo);
  }

  if (createStatutory) {
    const statMap = [
      { key: 'totalPf', code: options.pfAccountCode || 'PF-PAYABLE', label: 'PF' },
      { key: 'totalEsi', code: options.esiAccountCode || 'ESI-PAYABLE', label: 'ESI' },
      { key: 'totalTds', code: options.tdsAccountCode || 'TDS-PAYABLE', label: 'TDS' }
    ];
    for (const s of statMap) {
      const amt = Number(run[s.key]) || 0;
      if (amt <= 0) continue;
      const acc = await resolveAccount(s.code, s.label);
      const pv = await createPaymentVoucher({
        amount: amt,
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        cashBank,
        voucherDate,
        narration: `${s.label} remittance — payroll ${run.periodMonth} run #${run.runNo}`,
        refNo: `PR-${run.runNo}-${s.label}`,
        run
      });
      statutoryVoucherNos.push(pv.voucherNo);
      paymentVoucherNos.push(pv.voucherNo);
    }
  }

  run.status = 'paid';
  run.paidAt = new Date();
  run.paidBy = options.paidBy || '';
  run.cashBank = cashBank;
  run.paymentMode = paymentMode;
  run.consolidatedAccountCode = consolidatedCode;
  run.paymentVoucherNos = paymentVoucherNos;
  run.receiptVoucherNos = receiptVoucherNos;
  run.statutoryVoucherNos = statutoryVoucherNos;
  await run.save();

  return {
    run: run.toObject(),
    paymentVoucherNos,
    receiptVoucherNos,
    statutoryVoucherNos,
    message: `Created ${paymentVoucherNos.length} payment voucher(s) and ${receiptVoucherNos.length} receipt voucher(s). View under Finance → Payment / Receipt Voucher and Ledger Report.`
  };
}
