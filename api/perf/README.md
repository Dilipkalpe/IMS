# IMS performance & load testing

Scripts to seed **500,000** realistic documents (5 lakh), benchmark REST APIs, analyze MongoDB query plans, and generate `documentfortech/09_Performance_Test_Report.md`.

## Prerequisites

- MongoDB running (`mongodb://127.0.0.1:27017/ims` or set `MONGODB_URI`)
- For API benchmarks: `npm run dev:once` in another terminal

## Quick smoke test (~400 docs, ~1 min)

```powershell
cd api
$env:PERF_PURGE='1'
$env:PERF_PRODUCTS='50'
$env:PERF_CUSTOMERS='50'
$env:PERF_SALES_ORDERS='100'
$env:PERF_DELIVERY_CHALLANS='100'
$env:PERF_SALES_INVOICES='100'
$env:PERF_SALES_RETURNS='100'
node perf/seedLoadData.js
```

## Full 5 lakh seed (30–90+ minutes)

Use a **dedicated database** in production-like runs:

```powershell
$env:MONGODB_URI='mongodb://127.0.0.1:27017/ims_perf'
$env:PERF_PURGE='1'
npm run perf:seed
```

Distribution (default):

| Collection | Count |
|------------|------:|
| Products (`PERF-P*`) | 15,000 |
| Customers (`PERF-C*`) | 10,000 |
| Sales orders (`PSO-*`) | 118,750 |
| Delivery challans (`PDC-*`) | 118,750 |
| Sales invoices (`PSI-*`) | 118,750 |
| Sales returns (`PSR-*`) | 118,750 |
| **Total** | **500,000** |

`PERF_PURGE=1` removes only `PERF-*` / `PSO|PDC|PSI|PSR` prefixed load data, not your normal seed.

## Benchmark & report

```powershell
npm run dev:once
npm run perf:benchmark
npm run perf:analyze
npm run perf:report
```

Or: `npm run perf:all` (seeds unless `PERF_SKIP_SEED=1`).

## SLA targets (configured in `perf/config.js`)

| Metric | Target |
|--------|--------|
| Grid page | < 2 s |
| Search | < 1 s |
| Single-doc print fetch | < 3 s |

## WPF manual checks

API benchmarks do not measure WPF grid scroll, print layout, or PDF export. After seeding, open the desktop app and verify:

- Sales Order / Invoice / Return / Delivery Challan lists (server paging)
- Product & Customer masters (client paging — expect lag at scale)
- Print preview: headers, logo, totals, page breaks
- Task Manager: CPU/memory during scroll

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PERF_TOTAL_RECORDS` | 500000 | Total doc target |
| `PERF_PURGE` | 0 | `1` = delete prior perf load data |
| `PERF_BATCH_SIZE` | 2500 | `insertMany` batch size |
| `PERF_API_BASE` | http://127.0.0.1:3000 | Benchmark base URL |
| `PERF_SKIP_SEED` | — | Set `1` for `perf:all` to skip seed |
