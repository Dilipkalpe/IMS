import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportsDir = path.join(__dirname, 'reports');
const docOut = path.resolve(__dirname, '../../documentfortech/09_Performance_Test_Report.md');

function latestJson(prefix) {
  if (!fs.existsSync(reportsDir)) return null;
  const files = fs
    .readdirSync(reportsDir)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.json'))
    .sort()
    .reverse();
  return files[0] ? path.join(reportsDir, files[0]) : null;
}

function fmtMs(n) {
  return n == null ? '—' : `${Number(n).toFixed(0)} ms`;
}

function passIcon(pass) {
  if (pass === true) return 'PASS';
  if (pass === false) return 'FAIL';
  return '—';
}

function renderBenchmarkTable(results) {
  const lines = [
    '| Endpoint | p50 | p95 | Payload (avg) | Target | Result |',
    '|----------|-----|-----|---------------|--------|--------|'
  ];
  for (const r of results) {
    if (!r.timing) {
      lines.push(`| ${r.name} | — | — | — | — | ERROR: ${r.error || 'unknown'} |`);
      continue;
    }
    lines.push(
      `| ${r.name} | ${fmtMs(r.timing.p50)} | ${fmtMs(r.timing.p95)} | ${(r.payload.avgBytes / 1024).toFixed(1)} KB | ${r.targetMs ? fmtMs(r.targetMs) : '—'} | ${passIcon(r.pass)} |`
    );
  }
  return lines.join('\n');
}

