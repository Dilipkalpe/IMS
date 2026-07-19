import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { Product } from '../src/models/Product.js';
import { Account } from '../src/models/Account.js';
import { SalesOrder } from '../src/models/SalesOrder.js';
import { SalesInvoice } from '../src/models/SalesInvoice.js';
import { DeliveryChallan } from '../src/models/DeliveryChallan.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportsDir = path.join(__dirname, 'reports');

async function explain(model, filter, sort, label) {
  const cursor = model.find(filter).sort(sort).skip(0).limit(25);
  const explained = await cursor.explain('executionStats');
  const stats = explained.executionStats || explained;
  return {
    label,
    collection: model.collection.name,
    nReturned: stats.nReturned,
    totalDocsExamined: stats.totalDocsExamined,
    totalKeysExamined: stats.totalKeysExamined,
    executionTimeMillis: stats.executionTimeMillis,
    winningPlan: explained.queryPlanner?.winningPlan?.inputStage?.indexName
      || explained.queryPlanner?.winningPlan?.stage
      || 'unknown'
  };
}

async function main() {
  await connectDb();

  const explains = await Promise.all([
    explain(Product, {}, { code: 1 }, 'products list'),
    explain(
      Product,
      { $or: [{ code: /PERF-P001/i }, { name: /PERF-P001/i }] },
      { code: 1 },
      'products search'
    ),
    explain(Account, { accountType: 'customer' }, { code: 1 }, 'customers list'),
    explain(
      SalesOrder,
      { $or: [{ customer: /Perf/i }, { formattedDocNo: /Perf/i }] },
      { docNo: -1 },
      'sales orders search'
    ),
    explain(SalesOrder, {}, { docNo: -1 }, 'sales orders list'),
    explain(SalesInvoice, { status: 'open' }, { docNo: -1 }, 'sales invoices status filter'),
    explain(DeliveryChallan, {}, { docNo: -1 }, 'delivery challans list')
  ]);

  const counts = {
    products: await Product.countDocuments(),
    customers: await Account.countDocuments({ accountType: 'customer' }),
    salesOrders: await SalesOrder.countDocuments(),
    salesInvoices: await SalesInvoice.countDocuments(),
    perfProducts: await Product.countDocuments({ code: /^PERF-/i }),
    perfSalesOrders: await SalesOrder.countDocuments({ formattedDocNo: /^PSO-/i })
  };

  const recommendations = [];
  for (const row of explains) {
    if (row.totalDocsExamined > row.nReturned * 10 && row.nReturned > 0) {
      recommendations.push({
        area: row.label,
        issue: `COLLSCAN or high examine ratio (${row.totalDocsExamined} examined, ${row.nReturned} returned)`,
        suggestion: 'Add compound index matching filter + sort; avoid leading-regex scans where possible'
      });
    }
    if (row.executionTimeMillis > 100) {
      recommendations.push({
        area: row.label,
        issue: `Slow query (${row.executionTimeMillis}ms)`,
        suggestion: 'Review index coverage and reduce projection size'
      });
    }
  }

  if (counts.customers > 5000) {
    recommendations.push({
      area: 'GET /api/accounts/names',
      issue: 'Loads all active customers into one response',
      suggestion: 'Replace with paginated typeahead search endpoint for WPF dropdowns'
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    counts,
    explains,
    recommendations
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  const outPath = path.join(reportsDir, `db-analysis-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`Wrote ${outPath}`);
  console.log(JSON.stringify(counts, null, 2));

  await disconnectDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
