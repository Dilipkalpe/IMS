/**
 * Load-test configuration — 500,000 document target (5 lakh).
 * Override with env: PERF_TOTAL_RECORDS, PERF_PRODUCTS, etc.
 */

const TOTAL = Number(process.env.PERF_TOTAL_RECORDS) || 500_000;

/** Masters are included in TOTAL when PERF_INCLUDE_MASTERS=1 (default). */
const includeMasters = process.env.PERF_INCLUDE_MASTERS !== '0';
const products = Number(process.env.PERF_PRODUCTS) || (includeMasters ? 15_000 : 0);
const customers = Number(process.env.PERF_CUSTOMERS) || (includeMasters ? 10_000 : 0);
const masters = products + customers;

const transactional = Math.max(0, TOTAL - masters);
const perSalesType = Math.floor(transactional / 4);

export const PERF_CONFIG = {
  totalTarget: TOTAL,
  products,
  customers,
  salesOrder: Number(process.env.PERF_SALES_ORDERS) || perSalesType,
  deliveryChallan: Number(process.env.PERF_DELIVERY_CHALLANS) || perSalesType,
  salesInvoice: Number(process.env.PERF_SALES_INVOICES) || perSalesType,
  salesReturn: Number(process.env.PERF_SALES_RETURNS) || perSalesType,
  batchSize: Number(process.env.PERF_BATCH_SIZE) || 2500,
  seed: Number(process.env.PERF_SEED) || 42_500_000,
  docStartNo: Number(process.env.PERF_DOC_START) || 1_000_000,
  linesMin: Number(process.env.PERF_LINES_MIN) || 1,
  linesMax: Number(process.env.PERF_LINES_MAX) || 4,
  apiBase: process.env.PERF_API_BASE || 'http://127.0.0.1:3000',
  loginId: process.env.PERF_LOGIN_ID || 'admin',
  loginPassword: process.env.PERF_LOGIN_PASSWORD || 'Ims@2024',
  targets: {
    gridLoadMs: 2000,
    searchMs: 1000,
    printMs: 3000,
    dashboardMs: 3000
  },
  purgeBeforeSeed: process.env.PERF_PURGE === '1'
};

export function expectedDocumentTotal() {
  const c = PERF_CONFIG;
  return c.products + c.customers + c.salesOrder + c.deliveryChallan + c.salesInvoice + c.salesReturn;
}
