import 'dotenv/config';
import { connectDb, disconnectDb, getMongoUri } from '../src/config/db.js';
import { Account } from '../src/models/Account.js';
import { Product } from '../src/models/Product.js';
import { SalesOrder } from '../src/models/SalesOrder.js';
import { DeliveryChallan } from '../src/models/DeliveryChallan.js';
import { SalesInvoice } from '../src/models/SalesInvoice.js';
import { SalesReturn } from '../src/models/SalesReturn.js';
import { ensureCounterAtLeast } from '../src/models/Counter.js';
import { salesOrderCounterKey } from '../src/services/salesOrderNo.js';
import { salesDocCounterKey } from '../src/services/numberedSalesDocNo.js';
import { PERF_CONFIG, expectedDocumentTotal } from './config.js';
import { createRng } from './lib/rng.js';
import { buildCustomer, buildProduct, buildSalesDocument } from './lib/docBuilders.js';
import { ensurePerfIndexes } from './ensureIndexes.js';

const PERF_CODE = /^PERF-/i;
const PERF_DOC = /^(PSO|PDC|PSI|PSR)-/i;

async function purgePerfData() {
  console.log('Purging prior PERF-* load data…');
  const [p, a, so, dc, si, sr] = await Promise.all([
    Product.deleteMany({ code: PERF_CODE }),
    Account.deleteMany({ code: PERF_CODE }),
    SalesOrder.deleteMany({ formattedDocNo: PERF_DOC }),
    DeliveryChallan.deleteMany({ formattedDocNo: PERF_DOC }),
    SalesInvoice.deleteMany({ formattedDocNo: PERF_DOC }),
    SalesReturn.deleteMany({ formattedDocNo: PERF_DOC })
  ]);
  console.log(
    `  removed products=${p.deletedCount} accounts=${a.deletedCount} SO=${so.deletedCount} DC=${dc.deletedCount} SI=${si.deletedCount} SR=${sr.deletedCount}`
  );
}

async function seedProducts(rng) {
  const { products: count, batchSize } = PERF_CONFIG;
  const cache = [];
  for (let start = 1; start <= count; start += batchSize) {
    const end = Math.min(start + batchSize - 1, count);
    const batch = [];
    for (let i = start; i <= end; i++) {
      const doc = buildProduct(i);
      cache.push({
        code: doc.code,
        name: doc.name,
        salePrice: doc.salePrice,
        taxPercent: doc.taxPercent
      });
      batch.push(doc);
    }
    await Product.insertMany(batch, { ordered: false });
    process.stdout.write(`\r  products: ${end.toLocaleString()} / ${count.toLocaleString()}`);
  }
  if (count > 0) process.stdout.write('\n');
  console.log(`  products: ${count.toLocaleString()} inserted`);
  return cache;
}

async function seedCustomers(rng) {
  const { customers: count, batchSize } = PERF_CONFIG;
  const cache = [];
  for (let start = 1; start <= count; start += batchSize) {
    const end = Math.min(start + batchSize - 1, count);
    const batch = [];
    for (let i = start; i <= end; i++) {
      const doc = buildCustomer(i);
      cache.push({
        name: doc.name,
        city: doc.city,
        state: doc.state,
        gstNo: doc.gstNo
      });
      batch.push(doc);
    }
    await Account.insertMany(batch, { ordered: false });
    process.stdout.write(`\r  customers: ${end.toLocaleString()} / ${count.toLocaleString()}`);
  }
  if (count > 0) process.stdout.write('\n');
  console.log(`  customers: ${count.toLocaleString()} inserted`);
  return cache;
}

async function seedSalesCollection(Model, kind, count, docStart, customers, products, rng, dateRange) {
  const { batchSize } = PERF_CONFIG;
  let docNo = docStart;
  const endNo = docStart + count - 1;

  for (let offset = 0; offset < count; offset += batchSize) {
    const batch = [];
    const chunk = Math.min(batchSize, count - offset);
    for (let i = 0; i < chunk; i++) {
      const customer = customers[(docNo + i) % customers.length];
      batch.push(buildSalesDocument(kind, docNo + i, customer, products, rng, dateRange));
    }
    await Model.insertMany(batch, { ordered: false });
    docNo += chunk;
    process.stdout.write(
      `\r  ${kind}: ${Math.min(docNo - 1, endNo).toLocaleString()} / ${endNo.toLocaleString()}`
    );
  }
  process.stdout.write('\n');
  console.log(`  ${kind}: ${count.toLocaleString()} inserted (docNo ${docStart}–${endNo})`);
  return endNo;
}

