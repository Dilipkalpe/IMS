/**
 * Generates IMS_Test_Cases_Module_Wise.xlsx — one sheet per module.
 * Run from repo root: node ims-web/scripts/generate-test-cases-xlsx.mjs
 */
import ExcelJS from 'exceljs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.join(__dirname, '../docs/IMS_Test_Cases_Module_Wise.xlsx');

const FY = '2025-26';
const CO = 'ABC Manufacturing Pvt Ltd';
const GSTIN = '27AABCU9603R1ZM';
const CUST = 'Reliance Retail Ltd | GSTIN 27AAACR5055K1Z5 | MH';
const SUPP = 'Tata Steel Ltd | GSTIN 27AAACT2727Q1ZW | MH';
const WH = 'Main Godown';
const FG = 'FG-WIDGET-001 | HSN 8471 | 18% GST';
const RM = 'RM-STEEL-10MM | HSN 7214 | 18% GST';
const ADMIN = 'admin / admin';

const COLS = [
  'Test Case ID', 'Module / Screen', 'Feature / Area', 'Test Scenario',
  'Preconditions', 'Test Steps', 'Test Data (sample)', 'Expected Result',
  'Priority', 'Test Type',
];

function tc(id, mod, feat, scen, pre, steps, data, exp, pri = 'High', typ = 'Functional') {
  return {
    'Test Case ID': id, 'Module / Screen': mod, 'Feature / Area': feat,
    'Test Scenario': scen, Preconditions: pre, 'Test Steps': steps,
    'Test Data (sample)': data, 'Expected Result': exp, Priority: pri, 'Test Type': typ,
  };
}

function txnModule(prefix, mod, docType, partyLabel, party, product = FG) {
  return [
    tc(`${prefix}-001`, mod, 'List', `List ${docType} for FY`, `Logged in; FY ${FY} active`,
      '1. Open module\n2. Review default grid', `FY: ${FY}`,
      'Records shown with doc no, date, party, amount', 'High'),
    tc(`${prefix}-002`, mod, 'Create', `Create ${docType} with GST`, `${partyLabel} and product exist`,
      '1. New\n2. Select party\n3. Add line (HSN, qty, rate)\n4. Save',
      `${partyLabel}: ${party}\nProduct: ${product}\nQty: 10 @ ₹1,000`,
      'Saved with auto number; tax breakup correct', 'High'),
    tc(`${prefix}-003`, mod, 'Edit', 'Edit draft before post', 'Draft exists',
      '1. Open draft\n2. Change qty\n3. Save', 'Qty: 10 → 15', 'Totals and tax recalculated', 'Medium'),
    tc(`${prefix}-004`, mod, 'GST Intra', 'CGST+SGST same state', 'Party same state as company',
      '1. Create doc\n2. Verify tax columns', 'Place of supply: Maharashtra',
      'CGST 9% + SGST 9% on taxable value', 'High'),
    tc(`${prefix}-005`, mod, 'GST Inter', 'IGST other state', 'Inter-state customer/supplier',
      '1. Select Gujarat party\n2. Save', 'Place of supply: Gujarat',
      'IGST 18%; no CGST/SGST split', 'High'),
    tc(`${prefix}-006`, mod, 'Filter', 'Filter by doc no and date', 'Multiple records',
      '1. Doc no filter\n2. Date Apr 2025–Mar 2026', `${docType}/25-26/001`,
      'Filtered list matches criteria', 'Medium'),
    tc(`${prefix}-007`, mod, 'Validation', 'Mandatory fields', 'New form',
      '1. Save without party', 'Empty party', 'Validation blocks save', 'High'),
    tc(`${prefix}-008`, mod, 'Print', 'Print tax document', 'Posted doc; template set',
      '1. Open doc\n2. Print preview', 'A4 Tax Invoice template',
      'GSTIN, HSN, tax summary on print', 'High', 'Print'),
    tc(`${prefix}-009`, mod, 'Clone', 'Clone existing', 'Source posted',
      '1. Clone row\n2. Save new', `Source: ${docType}/25-26/001`,
      'New number assigned; lines copied', 'Medium'),
    tc(`${prefix}-010`, mod, 'Cancel', 'Delete/cancel draft', 'Draft only',
      '1. Delete draft\n2. Confirm', 'Unposted draft', 'Removed from list', 'Medium'),
  ];
}

function reportModule(prefix, mod, reportName) {
  return [
    tc(`${prefix}-001`, mod, 'Run', `Generate ${reportName}`, `FY ${FY}; transactions posted`,
      '1. Open report\n2. Set period\n3. Run', `From: 01-Apr-2025\nTo: 31-Mar-2026`,
      'Report renders without error', 'High'),
    tc(`${prefix}-002`, mod, 'Filter', 'Date range filter', 'Data in multiple months',
      '1. Set Apr 2025 only\n2. Run', 'Apr 2025', 'Only April transactions included', 'High'),
    tc(`${prefix}-003`, mod, 'Export', 'Export/print report', 'Report generated',
      '1. Print or export', 'PDF/A4', 'Output matches on-screen totals', 'Medium', 'Print'),
    tc(`${prefix}-004`, mod, 'Zero Data', 'Empty period handling', 'No txn in range',
      '1. Select future dates\n2. Run', 'Future month', 'Empty state or zero totals shown', 'Low'),
    tc(`${prefix}-005`, mod, 'Drill', 'Row drill to source doc', 'Linked transactions exist',
      '1. Click doc link if available', 'INV/25-26/0042', 'Opens source document', 'Medium'),
    tc(`${prefix}-006`, mod, 'Permission', 'Role access', 'Limited role user',
      '1. Login restricted user\n2. Open report', 'purchase_user', 'Access per role matrix', 'Medium'),
    tc(`${prefix}-007`, mod, 'FY', 'Respects active FY', 'FY switched',
      '1. Change FY\n2. Re-run', `FY: ${FY}`, 'Figures match FY scope', 'High'),
  ];
}

function masterModule(prefix, mod, entity, sample) {
  return [
    tc(`${prefix}-001`, mod, 'List', `List ${entity}`, 'Admin logged in',
      '1. Open master\n2. Search grid', `Search: ${sample.split('|')[0].trim()}`,
      'Matching master records displayed', 'High'),
    tc(`${prefix}-002`, mod, 'Create', `Add ${entity}`, 'Required refs exist',
      '1. New\n2. Fill mandatory\n3. Save', sample, 'Record saved with unique code', 'High'),
    tc(`${prefix}-003`, mod, 'Edit', `Update ${entity}`, 'Record exists',
      '1. Open record\n2. Edit field\n3. Save', 'Update address/contact', 'Changes persisted', 'Medium'),
    tc(`${prefix}-004`, mod, 'Validation', 'Duplicate code rejected', 'Code ABC-001 exists',
      '1. New with same code\n2. Save', 'Duplicate code', 'Error; not saved', 'High'),
    tc(`${prefix}-005`, mod, 'Inactive', 'Deactivate record', 'Record unused in open txn',
      '1. Mark inactive\n2. Save', 'Active → Inactive', 'Hidden from new txn lookups', 'Medium'),
    tc(`${prefix}-006`, mod, 'Search', 'Quick search', 'Multiple records',
      '1. Type partial name\n2. Select', 'Partial text', 'Filtered dropdown/grid', 'Low', 'UI'),
    tc(`${prefix}-007`, mod, 'GST', 'GST fields for Indian context', 'Party/product master',
      '1. Enter GSTIN/PAN\n2. Save', `GSTIN: ${GSTIN}`, 'Valid format accepted', 'High'),
  ];
}

