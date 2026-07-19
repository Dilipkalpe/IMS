import 'dotenv/config';
import { connectDb } from '../src/config/db.js';
import { Product } from '../src/models/Product.js';
import { SalesInvoice } from '../src/models/SalesInvoice.js';
import { PurchaseInvoice } from '../src/models/PurchaseInvoice.js';
import { SalesOrder } from '../src/models/SalesOrder.js';
import { DeliveryChallan } from '../src/models/DeliveryChallan.js';
import { SalesReturn } from '../src/models/SalesReturn.js';
import { PurchaseOrder } from '../src/models/PurchaseOrder.js';
import { Grn } from '../src/models/Grn.js';
import { PurchaseReturn } from '../src/models/PurchaseReturn.js';
import { StockTransfer } from '../src/models/StockTransfer.js';
import { ReceiptVoucher } from '../src/models/ReceiptVoucher.js';
import { PaymentVoucher } from '../src/models/PaymentVoucher.js';
import { CreditNote } from '../src/models/CreditNote.js';
import { DebitNote } from '../src/models/DebitNote.js';
import { CashEntry } from '../src/models/CashEntry.js';
import { BankEntry } from '../src/models/BankEntry.js';
import { Bom } from '../src/models/Bom.js';
import { ProductionOrder } from '../src/models/ProductionOrder.js';
import { PayrollEmployee } from '../src/models/PayrollEmployee.js';
import { AttendanceRecord } from '../src/models/AttendanceRecord.js';
import { PayrollRun } from '../src/models/PayrollRun.js';

const MIN_PER_SECTION = Number(process.env.SEED_RECORDS_PER_SECTION) || 10_000;
const SEED_MONTHS = Number(process.env.SEED_MONTHS) || 12;

async function verify() {
  await connectDb();

  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - SEED_MONTHS * 30);

  const counts = {
    products: await Product.countDocuments(),
    salesOrders: await SalesOrder.countDocuments(),
    deliveryChallans: await DeliveryChallan.countDocuments(),
    salesInvoices: await SalesInvoice.countDocuments({ status: { $nin: ['cancelled', 'draft'] } }),
    salesReturns: await SalesReturn.countDocuments(),
    purchaseOrders: await PurchaseOrder.countDocuments(),
    grns: await Grn.countDocuments(),
    purchaseInvoices: await PurchaseInvoice.countDocuments({ status: { $nin: ['cancelled', 'draft'] } }),
    purchaseReturns: await PurchaseReturn.countDocuments(),
    stockTransfers: await StockTransfer.countDocuments(),
    receiptVouchers: await ReceiptVoucher.countDocuments(),
    paymentVouchers: await PaymentVoucher.countDocuments(),
    creditNotes: await CreditNote.countDocuments(),
    debitNotes: await DebitNote.countDocuments(),
    cashEntries: await CashEntry.countDocuments(),
    bankEntries: await BankEntry.countDocuments(),
    boms: await Bom.countDocuments(),
    productionOrders: await ProductionOrder.countDocuments(),
    payrollEmployees: await PayrollEmployee.countDocuments(),
    attendanceRecords: await AttendanceRecord.countDocuments(),
    payrollRuns: await PayrollRun.countDocuments()
  };

  const salesInRange = await SalesInvoice.countDocuments({
    status: { $nin: ['cancelled', 'draft'] },
    invoiceDate: { $gte: rangeStart }
  });

  const productionInRange = await ProductionOrder.countDocuments({
    productionDate: { $gte: rangeStart }
  });

  const attendanceInRange = await AttendanceRecord.countDocuments({
    attendanceDate: { $gte: rangeStart }
  });

  console.log('=== IMS seed verification ===\n');
  console.log(`Expected at least ${MIN_PER_SECTION.toLocaleString()} per transactional section (${SEED_MONTHS} month span)\n`);
  console.log(JSON.stringify(counts, null, 2));
  console.log('');
  console.log(`Sales invoices since ${rangeStart.toISOString().slice(0, 10)}:`, salesInRange.toLocaleString());
  console.log(`Production orders since ${rangeStart.toISOString().slice(0, 10)}:`, productionInRange.toLocaleString());
  console.log(`Attendance records since ${rangeStart.toISOString().slice(0, 10)}:`, attendanceInRange.toLocaleString());

  const sections = [
    'salesOrders',
    'deliveryChallans',
    'salesInvoices',
    'salesReturns',
    'purchaseOrders',
    'grns',
    'purchaseInvoices',
    'purchaseReturns',
    'stockTransfers',
    'receiptVouchers',
    'paymentVouchers',
    'creditNotes',
    'debitNotes',
    'cashEntries',
    'bankEntries',
    'productionOrders',
    'attendanceRecords'
  ];

  const failed = sections.filter((key) => counts[key] < MIN_PER_SECTION);
  const ok =
    failed.length === 0 &&
    counts.products >= 10 &&
    counts.boms >= 3 &&
    counts.payrollEmployees >= 200 &&
    counts.payrollRuns >= Math.max(12, SEED_MONTHS - 1) &&
    salesInRange >= MIN_PER_SECTION * 0.9 &&
    productionInRange >= MIN_PER_SECTION * 0.9 &&
    attendanceInRange >= MIN_PER_SECTION * 0.9;

  console.log('');
  if (ok) {
    console.log('PASS — all sections meet the minimum record count.');
  } else {
    console.log('WARN — sections below target:', failed.join(', ') || '(date range)');
    console.log('Run: npm run seed');
  }

  process.exit(ok ? 0 : 1);
}

verify().catch((err) => {
  console.error(err);
  process.exit(1);
});