function main() {
  const benchPath = latestJson('benchmark-');
  const dbPath = latestJson('db-analysis-');

  if (!benchPath) {
    console.error('No benchmark JSON found. Run: npm run perf:benchmark');
    process.exit(1);
  }

  const bench = JSON.parse(fs.readFileSync(benchPath, 'utf8'));
  const db = dbPath ? JSON.parse(fs.readFileSync(dbPath, 'utf8')) : null;

  const bottlenecks = [];
  for (const r of bench.results || []) {
    if (r.pass === false) {
      bottlenecks.push(`**${r.name}** — p95 ${fmtMs(r.timing?.p95)} (target ${fmtMs(r.targetMs)})`);
    }
  }

  const wpfNotes = [
    '**Product Master** and **Customer Ledger** load all API pages client-side — at 15k+ products or 10k+ customers the WPF UI will lag regardless of fast page-1 API times.',
    '**Print preview** (Sales Order, Tax Invoice, Delivery Challan, Sales Return) runs on the WPF thread; API fetch time is only part of the story. Measure full print in Visual Studio Diagnostic Tools or add WPF perf counters.',
    '**Grid scrolling** depends on server paging (`EnableServerPaging` on sales lists). Verify in UI with page size 25 while seed data is loaded.',
    '**Global search** on sales documents hits API `search` with regex — acceptable at moderate scale; consider text index or Atlas Search beyond 1M docs.'
  ];

  const dbSection = db
    ? `### Collection counts\n\n\`\`\`json\n${JSON.stringify(db.counts, null, 2)}\n\`\`\`\n\n### Query plans\n\n| Query | Examined | Returned | Index / stage | Time |\n|-------|----------|----------|---------------|------|\n${db.explains
        .map(
          (e) =>
            `| ${e.label} | ${e.totalDocsExamined} | ${e.nReturned} | ${e.winningPlan} | ${e.executionTimeMillis} ms |`
        )
        .join(
          '\n'
        )}\n\n### Index recommendations\n\n${db.recommendations.map((r) => `- **${r.area}**: ${r.issue}. *${r.suggestion}*`).join('\n')}`
    : '_Run `npm run perf:analyze` to populate database analysis._';

  const scaleNote = db?.counts
    ? `Benchmark run dataset: **${(db.counts.salesOrders || 0).toLocaleString()}** sales orders, **${(db.counts.salesInvoices || 0).toLocaleString()}** invoices, **${(db.counts.products || 0).toLocaleString()}** products, **${(db.counts.customers || 0).toLocaleString()}** customers. PERF load subset: **${(db.counts.perfSalesOrders || 0).toLocaleString()}** PSO docs. Re-run \`npm run perf:benchmark\` after \`npm run perf:seed\` completes for full 5-lakh numbers.`
    : 'Re-run after seed and analyze complete.';

  const md = `# IMS Performance & Load Test Report

Generated: ${bench.generatedAt}  
API base: \`${bench.apiBase}\`  
Benchmark artifact: \`${path.basename(benchPath)}\`

> ${scaleNote}

## Targets

| Metric | Target |
|--------|--------|
| Grid load | < ${bench.targets.gridLoadMs} ms |
| Search | < ${bench.targets.searchMs} ms |
| Print data fetch (single document) | < ${bench.targets.printMs} ms |
| Dashboard | < ${bench.targets.dashboardMs} ms |

## How to reproduce (5 lakh / 500,000 records)

\`\`\`bash
cd api
set PERF_PURGE=1
set MONGODB_URI=mongodb://127.0.0.1:27017/ims_perf
npm run perf:seed
npm run dev:once
npm run perf:benchmark
npm run perf:analyze
npm run perf:report
\`\`\`

Default distribution: 15,000 products + 10,000 customers + 118,750 each of Sales Order, Delivery Challan, Sales Invoice, Sales Return = **500,000** documents.

## API benchmark results

${renderBenchmarkTable(bench.results)}

### Slow APIs (missed SLA)

${bottlenecks.length ? bottlenecks.map((b) => `- ${b}`).join('\n') : '_None exceeded configured targets in this run._'}

## Print generation performance

| Check | Method | Notes |
|-------|--------|-------|
| Sales Order format | \`GET /api/sales-orders/by-formatted/{no}\` | Measures data load for print; WPF layout/PDF not included |
| Sales Invoice format | \`GET /api/sales-invoices/by-formatted/{no}\` | Same |
| Delivery Challan / Sales Return | Use analogous \`by-formatted\` routes | Add UI timing separately |
| Batch print / export | Not automated | Implement queue + benchmark if required |

Sample documents used: SO \`${bench.sampleDocuments?.salesOrder}\`, SI \`${bench.sampleDocuments?.salesInvoice}\`.

**Client-side checklist (manual):** page breaks, logo, headers/footers, totals alignment, batch PDF export.

## Database validation

${dbSection}

## WPF / desktop bottlenecks

${wpfNotes.map((n) => `- ${n}`).join('\n')}

## Memory (benchmark runner)

- Heap at start: ${bench.memory?.heapUsedStartMb?.toFixed(1) ?? '—'} MB  
- Heap at end: ${bench.memory?.heapUsedEndMb?.toFixed(1) ?? '—'} MB  

_CPU and network utilization during grid scroll require OS/Task Manager or Windows Performance Recorder during manual UI pass._

## Suggested fixes (priority)

1. Add \`search\` query param to \`GET /api/accounts\` (regex on name/code) — avoid loading full customer list for filters.
2. Keep **server-side pagination** enabled on all high-volume list screens (sales docs already use \`EnableServerPaging\`).
3. Migrate **Product Master** to server paging + virtualized grid (match sales list pattern).
4. Optimize **dashboard** aggregations with \`$match\` on date + indexed \`createdAt\` / \`billDate\` where possible.
5. For **document register** reports, cap date range server-side and stream rows for export.
6. Ensure compound indexes from \`api/perf/ensureIndexes.js\` are applied in production.

## Files

| Script | Purpose |
|--------|---------|
| \`npm run perf:seed\` | Insert PERF-* load data |
| \`npm run perf:indexes\` | Ensure compound indexes |
| \`npm run perf:benchmark\` | HTTP latency suite |
| \`npm run perf:analyze\` | MongoDB explain + recommendations |
| \`npm run perf:report\` | Regenerate this document |
| \`npm run perf:all\` | Seed (optional skip) + analyze + benchmark + report |
`;

  fs.mkdirSync(path.dirname(docOut), { recursive: true });
  fs.writeFileSync(docOut, md);
  console.log(`Wrote ${docOut}`);
}

main();