/** @type {{ hub: string, module: string, sheet: string, cases: object[] }[]} */
const MODULES = [
  { hub: 'Authentication', module: 'Login', sheet: 'Login', cases: [
    tc('LOGIN-001', 'Login', 'Sign In', 'Valid admin login', 'admin user exists',
      '1. Open app URL\n2. Enter credentials\n3. Sign In', ADMIN,
      'Dashboard loads; session active', 'High'),
    tc('LOGIN-002', 'Login', 'Sign In', 'Invalid password', 'Login page open',
      '1. admin / wrongpass\n2. Submit', 'Bad password', 'Error; no session', 'High'),
    tc('LOGIN-003', 'Login', 'Validation', 'Blank fields', 'Login page',
      '1. Submit empty', 'Blank', 'Validation shown', 'Medium', 'UI'),
    tc('LOGIN-004', 'Login', 'RBAC', 'Role-limited menu', 'sales_user exists',
      '1. Login sales_user\n2. Check nav', 'sales_user / sales123', 'Sales modules only', 'High'),
    tc('LOGIN-005', 'Login', 'Context', 'Company & FY header', 'Multi-company',
      '1. Login admin\n2. Check header', `Co: ${CO}\nFY: ${FY}`, 'Context displayed', 'High'),
    tc('LOGIN-006', 'Login', 'Session', 'Logout clears session', 'Logged in',
      '1. Logout\n2. Back button', 'admin', 'Redirect to login', 'Medium'),
    tc('LOGIN-007', 'Login', 'Mobile', 'Responsive login', 'Mobile viewport',
      '1. 375px width\n2. Login', ADMIN, 'Usable layout', 'Low', 'Mobile'),
  ]},
  { hub: 'Overview', module: 'Dashboard', sheet: 'Dashboard', cases: [
    tc('DASH-001', 'Dashboard', 'KPI', 'Load overview KPIs', 'Txn in FY',
      '1. Open Overview', `FY: ${FY}`, 'KPI cards populate', 'High'),
    tc('DASH-002', 'Dashboard', 'Charts', 'Sales chart', 'Sales data exists',
      '1. View sales widget', 'Current month', 'Chart renders', 'Medium', 'UI'),
    tc('DASH-003', 'Dashboard', 'FY', 'FY-scoped metrics', 'FY active',
      '1. Compare after FY switch', FY, 'Metrics update', 'High'),
    tc('DASH-004', 'Dashboard', 'Nav', 'Navigate to module', 'Dashboard open',
      '1. Use menu search Sales Orders', 'Sales Orders', 'Correct screen opens', 'Medium'),
    tc('DASH-005', 'Dashboard', 'RBAC', 'Widget visibility', 'Limited user',
      '1. Login purchase_user', 'purchase_user', 'No unauthorized data', 'Medium'),
    tc('DASH-006', 'Dashboard', 'Refresh', 'After new invoice', 'Baseline total known',
      '1. Post INV\n2. Refresh', 'INV/25-26/0099', 'Total increases', 'Medium'),
    tc('DASH-007', 'Dashboard', 'Perf', 'Load time', 'Production URL',
      '1. Hard refresh', '8081 prod', 'Interactive < 5s', 'Low'),
  ]},
  { hub: 'Sales', module: 'Sales Orders', sheet: 'Sales Orders', cases: txnModule('SO', 'Sales Orders', 'SO', 'Customer', CUST) },
  { hub: 'Sales', module: 'Quotes', sheet: 'Quotes', cases: txnModule('QT', 'Quotes', 'QT', 'Customer', CUST) },
  { hub: 'Sales', module: 'Delivery Notes', sheet: 'Delivery Notes', cases: txnModule('DC', 'Delivery Notes', 'DC', 'Customer', CUST) },
  { hub: 'Sales', module: 'Invoices', sheet: 'Invoices', cases: txnModule('SI', 'Invoices', 'INV', 'Customer', CUST) },
  { hub: 'Sales', module: 'Returns', sheet: 'Sales Returns', cases: txnModule('SR', 'Sales Returns', 'SR', 'Customer', CUST) },
  { hub: 'Procurement', module: 'Purchase Orders', sheet: 'Purchase Orders', cases: txnModule('PO', 'Purchase Orders', 'PO', 'Supplier', SUPP, RM) },
  { hub: 'Procurement', module: 'Goods Receipt', sheet: 'Goods Receipt', cases: txnModule('GRN', 'Goods Receipt', 'GRN', 'Supplier', SUPP, RM) },
  { hub: 'Procurement', module: 'Vendor Bills', sheet: 'Vendor Bills', cases: txnModule('PI', 'Vendor Bills', 'PI', 'Supplier', SUPP, RM) },
  { hub: 'Procurement', module: 'Vendor Returns', sheet: 'Vendor Returns', cases: txnModule('PR', 'Vendor Returns', 'PR', 'Supplier', SUPP, RM) },
  { hub: 'Manufacturing', module: 'Work Orders', sheet: 'Work Orders', cases: [
    tc('WO-001', 'Work Orders', 'List', 'List work orders', 'BOM exists',
      '1. Open Work Orders', FY, 'WO grid loads', 'High'),
    tc('WO-002', 'Work Orders', 'Create', 'Create production order', 'FG and BOM defined',
      '1. New WO\n2. Select FG\n3. Qty 100\n4. Save', `${FG}\nQty: 100`, 'WO/25-26/001 created', 'High'),
    tc('WO-003', 'Work Orders', 'Issue RM', 'Material issue to WO', 'WO released; RM stock',
      '1. Issue materials\n2. Confirm', `${RM} qty 50`, 'Stock reduced; issue logged', 'High'),
    tc('WO-004', 'Work Orders', 'Complete', 'Finish production', 'Materials issued',
      '1. Record output\n2. Complete WO', 'Output: 98 FG', 'FG stock increased', 'High'),
    tc('WO-005', 'Work Orders', 'Routing', 'Work center assignment', 'Machine master exists',
      '1. Assign work center\n2. Save', 'CNC Line 1', 'Routing saved', 'Medium'),
    tc('WO-006', 'Work Orders', 'Cancel', 'Cancel open WO', 'No completions',
      '1. Cancel WO', 'Open WO', 'Status cancelled', 'Medium'),
    tc('WO-007', 'Work Orders', 'Print', 'Print job card', 'WO active',
      '1. Print job card', 'Job card template', 'BOM and qty on print', 'Medium', 'Print'),
    tc('WO-008', 'Work Orders', 'Validation', 'Qty validation', 'New WO',
      '1. Zero qty save', 'Qty: 0', 'Blocked', 'High'),
  ]},
  { hub: 'Manufacturing', module: 'Bill of Materials', sheet: 'BOM', cases: [
    tc('BOM-001', 'Bill of Materials', 'List', 'List BOMs', 'Products exist',
      '1. Open BOM', FG, 'BOM list shown', 'High'),
    tc('BOM-002', 'Bill of Materials', 'Create', 'Define BOM', 'RM masters exist',
      '1. New BOM for FG\n2. Add RM lines\n3. Save', `${FG}\n${RM} x 2`, 'BOM saved', 'High'),
    tc('BOM-003', 'Bill of Materials', 'Revision', 'BOM revision', 'BOM v1 exists',
      '1. Revise BOM\n2. Change qty\n3. Save new rev', 'RM qty 2→3', 'New revision active', 'Medium'),
    tc('BOM-004', 'Bill of Materials', 'Cost', 'Standard cost rollup', 'Rates on RM',
      '1. View cost', 'RM rate ₹500', 'Total BOM cost calculated', 'Medium'),
    tc('BOM-005', 'Bill of Materials', 'Validation', 'Circular BOM blocked', 'FG=A',
      '1. Add FG as own component', 'Circular ref', 'Error shown', 'High'),
    tc('BOM-006', 'Bill of Materials', 'Inactive', 'Obsolete BOM', 'Old revision',
      '1. Mark inactive', 'Rev 1', 'Not selectable on new WO', 'Low'),
    tc('BOM-007', 'Bill of Materials', 'Print', 'Print BOM sheet', 'BOM saved',
      '1. Print', 'BOM report', 'Components listed', 'Low', 'Print'),
  ]},
  { hub: 'Payroll & HR', module: 'Employees', sheet: 'Employees', cases: masterModule('EMP', 'Employees', 'Employee', 'EMP-001 | Rajesh Kumar | PAN ABCPK1234F | ₹45,000') },
  { hub: 'Payroll & HR', module: 'Time & Attendance', sheet: 'Attendance', cases: [
    tc('ATT-001', 'Time & Attendance', 'Mark', 'Daily attendance', 'Employees exist',
      '1. Select date\n2. Mark present', 'Date: 15-Jul-2025\nEMP-001 Present', 'Saved', 'High'),
    tc('ATT-002', 'Time & Attendance', 'Leave', 'Apply leave', 'Leave balance',
      '1. Leave entry\n2. Save', 'CL 1 day', 'Leave recorded', 'High'),
    tc('ATT-003', 'Time & Attendance', 'OT', 'Overtime hours', 'Present day',
      '1. Enter OT\n2. Save', 'OT: 2 hrs', 'OT captured', 'Medium'),
    tc('ATT-004', 'Time & Attendance', 'Report', 'Monthly summary', 'Month data',
      '1. Run month view', 'Jul 2025', 'Days present/absent correct', 'Medium'),
    tc('ATT-005', 'Time & Attendance', 'Validation', 'Future date', 'Today 15-Jul',
      '1. Mark future', 'Future date', 'Warning or block', 'Low'),
    tc('ATT-006', 'Time & Attendance', 'Import', 'Bulk upload', 'Template',
      '1. Import Excel', 'Attendance template', 'Rows imported', 'Medium'),
    tc('ATT-007', 'Time & Attendance', 'Mobile', 'Mobile mark', 'Mobile browser',
      '1. Mark on phone', '375px', 'Usable UI', 'Low', 'Mobile'),
  ]},
  { hub: 'Payroll & HR', module: 'Payroll Runs', sheet: 'Payroll Runs', cases: [
    tc('PAY-001', 'Payroll Runs', 'Process', 'Monthly payroll run', 'Attendance complete',
      '1. New run Jul 2025\n2. Calculate\n3. Post', 'Month: Jul 2025', 'Net pay computed', 'High'),
    tc('PAY-002', 'Payroll Runs', 'PF', 'PF deduction', 'PF enabled employees',
      '1. Run payroll', 'PF 12%', 'PF on payslip', 'High'),
    tc('PAY-003', 'Payroll Runs', 'ESI', 'ESI deduction', 'ESI eligible',
      '1. Run payroll', 'ESI 0.75%', 'ESI deducted', 'Medium'),
    tc('PAY-004', 'Payroll Runs', 'TDS', 'TDS on salary', 'Tax slabs configured',
      '1. Run payroll', 'Annual ₹6L', 'TDS calculated', 'High'),
    tc('PAY-005', 'Payroll Runs', 'Hold', 'Hold employee pay', 'Employee on hold',
      '1. Exclude from run', 'EMP hold', 'Zero payout', 'Medium'),
    tc('PAY-006', 'Payroll Runs', 'Reversal', 'Reverse posted run', 'Posted run',
      '1. Reverse run', 'Jul 2025 posted', 'Reversed; editable', 'Medium'),
    tc('PAY-007', 'Payroll Runs', 'Bank', 'Bank transfer file', 'Run posted',
      '1. Export NEFT', 'HDFC format', 'File generated', 'Medium'),
  ]},
  { hub: 'Payroll & HR', module: 'Payroll Reports', sheet: 'Payroll Reports', cases: reportModule('PRPT', 'Payroll Reports', 'Payslip Register') },
  { hub: 'Inventory', module: 'Stock Activity', sheet: 'Stock Activity', cases: [
    tc('STK-001', 'Stock Activity', 'Receipt', 'Stock receipt', 'Product & WH exist',
      '1. New receipt\n2. Qty 100\n3. Save', `${FG}\n${WH}\n100`, 'Stock increased', 'High'),
    tc('STK-002', 'Stock Activity', 'Issue', 'Stock issue', 'Sufficient stock',
      '1. Issue 20\n2. Save', `${FG} 20`, 'Stock decreased', 'High'),
    tc('STK-003', 'Stock Activity', 'Adjust', 'Stock adjustment', 'Physical count diff',
      '1. Adjustment +5\n2. Reason shrinkage', 'Qty +5', 'Qty corrected', 'High'),
    tc('STK-004', 'Stock Activity', 'Negative', 'Block negative issue', 'Stock 5',
      '1. Issue 10', 'Over issue', 'Error blocked', 'High'),
    tc('STK-005', 'Stock Activity', 'Valuation', 'Weighted avg rate', 'Receipts at rates',
      '1. Check valuation', '₹1000 then ₹1100', 'Avg rate updated', 'Medium'),
    tc('STK-006', 'Stock Activity', 'Filter', 'Filter by product', 'Multiple products',
      '1. Filter FG-WIDGET', FG, 'Only matching rows', 'Low'),
    tc('STK-007', 'Stock Activity', 'Print', 'Print movement register', 'Movements exist',
      '1. Print register', 'Jul 2025', 'Print OK', 'Low', 'Print'),
  ]},
  { hub: 'Inventory', module: 'Transfers', sheet: 'Stock Transfers', cases: [
    tc('XFR-001', 'Stock Transfers', 'Create', 'Inter-warehouse transfer', '2 WH; stock at source',
      '1. New transfer\n2. From Main to FG Store\n3. Qty 50', `${WH} → Finished Goods Store`, 'Transfer doc created', 'High'),
    tc('XFR-002', 'Stock Transfers', 'Post', 'Complete transfer', 'Draft transfer',
      '1. Post transfer', '50 units', 'Source −50; dest +50', 'High'),
    tc('XFR-003', 'Stock Transfers', 'Validation', 'Insufficient stock', 'Source qty 10',
      '1. Transfer 50', 'Over transfer', 'Blocked', 'High'),
    tc('XFR-004', 'Stock Transfers', 'List', 'Transfer history', 'Transfers exist',
      '1. List transfers', FY, 'Grid loads', 'Medium'),
    tc('XFR-005', 'Stock Transfers', 'Cancel', 'Cancel draft', 'Draft only',
      '1. Cancel', 'Draft', 'Removed', 'Medium'),
    tc('XFR-006', 'Stock Transfers', 'Print', 'Print challan', 'Posted',
      '1. Print', 'Transfer challan', 'Doc printed', 'Low', 'Print'),
    tc('XFR-007', 'Stock Transfers', 'Same WH', 'Same location blocked', 'One WH selected twice',
      '1. Same from/to', 'Same WH', 'Validation error', 'Low'),
  ]},
  { hub: 'Inventory', module: 'Stock Levels', sheet: 'Stock Levels', cases: [
    tc('LVL-001', 'Stock Levels', 'View', 'On-hand by product', 'Stock exists',
      '1. Open Stock Levels', FG, 'Qty and WH shown', 'High'),
    tc('LVL-002', 'Stock Levels', 'Reorder', 'Below reorder alert', 'Reorder level 100; stock 80',
      '1. View row', FG, 'Low stock indicator', 'High'),
    tc('LVL-003', 'Stock Levels', 'Filter WH', 'Filter warehouse', 'Multi WH',
      '1. Filter Main Godown', WH, 'Filtered qty', 'Medium'),
    tc('LVL-004', 'Stock Levels', 'Zero', 'Zero stock display', 'No stock product',
      '1. Search zero item', 'NEW-ITEM', 'Qty 0 shown', 'Low'),
    tc('LVL-005', 'Stock Levels', 'Export', 'Export levels', 'Grid loaded',
      '1. Export Excel', 'All products', 'File downloads', 'Medium'),
    tc('LVL-006', 'Stock Levels', 'Refresh', 'Refresh after GRN', 'Note qty',
      '1. Post GRN\n2. Refresh', 'GRN +100', 'Qty updated', 'Medium'),
    tc('LVL-007', 'Stock Levels', 'UOM', 'Display UOM', 'Product with UOM',
      '1. Check UOM column', 'NOS', 'UOM correct', 'Low'),
  ]},
  { hub: 'Finance', module: 'Payments', sheet: 'Payments', cases: [
    tc('PV-001', 'Payments', 'Create', 'Vendor payment voucher', 'Outstanding PI',
      '1. New payment\n2. Select supplier\n3. Allocate PI\n4. Save', `${SUPP}\nPI/25-26/010\n₹59,000`, 'Payment PV/25-26/001 posted', 'High'),
    tc('PV-002', 'Payments', 'Partial', 'Partial payment', 'PI ₹100k open',
      '1. Pay ₹40k', 'Partial', 'Balance remains', 'High'),
    tc('PV-003', 'Payments', 'Mode', 'Cheque payment', 'Bank ledger',
      '1. Mode Cheque\n2. Chq 123456', 'HDFC Current', 'Cheque details saved', 'Medium'),
    tc('PV-004', 'Payments', 'TDS', 'TDS on payment', 'TDS applicable',
      '1. Deduct TDS 2%', 'Section 194C', 'TDS line created', 'High'),
    tc('PV-005', 'Payments', 'Unallocated', 'Advance payment', 'No bill',
      '1. Advance to supplier', '₹10,000 advance', 'On account balance', 'Medium'),
    tc('PV-006', 'Payments', 'Print', 'Print voucher', 'Posted PV',
      '1. Print', 'Payment voucher', 'Print OK', 'Medium', 'Print'),
    tc('PV-007', 'Payments', 'Cancel', 'Cancel unposted', 'Draft PV',
      '1. Delete draft', 'Draft', 'Removed', 'Medium'),
    tc('PV-008', 'Payments', 'FY', 'FY date validation', 'Closed period',
      '1. Date in closed FY', 'Old date', 'Blocked or warning', 'High'),
  ]},
  { hub: 'Finance', module: 'Collections', sheet: 'Collections', cases: [
    tc('RV-001', 'Collections', 'Create', 'Customer receipt', 'Outstanding INV',
      '1. New receipt\n2. Customer\n3. Allocate INV', `${CUST}\nINV/25-26/0042`, 'Receipt posted', 'High'),
    tc('RV-002', 'Collections', 'Partial', 'Partial collection', 'Open INV',
      '1. Collect partial', '50% payment', 'Balance open', 'High'),
    tc('RV-003', 'Collections', 'Mode', 'NEFT receipt', 'Bank ledger',
      '1. Mode NEFT\n2. UTR', 'UTR N123456', 'Bank entry linked', 'Medium'),
    tc('RV-004', 'Collections', 'Advance', 'On-account receipt', 'No INV',
      '1. Advance receipt', '₹25,000', 'Customer credit balance', 'Medium'),
    tc('RV-005', 'Collections', 'Multi INV', 'Allocate multiple invoices', '2 open INVs',
      '1. Allocate both', '2 invoices', 'Both cleared/partial', 'High'),
    tc('RV-006', 'Collections', 'Print', 'Print receipt', 'Posted',
      '1. Print', 'Receipt voucher', 'Print OK', 'Medium', 'Print'),
    tc('RV-007', 'Collections', 'Validation', 'Over-allocation blocked', 'INV ₹10k',
      '1. Allocate ₹15k', 'Over pay', 'Error', 'High'),
  ]},
  { hub: 'Finance', module: 'Debit Notes', sheet: 'Debit Notes', cases: txnModule('DN', 'Debit Notes', 'DN', 'Party', SUPP) },
  { hub: 'Finance', module: 'Credit Notes', sheet: 'Credit Notes', cases: txnModule('CN', 'Credit Notes', 'CN', 'Party', CUST) },
  { hub: 'Finance', module: 'Banking', sheet: 'Banking', cases: [
    tc('BNK-001', 'Banking', 'Deposit', 'Bank deposit entry', 'Cash ledger',
      '1. New deposit\n2. Cash to bank', '₹50,000 to HDFC', 'Bank balance increased', 'High'),
    tc('BNK-002', 'Banking', 'Withdrawal', 'Bank withdrawal', 'Bank balance',
      '1. Withdrawal entry', '₹10,000', 'Bank decreased', 'High'),
    tc('BNK-003', 'Banking', 'Transfer', 'Inter-bank transfer', '2 bank accounts',
      '1. HDFC to ICICI', '₹25,000', 'Both updated', 'Medium'),
    tc('BNK-004', 'Banking', 'Reconcile', 'Statement reconcile', 'Bank stmt imported',
      '1. Match entries', 'Jul stmt', 'Matched items cleared', 'Medium'),
    tc('BNK-005', 'Banking', 'Cheque', 'Cheque bounce', 'Issued cheque',
      '1. Record bounce', 'Chq 123456', 'Reversal entry', 'Medium'),
    tc('BNK-006', 'Banking', 'Print', 'Print bank voucher', 'Posted entry',
      '1. Print', 'Bank voucher', 'Print OK', 'Low', 'Print'),
    tc('BNK-007', 'Banking', 'Validation', 'Insufficient balance', 'Low bank bal',
      '1. Over withdraw', 'Over amount', 'Blocked', 'High'),
  ]},
  { hub: 'Finance', module: 'Cash Management', sheet: 'Petty Cash', cases: [
    tc('PC-001', 'Cash Management', 'Expense', 'Petty cash expense', 'Imprest ₹10k',
      '1. New expense\n2. Category stationery\n3. Save', '₹500 stationery', 'Imprest reduced', 'High'),
    tc('PC-002', 'Cash Management', 'Replenish', 'Replenish imprest', 'Imprest low',
      '1. Replenish from bank', '₹5,000', 'Imprest restored', 'High'),
    tc('PC-003', 'Cash Management', 'Limit', 'Over imprest blocked', 'Imprest ₹500 left',
      '1. Expense ₹2000', 'Over limit', 'Warning/block', 'Medium'),
    tc('PC-004', 'Cash Management', 'Report', 'Petty cash book', 'Entries exist',
      '1. Run petty book', 'Jul 2025', 'Running balance correct', 'Medium'),
    tc('PC-005', 'Cash Management', 'Approval', 'Expense approval', 'Approval workflow',
      '1. Submit for approval', 'Pending', 'Status pending', 'Low'),
    tc('PC-006', 'Cash Management', 'GST', 'GST on expense if applicable', 'GST expense',
      '1. Enter with GST', '18% GST', 'Tax captured', 'Medium'),
    tc('PC-007', 'Cash Management', 'Print', 'Print voucher', 'Posted',
      '1. Print', 'Petty voucher', 'Print OK', 'Low', 'Print'),
  ]},
  { hub: 'Insights', module: 'General Ledger', sheet: 'General Ledger', cases: reportModule('GL', 'General Ledger', 'Account Ledger') },
  { hub: 'Insights', module: 'Low Stock', sheet: 'Low Stock', cases: reportModule('LS', 'Low Stock', 'Reorder Report') },
  { hub: 'Insights', module: 'Profitability', sheet: 'Profitability', cases: reportModule('PA', 'Profitability', 'Profit Analysis') },
  { hub: 'Insights', module: 'Spend Analysis', sheet: 'Spend Analysis', cases: reportModule('SA', 'Spend Analysis', 'Purchase Analysis') },
  { hub: 'Insights', module: 'Sales Performance', sheet: 'Sales Performance', cases: reportModule('SP', 'Sales Performance', 'Sales Analysis') },
  { hub: 'Insights', module: 'Production Metrics', sheet: 'Production Metrics', cases: reportModule('PM', 'Production Metrics', 'Production Report') },
  { hub: 'AR & AP', module: 'Open Balances', sheet: 'Open Balances', cases: reportModule('OB', 'Open Balances', 'Outstanding Report') },
  { hub: 'AR & AP', module: 'Aging Due Date', sheet: 'Aging Due Date', cases: reportModule('AD', 'Aging (Due Date)', 'Due Day Report') },
  { hub: 'AR & AP', module: 'Aging By Value', sheet: 'Aging By Value', cases: reportModule('AV', 'Aging (By Value)', 'Due Amount Report') },
  { hub: 'Inventory Insights', module: 'Opening Inventory', sheet: 'Opening Inventory', cases: reportModule('OS', 'Opening Inventory', 'Opening Stock') },
  { hub: 'Inventory Insights', module: 'Closing Inventory', sheet: 'Closing Inventory', cases: reportModule('CS', 'Closing Inventory', 'Closing Stock') },
  { hub: 'Inventory Insights', module: 'Inventory Summary', sheet: 'Inventory Summary', cases: reportModule('IS', 'Inventory Summary', 'Stock Summary') },
  { hub: 'Financial Reports', module: 'Trial Balance', sheet: 'Trial Balance', cases: reportModule('TB', 'Trial Balance', 'Trial Balance') },
  { hub: 'Financial Reports', module: 'Trading Statement', sheet: 'Trading Statement', cases: reportModule('TA', 'Trading Statement', 'Trading Account') },
  { hub: 'Financial Reports', module: 'Income Statement', sheet: 'Income Statement', cases: reportModule('PL', 'Income Statement', 'P&L') },
  { hub: 'Financial Reports', module: 'Income Stmt Full', sheet: 'Income Stmt Full', cases: reportModule('PLF', 'Income Statement (Full)', 'Combined P&L') },
  { hub: 'Financial Reports', module: 'Balance Sheet', sheet: 'Balance Sheet', cases: reportModule('BS', 'Balance Sheet', 'Balance Sheet') },
  { hub: 'Transaction Reports', module: 'Sales Orders Report', sheet: 'SO Register', cases: reportModule('SOR', 'Sales Orders Report', 'SO Register') },
  { hub: 'Transaction Reports', module: 'Delivery Notes Report', sheet: 'DC Register', cases: reportModule('DCR', 'Delivery Notes Report', 'DC Register') },
  { hub: 'Transaction Reports', module: 'Invoices Report', sheet: 'INV Register', cases: reportModule('SIR', 'Invoices Report', 'Invoice Register') },
  { hub: 'Transaction Reports', module: 'Returns Report', sheet: 'SR Register', cases: reportModule('SRR', 'Returns Report', 'SR Register') },
  { hub: 'Transaction Reports', module: 'PO Report', sheet: 'PO Register', cases: reportModule('POR', 'Purchase Orders Report', 'PO Register') },
  { hub: 'Transaction Reports', module: 'GRN Report', sheet: 'GRN Register', cases: reportModule('GRR', 'Goods Receipt Report', 'GRN Register') },
  { hub: 'Transaction Reports', module: 'Vendor Bills Report', sheet: 'PI Register', cases: reportModule('PIR', 'Vendor Bills Report', 'PI Register') },
  { hub: 'Transaction Reports', module: 'Vendor Returns Report', sheet: 'PR Register', cases: reportModule('PRR', 'Vendor Returns Report', 'PR Register') },
  { hub: 'Master Data', module: 'Product Catalog', sheet: 'Products', cases: masterModule('PROD', 'Product Catalog', 'Product', `${FG} | MRP ₹1,500`) },
  { hub: 'Master Data', module: 'Categories', sheet: 'Categories', cases: masterModule('CAT', 'Categories', 'Category', 'FINISHED GOODS | Active') },
  { hub: 'Master Data', module: 'Product Groups', sheet: 'Product Groups', cases: masterModule('MG', 'Product Groups', 'Main Group', 'ELECTRONICS | Active') },
  { hub: 'Master Data', module: 'Subgroups', sheet: 'Subgroups', cases: masterModule('SG', 'Subgroups', 'Subgroup', 'WIDGETS | Under ELECTRONICS') },
  { hub: 'Master Data', module: 'Assembly Types', sheet: 'Assembly Types', cases: masterModule('AT', 'Assembly Types', 'Assembly Type', 'MAKE-TO-STOCK') },
  { hub: 'Master Data', module: 'Equipment', sheet: 'Equipment', cases: masterModule('MCH', 'Equipment', 'Machine', 'CNC-LINE-1 | Work Center') },
  { hub: 'Master Data', module: 'Locations', sheet: 'Locations', cases: masterModule('LOC', 'Locations', 'Warehouse', `${WH} | MH | Active`) },
  { hub: 'Master Data', module: 'Sales Units', sheet: 'Sales UOM', cases: masterModule('SUOM', 'Sales Units', 'UOM', 'NOS | Numbers') },
  { hub: 'Master Data', module: 'Purchase Units', sheet: 'Purchase UOM', cases: masterModule('PUOM', 'Purchase Units', 'UOM', 'KG | Kilogram') },
  { hub: 'Master Data', module: 'Chart of Accounts', sheet: 'Chart of Accounts', cases: masterModule('COA', 'Chart of Accounts', 'Ledger', 'Sales A/c | 4001 | Income') },
  { hub: 'Master Data', module: 'Suppliers', sheet: 'Suppliers', cases: masterModule('SUP', 'Suppliers', 'Supplier', SUPP) },
  { hub: 'Master Data', module: 'Companies', sheet: 'Companies', cases: masterModule('COM', 'Companies', 'Company', `${CO} | ${GSTIN} | PAN AABCU9603R`) },
  { hub: 'Master Data', module: 'Party Types', sheet: 'Party Types', cases: masterModule('PT', 'Party Types', 'Party Type', 'DEALER | Credit 30 days') },
  { hub: 'User Administration', module: 'Users', sheet: 'Users', cases: [
    tc('USR-001', 'Users', 'Create', 'Create user', 'Admin logged in',
      '1. New user\n2. Assign role\n3. Save', 'user: inventory_mgr / Inv@123', 'User created', 'High'),
    tc('USR-002', 'Users', 'Edit', 'Reset password', 'User exists',
      '1. Reset password', 'New password', 'Login works', 'High'),
    tc('USR-003', 'Users', 'Inactive', 'Deactivate user', 'User not in session',
      '1. Mark inactive', 'inventory_mgr', 'Cannot login', 'High'),
    tc('USR-004', 'Users', 'Tenant', 'Multi-tenant access', 'Tenant B exists',
      '1. Assign tenant', 'Tenant B', 'User sees tenant data only', 'Medium'),
    tc('USR-005', 'Users', 'Validation', 'Duplicate username', 'admin exists',
      '1. Create admin duplicate', 'admin', 'Rejected', 'High'),
    tc('USR-006', 'Users', 'Audit', 'Last login display', 'User logged in before',
      '1. View user list', 'admin', 'Last login shown', 'Low'),
    tc('USR-007', 'Users', 'API', 'API user token if supported', 'API enabled',
      '1. Generate token\n2. Call API', 'Bearer token', 'Authenticated API access', 'Medium', 'API'),
  ]},
  { hub: 'User Administration', module: 'Roles & Permissions', sheet: 'Roles', cases: [
    tc('ROL-001', 'Roles & Permissions', 'Create', 'Create role', 'Admin',
      '1. New role Sales Exec\n2. Save', 'Sales Exec', 'Role created', 'High'),
    tc('ROL-002', 'Roles & Permissions', 'Menu', 'Assign menu permissions', 'Role exists',
      '1. Tick Sales modules only\n2. Save', 'Sales hub tabs', 'Access enforced', 'High'),
    tc('ROL-003', 'Roles & Permissions', 'Admin', 'Administrator full access', 'Admin role',
      '1. Verify all menus', 'Administrator', 'All modules visible', 'High'),
    tc('ROL-004', 'Roles & Permissions', 'Clone', 'Clone role', 'Sales Exec exists',
      '1. Clone to Sales Manager', 'Clone', 'Permissions copied', 'Medium'),
    tc('ROL-005', 'Roles & Permissions', 'Revoke', 'Remove permission', 'Role assigned',
      '1. Untick Finance\n2. Save\n3. Login test user', 'No Finance', 'Finance hidden', 'High'),
    tc('ROL-006', 'Roles & Permissions', 'Delete', 'Delete unused role', 'No users on role',
      '1. Delete role', 'Temp role', 'Deleted', 'Low'),
    tc('ROL-007', 'Roles & Permissions', 'Audit', 'Permission change log', 'Change made',
      '1. Review audit if available', 'Role edit', 'Change traceable', 'Low'),
  ]},
  { hub: 'Platform', module: 'Fiscal Years', sheet: 'Fiscal Years', cases: [
    tc('FY-001', 'Fiscal Years', 'Create', 'Create FY 2025-26', 'Admin',
      '1. New FY\n2. Apr 2025–Mar 2026\n3. Save', 'FY 2025-26', 'FY active', 'High'),
    tc('FY-002', 'Fiscal Years', 'Switch', 'Switch active FY', 'Multiple FY',
      '1. Set active FY', FY, 'Header updates', 'High'),
    tc('FY-003', 'Fiscal Years', 'Close', 'Year-end close', 'FY complete',
      '1. Close FY 2024-25', 'Prior FY', 'Closed; no new txn', 'High'),
    tc('FY-004', 'Fiscal Years', 'Validation', 'Overlap dates blocked', 'FY exists',
      '1. Overlapping FY', 'Same dates', 'Error', 'Medium'),
    tc('FY-005', 'Fiscal Years', 'Opening', 'Opening balances carry', 'New FY',
      '1. Run opening carry', 'BS balances', 'Opening entries created', 'High'),
    tc('FY-006', 'Fiscal Years', 'Period', 'Monthly periods', 'FY created',
      '1. Verify 12 periods', 'Apr–Mar', 'All periods listed', 'Medium'),
    tc('FY-007', 'Fiscal Years', 'Indian', 'Indian FY Apr–Mar default', 'New FY',
      '1. Default dates', 'India', 'Apr 1 start', 'High'),
  ]},
  { hub: 'Platform', module: 'Preferences', sheet: 'Settings', cases: [
    tc('SET-001', 'Preferences', 'Theme', 'Dark/light theme', 'Logged in',
      '1. Toggle theme\n2. Refresh', 'Dark mode', 'Theme persists', 'Low', 'UI'),
    tc('SET-002', 'Preferences', 'Defaults', 'Default warehouse', 'WH exist',
      '1. Set default WH\n2. New SO', WH, 'WH pre-filled', 'Medium'),
    tc('SET-003', 'Preferences', 'Numbering', 'Document series', 'Admin',
      '1. Configure INV prefix\n2. New invoice', 'INV/25-26/', 'Series applied', 'High'),
    tc('SET-004', 'Preferences', 'GST', 'GST registration defaults', 'Company GSTIN',
      '1. Set default GSTIN', GSTIN, 'Pre-filled on docs', 'High'),
    tc('SET-005', 'Preferences', 'Decimal', 'Qty/amount decimals', 'Settings',
      '1. Set 2 decimals\n2. Create invoice', 'Rate 1000.456', 'Rounded per rule', 'Medium'),
    tc('SET-006', 'Preferences', 'Locale', 'Date format DD-MM-YYYY', 'Indian format',
      '1. Set date format\n2. View grids', '15-07-2025', 'Format consistent', 'Medium', 'UI'),
    tc('SET-007', 'Preferences', 'Save', 'Settings persist after logout', 'Changed setting',
      '1. Logout/login', 'Theme', 'Still applied', 'Medium'),
  ]},
  { hub: 'Platform', module: 'Print Templates', sheet: 'Print Templates', cases: [
    tc('PRT-001', 'Print Templates', 'Design', 'Open invoice template', 'Designer access',
      '1. Open Tax Invoice template\n2. Edit header', 'Company logo', 'Saved layout', 'High', 'UI'),
    tc('PRT-002', 'Print Templates', 'GST', 'GST fields on template', 'Template open',
      '1. Add GSTIN, HSN columns', GSTIN, 'Fields on preview', 'High', 'Print'),
    tc('PRT-003', 'Print Templates', 'Assign', 'Assign template to doc type', 'Multiple templates',
      '1. Default for INV', 'Tax Invoice A4', 'Used on print', 'High'),
    tc('PRT-004', 'Print Templates', 'Preview', 'Live preview', 'Sample INV',
      '1. Preview with INV/25-26/0042', 'Sample doc', 'Data binds correctly', 'Medium', 'Print'),
    tc('PRT-005', 'Print Templates', 'Barcode', 'Barcode on DC', 'Barcode enabled',
      '1. Add barcode field', 'Doc no barcode', 'Scannable print', 'Medium', 'Print'),
    tc('PRT-006', 'Print Templates', 'Copy', 'Clone template', 'Existing template',
      '1. Clone\n2. Rename', 'Invoice Copy B', 'New template', 'Low'),
    tc('PRT-007', 'Print Templates', 'Mobile', 'Mobile print view', 'Phone',
      '1. Print from mobile', '375px', 'Readable output', 'Low', 'Mobile'),
  ]},
  { hub: 'Platform', module: 'Report Builder', sheet: 'Report Builder', cases: [
    tc('RB-001', 'Report Builder', 'Create', 'New custom report', 'Canvas access',
      '1. New report\n2. Add table band\n3. Save', 'Sales summary custom', 'Report saved', 'Medium'),
    tc('RB-002', 'Report Builder', 'Field', 'Drag fields to canvas', 'Report open',
      '1. Add party, amount columns', 'Invoice fields', 'Layout updated', 'Medium', 'UI'),
    tc('RB-003', 'Report Builder', 'Run', 'Run custom report', 'Report saved',
      '1. Run with date filter', 'Jul 2025', 'Data renders', 'High'),
    tc('RB-004', 'Report Builder', 'Export', 'Export custom report', 'Report run',
      '1. Export PDF', 'PDF', 'File downloads', 'Medium', 'Print'),
    tc('RB-005', 'Report Builder', 'Share', 'Assign report to menu', 'Admin',
      '1. Publish to Insights', 'Custom tab', 'Visible to permitted roles', 'Low'),
    tc('RB-006', 'Report Builder', 'Validation', 'Save without name blocked', 'New report',
      '1. Save blank name', 'Empty', 'Error', 'Low'),
    tc('RB-007', 'Report Builder', 'Delete', 'Delete draft report', 'Unused report',
      '1. Delete', 'Draft', 'Removed', 'Low'),
  ]},
  { hub: 'Bulk Import', module: 'Import Products', sheet: 'Import Products', cases: [
    tc('IMP-P-001', 'Import Products', 'Template', 'Download template', 'Bulk Import access',
      '1. Download Excel template', 'Product template', 'Template downloaded', 'High'),
    tc('IMP-P-002', 'Import Products', 'Upload', 'Import valid rows', 'Template filled',
      '1. Upload file\n2. Validate\n3. Import', `${FG} row`, 'Products created', 'High'),
    tc('IMP-P-003', 'Import Products', 'Error', 'Invalid HSN rejected', 'Bad HSN',
      '1. Upload invalid HSN', 'HSN abc', 'Row error reported', 'High'),
    tc('IMP-P-004', 'Import Products', 'Duplicate', 'Skip/update duplicate', 'Code exists',
      '1. Import duplicate code', 'FG-WIDGET-001', 'Error or update per option', 'Medium'),
    tc('IMP-P-005', 'Import Products', 'Partial', 'Partial import', 'Mix valid/invalid',
      '1. Import file', '5 valid 2 invalid', 'Valid imported; errors listed', 'Medium'),
    tc('IMP-P-006', 'Import Products', 'GST', 'GST rate column', '18% products',
      '1. Import with GST%', '18', 'Rate saved on product', 'High'),
    tc('IMP-P-007', 'Import Products', 'Log', 'Import log', 'Import done',
      '1. View import log', 'Batch ID', 'Success/fail counts', 'Low'),
  ]},
  { hub: 'Bulk Import', module: 'Import Accounts', sheet: 'Import Accounts', cases: [
    tc('IMP-A-001', 'Import Accounts', 'Customer', 'Import customers', 'Template',
      '1. Upload customers sheet', CUST, 'Customers created', 'High'),
    tc('IMP-A-002', 'Import Accounts', 'Supplier', 'Import suppliers', 'Template',
      '1. Upload suppliers', SUPP, 'Suppliers created', 'High'),
    tc('IMP-A-003', 'Import Accounts', 'GSTIN', 'Validate GSTIN format', 'Invalid GSTIN row',
      '1. Import bad GSTIN', '27INVALID', 'Row rejected', 'High'),
    tc('IMP-A-004', 'Import Accounts', 'State', 'State code for POS', 'MH customer',
      '1. Import with state', 'State: 27', 'POS correct', 'Medium'),
    tc('IMP-A-005', 'Import Accounts', 'Credit', 'Credit limit column', 'Customer import',
      '1. Credit limit 500000', '₹5L limit', 'Saved on party', 'Medium'),
    tc('IMP-A-006', 'Import Accounts', 'Update', 'Update existing party', 'Party exists',
      '1. Import same code new address', 'Updated address', 'Master updated', 'Medium'),
    tc('IMP-A-007', 'Import Accounts', 'API', 'Large batch performance', '1000 rows',
      '1. Import 1000 rows', 'Batch', 'Completes without timeout', 'Low', 'API'),
  ]},
  { hub: 'Bulk Import', module: 'Import Sales Invoices', sheet: 'Import Sales INV', cases: [
    tc('IMP-SI-001', 'Import Sales Invoices', 'Upload', 'Import invoice header+lines', 'Masters exist',
      '1. Upload INV template\n2. Import', 'INV/25-26/IMP001 | 2 lines', 'Invoice created', 'High'),
    tc('IMP-SI-002', 'Import Sales Invoices', 'GST', 'Tax columns imported', 'Intra-state',
      '1. CGST/SGST columns', '9%+9%', 'Tax correct', 'High'),
    tc('IMP-SI-003', 'Import Sales Invoices', 'Link', 'Link customer by code', 'Customer code',
      '1. Customer code REL001', 'REL001', 'Party resolved', 'High'),
    tc('IMP-SI-004', 'Import Sales Invoices', 'Error', 'Missing product code', 'Bad line',
      '1. Unknown SKU', 'BAD-SKU', 'Row error', 'High'),
    tc('IMP-SI-005', 'Import Sales Invoices', 'Date', 'FY date validation', 'FY 2025-26',
      '1. Date outside FY', '01-Apr-2024', 'Rejected', 'Medium'),
    tc('IMP-SI-006', 'Import Sales Invoices', 'Stock', 'Stock impact on import', 'Posted import',
      '1. Import posted invoice', 'Qty 10', 'Stock reduced if configured', 'Medium'),
    tc('IMP-SI-007', 'Import Sales Invoices', 'Print', 'Print imported invoice', 'Imported INV',
      '1. Open and print', 'INV/25-26/IMP001', 'Print OK', 'Low', 'Print'),
  ]},
  { hub: 'Bulk Import', module: 'Import Vendor Bills', sheet: 'Import Vendor Bills', cases: [
    tc('IMP-PI-001', 'Import Vendor Bills', 'Upload', 'Import vendor bill', 'Supplier & RM exist',
      '1. Upload PI template', 'PI/25-26/IMP010 | Tata Steel', 'Bill created', 'High'),
    tc('IMP-PI-002', 'Import Vendor Bills', 'GST', 'Input tax credit lines', '18% RM',
      '1. IGST/CGST columns', RM, 'ITC captured', 'High'),
    tc('IMP-PI-003', 'Import Vendor Bills', 'PO Link', 'Link to PO if column present', 'Open PO',
      '1. PO/25-26/015 ref', 'PO link', 'Linked correctly', 'Medium'),
    tc('IMP-PI-004', 'Import Vendor Bills', 'Duplicate', 'Duplicate bill number', 'PI exists',
      '1. Same vendor bill no', 'Duplicate', 'Rejected', 'High'),
    tc('IMP-PI-005', 'Import Vendor Bills', 'TDS', 'TDS column if applicable', 'TDS vendor',
      '1. TDS 2%', '194C', 'TDS line', 'Medium'),
    tc('IMP-PI-006', 'Import Vendor Bills', 'GRN', 'Three-way match hint', 'GRN posted',
      '1. Import with GRN ref', 'GRN/25-26/008', 'Qty validated', 'Medium'),
    tc('IMP-PI-007', 'Import Vendor Bills', 'Log', 'Import summary', 'Batch import',
      '1. View log', '10 rows', 'Counts displayed', 'Low'),
  ]},
];