async function updateCounters(lastSo, lastDc, lastSi, lastSr) {
  const pso = 'PSO';
  await ensureCounterAtLeast(salesOrderCounterKey(pso), lastSo, PERF_CONFIG.docStartNo);
  await ensureCounterAtLeast(salesDocCounterKey('delivery_challan', 'PDC', 'DC'), lastDc, PERF_CONFIG.docStartNo);
  await ensureCounterAtLeast(salesDocCounterKey('sales_invoice', 'PSI', 'SI'), lastSi, PERF_CONFIG.docStartNo);
  await ensureCounterAtLeast(salesDocCounterKey('sales_return', 'PSR', 'SR'), lastSr, PERF_CONFIG.docStartNo);
  console.log('  counters updated for PSO/PDC/PSI/PSR prefixes');
}

async function printCounts() {
  const names = [
    ['products', Product],
    ['customers (accounts)', Account, { accountType: 'customer', code: PERF_CODE }],
    ['sales_orders', SalesOrder, { formattedDocNo: PERF_DOC }],
    ['delivery_challans', DeliveryChallan, { formattedDocNo: PERF_DOC }],
    ['sales_invoices', SalesInvoice, { formattedDocNo: PERF_DOC }],
    ['sales_returns', SalesReturn, { formattedDocNo: PERF_DOC }]
  ];
  console.log('\nCollection counts (PERF subset where noted):');
  for (const [label, Model, filter] of names) {
    const n = filter ? await Model.countDocuments(filter) : await Model.countDocuments();
    console.log(`  ${label}: ${n.toLocaleString()}`);
  }
}

async function main() {
  const cfg = PERF_CONFIG;
  const expected = expectedDocumentTotal();
  console.log('IMS load-test seed');
  console.log(`  MongoDB: ${getMongoUri().replace(/\/\/([^@]+)@/, '//***@')}`);
  console.log(`  Target documents: ${expected.toLocaleString()} (config total ${cfg.totalTarget.toLocaleString()})`);

  await connectDb();
  if (cfg.purgeBeforeSeed) await purgePerfData();

  console.log('\nEnsuring indexes…');
  await ensurePerfIndexes();

  const rng = createRng(cfg.seed);
  const dateRange = {
    start: new Date(Date.now() - 730 * 86400000),
    end: new Date(),
    linesMin: cfg.linesMin,
    linesMax: cfg.linesMax
  };

  const t0 = Date.now();
  console.log('\nInserting masters…');
  const products = cfg.products > 0 ? await seedProducts(rng) : [];
  const customers = cfg.customers > 0 ? await seedCustomers(rng) : [];

  if (customers.length === 0 || products.length === 0) {
    throw new Error('PERF_PRODUCTS and PERF_CUSTOMERS must be > 0 for transactional seed');
  }

  let docNo = cfg.docStartNo;
  console.log('\nInserting sales documents…');
  const lastSo = await seedSalesCollection(
    SalesOrder,
    'sales_order',
    cfg.salesOrder,
    docNo,
    customers,
    products,
    rng,
    dateRange
  );
  docNo += cfg.salesOrder;

  const lastDc = await seedSalesCollection(
    DeliveryChallan,
    'delivery_challan',
    cfg.deliveryChallan,
    docNo,
    customers,
    products,
    rng,
    dateRange
  );
  docNo += cfg.deliveryChallan;

  const lastSi = await seedSalesCollection(
    SalesInvoice,
    'sales_invoice',
    cfg.salesInvoice,
    docNo,
    customers,
    products,
    rng,
    dateRange
  );
  docNo += cfg.salesInvoice;

  const lastSr = await seedSalesCollection(
    SalesReturn,
    'sales_return',
    cfg.salesReturn,
    docNo,
    customers,
    products,
    rng,
    dateRange
  );

  await updateCounters(lastSo, lastDc, lastSi, lastSr);
  await printCounts();

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const mem = process.memoryUsage();
  console.log(`\nSeed completed in ${elapsed}s`);
  console.log(`  heap used: ${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`);
  await disconnectDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
