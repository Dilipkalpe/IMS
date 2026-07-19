/**
 * IMS system reset — delete transactional/business data, preserve masters & settings,
 * keep only the admin user (password reset to "admin").
 *
 * IMPORTANT: IMS uses MongoDB (not SQL). Take a backup before running.
 *
 * Usage (from api/):
 *   node scripts/system-reset-business-data.js --dry-run
 *   node scripts/system-reset-business-data.js --confirm RESET_BUSINESS_DATA
 *
 * Prerequisites:
 *   - MongoDB running (MONGODB_URI in .env)
 *   - Stop other users from using the app during reset
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import {
  connectDb,
  disconnectDb,
  getMongoUri,
  switchToYearDb
} from '../src/config/db.js';
import { FinancialYear } from '../src/models/FinancialYear.js';
import { TransactionDocument } from '../src/models/TransactionDocument.js';
import { StockTransfer } from '../src/models/StockTransfer.js';
import { SalesOrder } from '../src/models/SalesOrder.js';
import { DeliveryChallan } from '../src/models/DeliveryChallan.js';
import { SalesInvoice } from '../src/models/SalesInvoice.js';
import { SalesReturn } from '../src/models/SalesReturn.js';
import { PurchaseOrder } from '../src/models/PurchaseOrder.js';
import { Grn } from '../src/models/Grn.js';
import { PurchaseInvoice } from '../src/models/PurchaseInvoice.js';
import { PurchaseReturn } from '../src/models/PurchaseReturn.js';
import { PaymentVoucher } from '../src/models/PaymentVoucher.js';
import { ReceiptVoucher } from '../src/models/ReceiptVoucher.js';
import { CreditNote } from '../src/models/CreditNote.js';
import { DebitNote } from '../src/models/DebitNote.js';
import { CashEntry } from '../src/models/CashEntry.js';
import { BankEntry } from '../src/models/BankEntry.js';
import { ProductionOrder } from '../src/models/ProductionOrder.js';
import { OpeningStockEntry } from '../src/models/OpeningStockEntry.js';
import { OpeningBalanceEntry } from '../src/models/OpeningBalanceEntry.js';
import { EditDeleteAuthLog } from '../src/models/EditDeleteAuthLog.js';
import { Counter } from '../src/models/Counter.js';
import { Product } from '../src/models/Product.js';
import { LedgerAccount } from '../src/models/LedgerAccount.js';
import { AppUser } from '../src/models/AppUser.js';
import { UserGridColumnPreference } from '../src/models/UserGridColumnPreference.js';
import { hashPassword } from '../src/services/auth.js';
import { DOC_INITIAL } from '../src/services/docTypeMap.js';

const CONFIRM_PHRASE = 'RESET_BUSINESS_DATA';

/** @type {{ label: string, model: import('mongoose').Model }[]} */
const TRANSACTIONAL_MODELS = [
  { label: 'Transaction documents', model: TransactionDocument },
  { label: 'Stock transfers', model: StockTransfer },
  { label: 'Sales orders', model: SalesOrder },
  { label: 'Delivery challans', model: DeliveryChallan },
  { label: 'Sales invoices', model: SalesInvoice },
  { label: 'Sales returns', model: SalesReturn },
  { label: 'Purchase orders', model: PurchaseOrder },
  { label: 'GRNs', model: Grn },
  { label: 'Purchase invoices', model: PurchaseInvoice },
  { label: 'Purchase returns', model: PurchaseReturn },
  { label: 'Payment vouchers', model: PaymentVoucher },
  { label: 'Receipt vouchers', model: ReceiptVoucher },
  { label: 'Credit notes', model: CreditNote },
  { label: 'Debit notes', model: DebitNote },
  { label: 'Cash entries', model: CashEntry },
  { label: 'Bank entries', model: BankEntry },
  { label: 'Production orders', model: ProductionOrder },
  { label: 'Opening stock entries', model: OpeningStockEntry },
  { label: 'Opening balance entries', model: OpeningBalanceEntry },
  { label: 'Edit/delete auth logs', model: EditDeleteAuthLog }
];

function parseDbNameFromUri(uri) {
  const match = String(uri || '').match(/\/([^/?]+)(\?.*)?$/);
  return match ? match[1] : 'ims';
}

async function countTransactional() {
  const counts = {};
  let total = 0;
  for (const { label, model } of TRANSACTIONAL_MODELS) {
    const count = await model.countDocuments();
    counts[label] = count;
    total += count;
  }
  counts.counters = await Counter.countDocuments();
  total += counts.counters;
  return { total, counts };
}

async function resetCounters(dryRun) {
  if (dryRun) {
    return { deleted: await Counter.countDocuments(), reseeded: Object.keys(DOC_INITIAL).length };
  }

  const deleted = (await Counter.deleteMany({})).deletedCount ?? 0;
  for (const [docType, initial] of Object.entries(DOC_INITIAL)) {
    await Counter.create({ key: `doc_${docType}`, value: initial });
  }
  return { deleted, reseeded: Object.keys(DOC_INITIAL).length };
}

