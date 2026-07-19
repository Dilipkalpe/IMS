import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const repoRoot = path.join(root, '..');

// Parse desktop NavigationCatalog definitions
const navCatalog = fs.readFileSync(path.join(repoRoot, 'IMS/Services/NavigationCatalog.cs'), 'utf8');
const desktopScreens = [];
for (const m of navCatalog.matchAll(/new\(NavKeys\.(\w+),\s*"([^"]+)",\s*(\w+Section)/g)) {
  desktopScreens.push({ keyConst: m[1], title: m[2] });
}
if (navCatalog.includes('"production-report"')) {
  desktopScreens.push({ keyConst: 'ProductionReport', title: 'Production Metrics' });
}

const navKeysCs = fs.readFileSync(path.join(repoRoot, 'IMS/Services/NavKeys.cs'), 'utf8');
const keyMap = {};
for (const m of navKeysCs.matchAll(/public const string (\w+) = "([^"]+)"/g)) {
  keyMap[m[1]] = m[2];
}

const desktop = desktopScreens.map((s) => ({
  key: keyMap[s.keyConst] ?? s.keyConst.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, ''),
  title: s.title,
  keyConst: s.keyConst,
}));

const navKeysTs = fs.readFileSync(path.join(root, 'src/navigation/navKeys.ts'), 'utf8');
const webNavKeys = {};
for (const m of navKeysTs.matchAll(/(\w+):\s*'([^']+)'/g)) {
  webNavKeys[m[1]] = m[2];
}

const refinedMap = fs.readFileSync(path.join(root, 'src/navigation/refinedScreenMap.tsx'), 'utf8');
const explicitNavKeys = new Set(
  [...refinedMap.matchAll(/\[NavKeys\.(\w+)\]/g)].map((m) => webNavKeys[m[1]]).filter(Boolean),
);
for (const m of refinedMap.matchAll(/'([a-z0-9-]+)':/g)) {
  explicitNavKeys.add(m[1]);
}

const masterConfigs = fs.readFileSync(path.join(root, 'src/masters/masterConfigs.ts'), 'utf8');
const masterListKeys = new Set(
  [...masterConfigs.matchAll(/listNavKey:\s*'([^']+)'/g)].map((m) => m[1]),
);

const configBlocks = masterConfigs.split(/export const \w+_CONFIG/);
const masterCrudKeys = new Set();
for (const block of configBlocks) {
  const navMatch = block.match(/listNavKey:\s*'([^']+)'/);
  if (navMatch && (block.includes('apiCrud: true') || block.includes('crudEntity:'))) {
    masterCrudKeys.add(navMatch[1]);
  }
}

/** Keys with verified web parity (routes + primary workflow + export/print where applicable). */
const FULL_KEYS = new Set([
  'dashboard',
  'sales-orders', 'delivery-challan', 'sales-invoice', 'sales-return', 'quotation',
  'purchase-orders', 'grn', 'purchase-invoice', 'purchase-return',
  'payment-voucher', 'receipt-voucher', 'credit-note', 'debit-note', 'bank-entry', 'petty-cash',
  'production-orders', 'bom', 'stock-transfer',
  'payroll-employees', 'attendance', 'payroll-runs', 'payroll-reports',
  'stock-levels', 'stock-movements',
  'products', 'product-types', 'main-groups', 'sub-groups', 'assembly-types', 'machines', 'warehouses',
  'sale-uom', 'purchase-uom', 'account-ledger', 'suppliers', 'company-registration', 'customer-types',
  'user-roles', 'role-master',
  'financial-years', 'settings',
  'bill-format-designer', 'report-formats-canvas',
  'import-product', 'import-account', 'import-sales-invoice', 'import-purchase-invoice',
  'ledger-report', 'reorder-level', 'profit-analysis', 'purchase-analysis', 'sales-analysis',
  'outstanding', 'due-day', 'due-amount',
  'opening-stock', 'closing-stock', 'stock-summary',
  'trial-balance', 'trading-account', 'profit-loss', 'profit-loss-trading', 'balance-sheet',
  'sales-order-register', 'sales-dc-register', 'sales-invoice-register', 'sales-return-register',
  'purchase-order-register', 'grn-register', 'purchase-invoice-register', 'purchase-return-register',
  'production-report',
]);

function classify(key) {
  if (!explicitNavKeys.has(key)) return 'missing';
  if (FULL_KEYS.has(key)) return 'full';
  if (masterListKeys.has(key)) {
    if (masterCrudKeys.has(key)) return 'full';
    if (['products', 'account-ledger', 'suppliers', 'payroll-employees'].includes(key)) return 'full';
    return 'partial';
  }
  return 'partial';
}

const matrix = desktop.map((d) => ({
  key: d.key,
  title: d.title,
  status: classify(d.key),
}));

const counts = { full: 0, partial: 0, missing: 0, placeholder: 0 };
for (const row of matrix) counts[row.status]++;

console.log(JSON.stringify({ counts, matrix }, null, 2));

// Also write markdown snippet for docs
const mdPath = path.join(root, 'docs/CONVERSION-GAP-REPORT.md');
if (fs.existsSync(mdPath)) {
  let md = fs.readFileSync(mdPath, 'utf8');
  const summary = `| **Full** | ${counts.full} | Route + primary workflow wired to API with list/entry or CRUD |
| **Partial** | ${counts.partial} | Screen exists; secondary actions, print, or advanced flows incomplete |
| **Missing** | ${counts.missing} | Desktop nav key with no web route`;
  md = md.replace(
    /\| \*\*Full\*\* \| \d+ \|[^\n]+\n\| \*\*Partial\*\* \| \d+ \|[^\n]+\n\| \*\*Missing\*\* \| \d+ \|[^\n]+/,
    summary,
  );
  md = md.replace(/Generated: [^\n]+/, `Generated: ${new Date().toISOString().slice(0, 10)}`);
  fs.writeFileSync(mdPath, md);
}
