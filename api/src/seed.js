import 'dotenv/config';
import { connectDb } from './config/db.js';
import { Product } from './models/Product.js';
import { Account } from './models/Account.js';
import { Warehouse } from './models/Warehouse.js';
import { Counter } from './models/Counter.js';
import { ProductType } from './models/ProductType.js';
import { ProductMainGroup } from './models/ProductMainGroup.js';
import { ProductSubGroup } from './models/ProductSubGroup.js';
import { AssemblyType } from './models/AssemblyType.js';
import { Machine } from './models/Machine.js';
import { SaleUom } from './models/SaleUom.js';
import { CustomerType } from './models/CustomerType.js';
import { AppUser } from './models/AppUser.js';
import { PaymentVoucher } from './models/PaymentVoucher.js';
import { ReceiptVoucher } from './models/ReceiptVoucher.js';
import { CreditNote } from './models/CreditNote.js';
import { DebitNote } from './models/DebitNote.js';
import { CashEntry } from './models/CashEntry.js';
import { BankEntry } from './models/BankEntry.js';
import { SalesOrder } from './models/SalesOrder.js';
import { DeliveryChallan } from './models/DeliveryChallan.js';
import { SalesInvoice } from './models/SalesInvoice.js';
import { SalesReturn } from './models/SalesReturn.js';
import { PurchaseOrder } from './models/PurchaseOrder.js';
import { Grn } from './models/Grn.js';
import { PurchaseInvoice } from './models/PurchaseInvoice.js';
import { PurchaseReturn } from './models/PurchaseReturn.js';
import { Company } from './models/Company.js';
import { LedgerAccount } from './models/LedgerAccount.js';
import { StockTransfer } from './models/StockTransfer.js';
import { Bom } from './models/Bom.js';
import { ProductionOrder } from './models/ProductionOrder.js';
import { PayrollEmployee } from './models/PayrollEmployee.js';
import { AttendanceRecord } from './models/AttendanceRecord.js';
import { PayrollRun } from './models/PayrollRun.js';
import { TransactionDocument } from './models/TransactionDocument.js';
import { DOC_INITIAL } from './services/docTypeMap.js';
import {
  DEFAULT_USER_PASSWORD,
  accounts,
  appUsers,
  assemblyTypes,
  companies,
  customerTypes,
  ledgerAccounts,
  machines,
  productMainGroups,
  products,
  productSubGroups,
  productTypes,
  saleUoms,
  warehouses
} from './seed/mastersData.js';
import { generateTwoMonthSampleData } from './seed/generateTwoMonthData.js';
import { generateBoms } from './seed/generateManufacturingData.js';
import { insertManyInBatches } from './seed/insertBatches.js';
import { seedTransactionalInChunks } from './seed/seedLargeTransactional.js';
import { seedPayrollData } from './seed/seedPayrollData.js';

const RECORDS_PER_SECTION =
  Number(process.env.SEED_RECORDS_PER_SECTION) || 10_000;
const SEED_MONTHS = Number(process.env.SEED_MONTHS) || 12;
const CHUNKED_SEED_THRESHOLD = Number(process.env.SEED_CHUNKED_THRESHOLD) || 5_000;