async function resetDerivedMasterFields(dryRun) {
  const productCount = await Product.countDocuments({ stockQty: { $ne: 0 } });
  const ledgerCount = await LedgerAccount.countDocuments({
    $or: [{ openingBalance: { $ne: 0 } }, { openingBalanceType: { $ne: 'Dr' } }]
  });

  if (!dryRun) {
    await Product.updateMany({}, { $set: { stockQty: 0 } });
    await LedgerAccount.updateMany({}, { $set: { openingBalance: 0, openingBalanceType: 'Dr' } });
  }

  return { productsZeroed: productCount, ledgersReset: ledgerCount };
}

async function resetUsers(dryRun) {
  const admin = await AppUser.findOne({ username: 'admin' });
  const nonAdminCount = await AppUser.countDocuments({ username: { $ne: 'admin' } });
  const prefCount = admin
    ? await UserGridColumnPreference.countDocuments({ userId: { $ne: String(admin._id) } })
    : await UserGridColumnPreference.countDocuments({});

  if (dryRun) {
    return {
      adminExists: Boolean(admin),
      nonAdminUsers: nonAdminCount,
      prefsRemoved: prefCount
    };
  }

  if (admin) {
    await UserGridColumnPreference.deleteMany({ userId: { $ne: String(admin._id) } });
    await AppUser.deleteMany({ username: { $ne: 'admin' } });
    admin.passwordHash = hashPassword('admin');
    admin.activeStatus = true;
    admin.role = admin.role || 'Administrator';
    await admin.save();
  } else {
    await UserGridColumnPreference.deleteMany({});
    await AppUser.deleteMany({});
    await AppUser.create({
      employeeId: 'EMP-ADMIN',
      username: 'admin',
      passwordHash: hashPassword('admin'),
      fullName: 'System Administrator',
      role: 'Administrator',
      department: 'Administration',
      email: 'admin@ims.local',
      activeStatus: true,
      canPrintBarcodeLabels: true
    });
  }

  return {
    adminExists: true,
    nonAdminUsers: nonAdminCount,
    prefsRemoved: prefCount,
    passwordReset: true
  };
}

async function purgeTransactional(dryRun) {
  const deleted = {};
  let total = 0;
  for (const { label, model } of TRANSACTIONAL_MODELS) {
    const count = dryRun ? await model.countDocuments() : (await model.deleteMany({})).deletedCount ?? 0;
    deleted[label] = count;
    total += count;
  }
  return { total, deleted };
}

async function resetYearDatabase(dbName, dryRun) {
  console.log(`\n=== Database: ${dbName} ===`);
  await switchToYearDb(dbName);

  const before = await countTransactional();
  console.log(`Transactional records (before): ${before.total}`);

  const purged = await purgeTransactional(dryRun);
  const counters = await resetCounters(dryRun);
  const derived = await resetDerivedMasterFields(dryRun);
  const users = await resetUsers(dryRun);

  console.log(dryRun ? '[DRY RUN] Would delete:' : 'Deleted:', purged.deleted);
  console.log(dryRun ? '[DRY RUN] Counters:' : 'Counters:', counters);
  console.log(dryRun ? '[DRY RUN] Master fields:' : 'Master fields:', derived);
  console.log(dryRun ? '[DRY RUN] Users:' : 'Users:', users);

  return { dbName, purged, counters, derived, users, beforeTotal: before.total };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const confirm = process.argv.includes('--confirm')
    ? process.argv[process.argv.indexOf('--confirm') + 1]
    : null;

  if (!dryRun && confirm !== CONFIRM_PHRASE) {
    console.error(`Refusing to run without confirmation.`);
    console.error(`Dry run:  node scripts/system-reset-business-data.js --dry-run`);
    console.error(`Execute:  node scripts/system-reset-business-data.js --confirm ${CONFIRM_PHRASE}`);
    process.exit(1);
  }

  await connectDb();

  const dbNames = new Set([parseDbNameFromUri(getMongoUri())]);
  const years = await FinancialYear.find({}).select('databaseName financialYearName').lean();
  for (const y of years) {
    if (y.databaseName) dbNames.add(y.databaseName);
  }

  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE RESET'}`);
  console.log(`Year databases to process: ${[...dbNames].join(', ')}`);
  console.log('Config collections preserved: FinancialYear, FinancialYearAuditLog');

  const results = [];
  for (const dbName of dbNames) {
    results.push(await resetYearDatabase(dbName, dryRun));
  }

  console.log('\n=== Summary ===');
  for (const r of results) {
    console.log(`${r.dbName}: ${dryRun ? 'would remove' : 'removed'} ${r.purged.total} transactional docs (was ${r.beforeTotal})`);
  }
  if (!dryRun) {
    console.log('\nReset complete. Login: admin / admin');
    console.log('Recommend: verify masters in UI and run stock recalculation if needed.');
  }

  await disconnectDb();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await disconnectDb();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
