import { pathToFileURL } from 'url';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { Account } from '../src/models/Account.js';
import { Product } from '../src/models/Product.js';
import { SalesOrder } from '../src/models/SalesOrder.js';
import { DeliveryChallan } from '../src/models/DeliveryChallan.js';
import { SalesInvoice } from '../src/models/SalesInvoice.js';
import { SalesReturn } from '../src/models/SalesReturn.js';

/** Compound indexes for list/search at scale (skip if equivalent exists). */
const INDEX_SPECS = [
  [Product, [{ activeStatus: 1, code: 1 }]],
  [Account, [{ accountType: 1, code: 1 }, { accountType: 1, name: 1 }, { accountType: 1, activeStatus: 1, name: 1 }]],
  [SalesOrder, [{ status: 1, docNo: -1 }, { createdAt: -1 }, { customer: 1, docNo: -1 }]],
  [DeliveryChallan, [{ status: 1, docNo: -1 }, { createdAt: -1 }]],
  [SalesInvoice, [{ status: 1, docNo: -1 }, { createdAt: -1 }, { billDate: 1 }]],
  [SalesReturn, [{ status: 1, docNo: -1 }, { createdAt: -1 }]]
];

async function safeCreateIndex(collection, spec) {
  try {
    await collection.createIndex(spec, { background: true });
  } catch (err) {
    const code = err?.code ?? err?.codeName;
    if (code === 85 || code === 86 || code === 'IndexOptionsConflict' || code === 'IndexKeySpecsConflict') {
      return;
    }
    throw err;
  }
}

export async function ensurePerfIndexes() {
  for (const [Model, specs] of INDEX_SPECS) {
    for (const spec of specs) {
      await safeCreateIndex(Model.collection, spec);
    }
    console.log(`  indexes ensured: ${Model.collection.name}`);
  }
}

async function main() {
  await connectDb();
  console.log('Ensuring performance indexes…');
  await ensurePerfIndexes();
  await disconnectDb();
  console.log('Done.');
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isCli) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