async function seed() {
  await connectDb();

  const useChunkedSeed = RECORDS_PER_SECTION >= CHUNKED_SEED_THRESHOLD;
  const boms = generateBoms(products);

  console.log(
    `Seeding ${RECORDS_PER_SECTION.toLocaleString()} records per section across ${SEED_MONTHS} month(s)` +
      `${useChunkedSeed ? ' (chunked mode)' : ''}…`
  );

  console.log('Clearing collections…');
  await Promise.all([
    Product.deleteMany({}),
    Account.deleteMany({}),
    Warehouse.deleteMany({}),
    LedgerAccount.deleteMany({}),
    TransactionDocument.deleteMany({}),
    ProductType.deleteMany({}),
    ProductMainGroup.deleteMany({}),
    ProductSubGroup.deleteMany({}),
    AssemblyType.deleteMany({}),
    Machine.deleteMany({}),
    SaleUom.deleteMany({}),
    CustomerType.deleteMany({}),
    AppUser.deleteMany({}),
    PaymentVoucher.deleteMany({}),
    ReceiptVoucher.deleteMany({}),
    CreditNote.deleteMany({}),
    DebitNote.deleteMany({}),
    CashEntry.deleteMany({}),
    BankEntry.deleteMany({}),
    SalesOrder.deleteMany({}),
    DeliveryChallan.deleteMany({}),
    SalesInvoice.deleteMany({}),
    SalesReturn.deleteMany({}),
    PurchaseOrder.deleteMany({}),
    Grn.deleteMany({}),
    PurchaseInvoice.deleteMany({}),
    PurchaseReturn.deleteMany({}),
    StockTransfer.deleteMany({}),
    Bom.deleteMany({}),
    ProductionOrder.deleteMany({}),
    PayrollEmployee.deleteMany({}),
    AttendanceRecord.deleteMany({}),
    PayrollRun.deleteMany({}),
    Company.deleteMany({}),
    Counter.deleteMany({})
  ]);

  console.log('\nInserting master data…');
  await Product.insertMany(products);
  await LedgerAccount.insertMany(ledgerAccounts);
  await Account.insertMany(accounts);
  await Warehouse.insertMany(warehouses);
  await ProductType.insertMany(productTypes);
  await ProductMainGroup.insertMany(productMainGroups);
  await ProductSubGroup.insertMany(productSubGroups);
  await AssemblyType.insertMany(assemblyTypes);
  await Machine.insertMany(machines);
  await SaleUom.insertMany(saleUoms);
  await CustomerType.insertMany(customerTypes);
  await AppUser.insertMany(appUsers);
  await Company.insertMany(companies);
  await Bom.insertMany(boms);

  let generated;
  const genStarted = Date.now();

  if (useChunkedSeed) {
    generated = await seedTransactionalInChunks({
      products,
      months: SEED_MONTHS,
      recordsPerSection: RECORDS_PER_SECTION,
      boms
    });
    generated.summary.boms = boms.length;
  } else {
    generated = generateTwoMonthSampleData({
      products,
      months: SEED_MONTHS,
      recordsPerSection: RECORDS_PER_SECTION
    });
    console.log(`Generation finished in ${((Date.now() - genStarted) / 1000).toFixed(1)}s\n`);
    console.log('Inserting transactional data (batched)…');
    await insertManyInBatches(SalesOrder, generated.salesOrders);
    await insertManyInBatches(DeliveryChallan, generated.deliveryChallans);
    await insertManyInBatches(SalesInvoice, generated.salesInvoices);
    await insertManyInBatches(SalesReturn, generated.salesReturns);
    await insertManyInBatches(PurchaseOrder, generated.purchaseOrders);
    await insertManyInBatches(Grn, generated.grns);
    await insertManyInBatches(PurchaseInvoice, generated.purchaseInvoices);
    await insertManyInBatches(PurchaseReturn, generated.purchaseReturns);
    await insertManyInBatches(StockTransfer, generated.stockTransfers);
    await insertManyInBatches(PaymentVoucher, generated.paymentVouchers);
    await insertManyInBatches(ReceiptVoucher, generated.receiptVouchers);
    await insertManyInBatches(CreditNote, generated.creditNotes);
    await insertManyInBatches(DebitNote, generated.debitNotes);
    await insertManyInBatches(CashEntry, generated.cashEntries);
    await insertManyInBatches(BankEntry, generated.bankEntries);
    await insertManyInBatches(ProductionOrder, generated.productionOrders);
  }

  console.log(`\nTransactional seed finished in ${((Date.now() - genStarted) / 1000).toFixed(1)}s`);

  const payrollSummary = await seedPayrollData({
    months: SEED_MONTHS,
    attendanceCount: RECORDS_PER_SECTION,
    startDate: generated.summary.startDate,
    endDate: generated.summary.endDate
  });

  for (const [docType, initial] of Object.entries(DOC_INITIAL)) {
    await Counter.create({ key: `doc_${docType}`, value: initial });
  }

  const counterRows = {
    ...generated.counters,
    production_order: generated.counters.production_order,
    payroll_run: payrollSummary.payrollRunNo
  };
  for (const [key, value] of Object.entries(counterRows)) {
    await Counter.create({ key, value });
  }

  const summary = {
    ...generated.summary,
    payrollEmployees: payrollSummary.payrollEmployees,
    attendanceRecords: payrollSummary.attendanceRecords,
    payrollRuns: payrollSummary.payrollRuns
  };

  console.log('\nSeed completed.');
  console.log('Date range:', summary.startDate.toISOString().slice(0, 10), '→', summary.endDate.toISOString().slice(0, 10));
  console.log('Counts:', JSON.stringify(summary, null, 2));
  console.log('');
  console.log(`Default login password for active users: ${DEFAULT_USER_PASSWORD}`);
  console.log('Override volume: SEED_RECORDS_PER_SECTION=5000 npm run seed');
  console.log('Two-year ~1 lakh/section: npm run seed:2y');
  console.log('Verify: npm run seed:verify');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