function styleHeader(row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
  row.alignment = { vertical: 'middle', wrapText: true };
  row.height = 24;
}

function styleSheet(sheet) {
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  COLS.forEach((_, i) => {
    const col = sheet.getColumn(i + 1);
    col.width = i === 5 || i === 6 || i === 7 ? 42 : i === 3 ? 28 : 18;
    col.alignment = { wrapText: true, vertical: 'top' };
  });
}

async function main() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'IMS Test Case Generator';
  wb.created = new Date();

  let totalCases = 0;
  const indexRows = [['#', 'Hub / Section', 'Module', 'Sheet Name', 'Test Case Count', 'Sample Test Case IDs']];

  const indexSheet = wb.addWorksheet('Index', { views: [{ state: 'frozen', ySplit: 1 }] });
  indexSheet.addRow(['IMS ERP — Module-Wise Test Cases']);
  indexSheet.mergeCells('A1:F1');
  indexSheet.getCell('A1').font = { bold: true, size: 14 };
  indexSheet.addRow([`Generated: ${new Date().toISOString().slice(0, 10)} | FY Context: ${FY} | Production: http://144.91.98.218:8081/`]);
  indexSheet.mergeCells('A2:F2');
  indexSheet.addRow([]);
  indexSheet.addRow(['Hub Count', '15 (+ Login standalone)']);
  indexSheet.addRow(['Module Sheets', String(MODULES.length)]);
  indexSheet.addRow([]);
  const indexHeader = indexSheet.addRow(['#', 'Hub / Section', 'Module', 'Sheet Name', 'Test Case Count', 'Sample Test Case IDs']);
  styleHeader(indexHeader);

  MODULES.forEach((m, idx) => {
    const sheet = wb.addWorksheet(m.sheet.substring(0, 31), { views: [{ state: 'frozen', ySplit: 1 }] });
    const header = sheet.addRow(COLS);
    styleHeader(header);
    m.cases.forEach((c) => sheet.addRow(COLS.map((col) => c[col] ?? '')));
    styleSheet(sheet);
    totalCases += m.cases.length;
    const sampleIds = m.cases.slice(0, 3).map((c) => c['Test Case ID']).join(', ');
    indexSheet.addRow([idx + 1, m.hub, m.module, m.sheet, m.cases.length, sampleIds]);
  });

  indexSheet.getColumn(1).width = 6;
  indexSheet.getColumn(2).width = 22;
  indexSheet.getColumn(3).width = 26;
  indexSheet.getColumn(4).width = 22;
  indexSheet.getColumn(5).width = 16;
  indexSheet.getColumn(6).width = 36;

  const readme = wb.addWorksheet('README');
  readme.addRow(['IMS Test Case Workbook — README']);
  readme.getCell('A1').font = { bold: true, size: 14 };
  [
    '',
    'Purpose: Manual QA test cases for IMS Web ERP (Indian GST context).',
    `Financial Year: ${FY} (01-Apr-2025 to 31-Mar-2026)`,
    `Sample Login: ${ADMIN}`,
    `Sample Company GSTIN: ${GSTIN}`,
    '',
    'Columns: Test Case ID | Module | Feature | Scenario | Preconditions | Steps | Test Data | Expected Result | Priority | Test Type',
    '',
    'Test Types: Functional, UI, Mobile, Print, API',
    'Priority: High (critical path), Medium (important), Low (nice-to-have)',
    '',
    'Regenerate: node ims-web/scripts/generate-test-cases-xlsx.mjs',
    'Source modules: ims-web/src/hub/hubRegistry.ts + navigationCatalog.ts',
  ].forEach((line) => readme.addRow([line]));
  readme.getColumn(1).width = 90;

  await wb.xlsx.writeFile(OUTPUT);

  console.log(JSON.stringify({
    path: OUTPUT,
    sheetCount: wb.worksheets.length,
    moduleSheets: MODULES.length,
    totalTestCases: totalCases,
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
