import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { SalesOrder } from '../src/models/SalesOrder.js';
import { SalesInvoice } from '../src/models/SalesInvoice.js';
import { PERF_CONFIG } from './config.js';
import { benchEndpoint, login } from './lib/httpBench.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportsDir = path.join(__dirname, 'reports');

function dateRangeLastMonths(months) {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - months, 1);
  const fmt = (d) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  return { from: fmt(start), to: fmt(end) };
}

async function sampleFormattedDoc() {
  const doc =
    (await SalesOrder.findOne({ formattedDocNo: /^PSO-/ }).select('formattedDocNo').lean()) ||
    (await SalesOrder.findOne().sort({ docNo: -1 }).select('formattedDocNo').lean());
  return doc?.formattedDocNo || 'PSO-1000000';
}

async function sampleInvoiceFormatted() {
  const doc =
    (await SalesInvoice.findOne({ formattedDocNo: /^PSI-/ }).select('formattedDocNo').lean()) ||
    (await SalesInvoice.findOne().sort({ docNo: -1 }).select('formattedDocNo').lean());
  return doc?.formattedDocNo || 'PSI-1000000';
}

function gridCases(base, resource, targetMs) {
  const b = `${base}/api/${resource}`;
  return [
    { name: `${resource} grid page 1`, url: `${b}?page=1&limit=25`, targetMs },
    { name: `${resource} grid page 50`, url: `${b}?page=50&limit=25`, targetMs },
    { name: `${resource} search "Perf"`, url: `${b}?page=1&limit=25&search=Perf`, targetMs: PERF_CONFIG.targets.searchMs },
    { name: `${resource} filter status=open`, url: `${b}?page=1&limit=25&status=open`, targetMs }
  ];
}

async function main() {
  const base = PERF_CONFIG.apiBase.replace(/\/$/, '');
  const targets = PERF_CONFIG.targets;
  console.log(`Benchmarking API at ${base}…`);

  let token = null;
  try {
    token = await login(base, PERF_CONFIG.loginId, PERF_CONFIG.loginPassword);
    console.log('  authenticated');
  } catch (err) {
    console.warn(`  login skipped: ${err.message}`);
  }

  await connectDb();
  const sampleSo = await sampleFormattedDoc();
  const sampleSi = await sampleInvoiceFormatted();
  await disconnectDb();

  const { from, to } = dateRangeLastMonths(3);
  const cases = [
    ...gridCases(base, 'sales-orders', targets.gridLoadMs),
    ...gridCases(base, 'delivery-challans', targets.gridLoadMs),
    ...gridCases(base, 'sales-invoices', targets.gridLoadMs),
    ...gridCases(base, 'sales-returns', targets.gridLoadMs),
    { name: 'products grid page 1', url: `${base}/api/products?page=1&limit=25`, targetMs: targets.gridLoadMs },
    { name: 'products search PERF-P001', url: `${base}/api/products/search?q=PERF-P001&limit=40`, targetMs: targets.searchMs },
    { name: 'customers grid page 1', url: `${base}/api/accounts?type=customer&page=1&limit=25`, targetMs: targets.gridLoadMs },
    { name: 'customers grid search (no API param — page 1 only)', url: `${base}/api/accounts?type=customer&page=1&limit=100`, targetMs: targets.gridLoadMs },
    { name: 'customer names dropdown (full load)', url: `${base}/api/accounts/names?type=customer`, targetMs: targets.searchMs },
    { name: 'dashboard', url: `${base}/api/dashboard`, targetMs: targets.dashboardMs },
    {
      name: 'document register (sales_invoice, 3 months)',
      url: `${base}/api/reports/document-register?type=sales_invoice&dateFrom=${encodeURIComponent(from)}&dateTo=${encodeURIComponent(to)}`,
      targetMs: targets.gridLoadMs * 2
    },
    {
      name: 'print data fetch — sales order by formatted',
      url: `${base}/api/sales-orders/by-formatted/${encodeURIComponent(sampleSo)}`,
      targetMs: targets.printMs
    },
    {
      name: 'print data fetch — sales invoice by formatted',
      url: `${base}/api/sales-invoices/by-formatted/${encodeURIComponent(sampleSi)}`,
      targetMs: targets.printMs
    },
    { name: 'sales order stats', url: `${base}/api/sales-orders/stats` },
    { name: 'health', url: `${base}/api/health`, iterations: 3 }
  ];

  const results = [];
  const memStart = process.memoryUsage();

  for (const c of cases) {
    process.stdout.write(`  ${c.name}…`);
    try {
      const row = await benchEndpoint(c.name, c.url, {
        iterations: c.iterations ?? 5,
        targetMs: c.targetMs,
        token
      });
      results.push(row);
      const ms = row.timing.p95.toFixed(0);
      const flag = row.pass === false ? ' FAIL' : row.pass === true ? ' OK' : '';
      console.log(` p95=${ms}ms payload≈${(row.payload.avgBytes / 1024).toFixed(1)}KB${flag}`);
    } catch (err) {
      results.push({ name: c.name, url: c.url, ok: false, error: err.message });
      console.log(` ERROR ${err.message}`);
    }
  }

  const memEnd = process.memoryUsage();
  const slow = results
    .filter((r) => r.timing && r.pass === false)
    .sort((a, b) => b.timing.p95 - a.timing.p95);

  const report = {
    generatedAt: new Date().toISOString(),
    apiBase: base,
    targets,
    sampleDocuments: { salesOrder: sampleSo, salesInvoice: sampleSi },
    memory: {
      heapUsedStartMb: memStart.heapUsed / 1024 / 1024,
      heapUsedEndMb: memEnd.heapUsed / 1024 / 1024
    },
    results,
    slowApis: slow
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const outPath = path.join(reportsDir, `benchmark-${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nWrote ${outPath}`);
  console.log(`Slow APIs (missed target): ${slow.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
