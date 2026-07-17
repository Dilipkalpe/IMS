import { Account } from '../models/Account.js';
import { Product } from '../models/Product.js';
import { SalesInvoice } from '../models/SalesInvoice.js';
import { PurchaseInvoice } from '../models/PurchaseInvoice.js';
import { getNextSequence } from '../models/Counter.js';
import { applyDocumentStock } from '../services/productStock.js';
import { normalizeSoPrefix } from '../services/salesOrderNo.js';
import {
  formatPrefixDocNo,
  initialDocNoForDefaultPrefix,
  salesDocCounterKey
} from '../services/numberedSalesDocNo.js';
import {
  purchaseDocCounterKey,
  resolveInitialPurchaseDocNo
} from '../services/numberedPurchaseDocNo.js';
import { buildTemplateWorkbook, cell, parseBool, parseNumber, sheetToRows } from './excelWorkbook.js';

const PRODUCT_TEMPLATE = {
  headers: [
    'Code',
    'Name',
    'Category',
    'Unit',
    'SalePrice',
    'PurchasePrice',
    'ReorderQty',
    'StockQty',
    'HSNCode',
    'ProductType',
    'Active'
  ],
  sample: ['SKU001', 'Sample Product', 'General', 'EA', '100', '80', '10', '0', '1234', 'Finished Good', 'Y']
};

const ACCOUNT_TEMPLATE = {
  headers: [
    'AccountType',
    'Code',
    'Name',
    'ContactPerson',
    'Email',
    'MobileNo',
    'City',
    'State',
    'GSTNo',
    'CreditLimit',
    'CreditDays',
    'Active'
  ],
  sample: ['customer', 'CUST001', 'Sample Customer', 'Contact Name', 'email@example.com', '9876543210', 'Mumbai', 'MH', '27AAAAA0000A1Z5', '50000', '30', 'Y']
};

const SALES_INVOICE_TEMPLATE = {
  headers: [
    'DocPrefix',
    'BillDate',
    'Customer',
    'SalesMan',
    'Narration',
    'ProductCode',
    'ItemDescription',
    'Qty',
    'Rate',
    'DiscPercent',
    'TaxPercent'
  ],
  sample: ['INV', '25/05/2026', 'Walk In', 'Admin', 'Imported invoice', 'PEN', 'Ball Pen Blue', '10', '12.5', '0', '18']
};

const PURCHASE_INVOICE_TEMPLATE = {
  headers: [
    'DocPrefix',
    'BillDate',
    'Supplier',
    'SalesMan',
    'Narration',
    'ProductCode',
    'ItemDescription',
    'Qty',
    'Rate',
    'DiscPercent',
    'TaxPercent'
  ],
  sample: ['PI', '25/05/2026', 'Sample Supplier', 'Admin', 'Imported invoice', 'PEN', 'Ball Pen Blue', '100', '8', '0', '18']
};

export const IMPORT_TYPES = {
  products: {
    label: 'Product',
    templateName: 'IMS_Product_Import_Template.xlsx',
    navigateKey: 'products',
    template: PRODUCT_TEMPLATE
  },
  accounts: {
    label: 'Account',
    templateName: 'IMS_Account_Import_Template.xlsx',
    navigateKey: 'account-ledger',
    template: ACCOUNT_TEMPLATE
  },
  'sales-invoices': {
    label: 'Sales Invoice',
    templateName: 'IMS_Sales_Invoice_Import_Template.xlsx',
    navigateKey: 'sales-invoice',
    template: SALES_INVOICE_TEMPLATE
  },
  'purchase-invoices': {
    label: 'Purchase Invoice',
    templateName: 'IMS_Purchase_Invoice_Import_Template.xlsx',
    navigateKey: 'purchase-invoice',
    template: PURCHASE_INVOICE_TEMPLATE
  }
};

export function getImportType(type) {
  const config = IMPORT_TYPES[type];
  if (!config) return null;
  return config;
}

export function buildImportTemplate(type) {
  const config = getImportType(type);
  if (!config) return null;
  return buildTemplateWorkbook(config.template.headers, config.template.sample, 'Import');
}

function buildLine(sr, row) {
  const qty = parseNumber(cell(row, 'qty'), 0);
  const rate = parseNumber(cell(row, 'rate'), 0);
  const amount = qty * rate;
  return {
    sr,
    productRetailCode: cell(row, 'productcode', 'code'),
    itemDescription: cell(row, 'itemdescription', 'description', 'name'),
    qty: String(qty),
    rate: String(rate),
    discPercent: String(parseNumber(cell(row, 'discpercent'), 0)),
    discValue: '0',
    taxType: 'GST',
    taxPercent: String(parseNumber(cell(row, 'taxpercent'), 18)),
    amount: String(amount)
  };
}

function buildTotals(lines) {
  const gross = lines.reduce((sum, line) => sum + parseNumber(line.amount), 0);
  const totQty = lines.reduce((sum, line) => sum + parseNumber(line.qty), 0);
  const grossText = String(gross);
  return {
    totQty: String(totQty),
    gross: grossText,
    discount: '0',
    spDiscount: '0',
    addOther: '0',
    net: grossText,
    saleAmount: grossText,
    orderAmount: grossText,
    customerReturn: '0',
    receivableToCustomer: grossText,
    supplierReturn: '0',
    payableToSupplier: grossText
  };
}

function groupDocumentRows(rows, partyField) {
  const groups = [];
  let current = null;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const productCode = cell(row, 'productcode', 'code');
    if (!productCode) continue;

    const docPrefix = cell(row, 'docprefix') || (partyField === 'customer' ? 'INV' : 'PI');
    const billDate = cell(row, 'billdate', 'date') || new Date().toLocaleDateString('en-GB');
    const party = cell(row, partyField, 'customer', 'supplier', 'party', 'name');
    const salesMan = cell(row, 'salesman') || 'Import';
    const narration = cell(row, 'narration') || 'Imported from Excel';

    const headerKey = `${docPrefix}|${billDate}|${party}|${salesMan}|${narration}`;
    if (!current || current.headerKey !== headerKey) {
      current = {
        headerKey,
        docPrefix,
        billDate,
        party,
        salesMan,
        narration,
        lines: [],
        excelRow: index + 2
      };
      groups.push(current);
    }
    current.lines.push({ row, excelRow: index + 2 });
  }

  return groups;
}

async function createSalesInvoice(group) {
  const lines = group.lines.map((entry, index) => buildLine(index + 1, entry.row));
  if (lines.length === 0) throw new Error('No line items');

  const docPrefix = normalizeSoPrefix(group.docPrefix || 'INV');
  const defaultDocPrefix = 'INV';
  const legacyInitial = 5500;
  const counterKey = salesDocCounterKey('sales_invoice', docPrefix, defaultDocPrefix);
  const initial = initialDocNoForDefaultPrefix(docPrefix, defaultDocPrefix, legacyInitial);
  const docNo = await getNextSequence(counterKey, initial);

  const payload = {
    docPrefix,
    docNo,
    formattedDocNo: formatPrefixDocNo(docPrefix, docNo),
    billDate: group.billDate,
    customer: group.party || 'Walk In',
    salesMan: group.salesMan,
    narration: group.narration,
    status: 'posted',
    lines,
    totals: buildTotals(lines)
  };

  const item = await SalesInvoice.create(payload);
  await applyDocumentStock(item.lines, 'out');
  return item;
}

async function createPurchaseInvoice(group) {
  const lines = group.lines.map((entry, index) => buildLine(index + 1, entry.row));
  if (lines.length === 0) throw new Error('No line items');

  const docPrefix = normalizeSoPrefix(group.docPrefix || 'PI');
  const defaultDocPrefix = 'PI';
  const legacyInitial = resolveInitialPurchaseDocNo('purchase_invoice');
  const counterKey = purchaseDocCounterKey('purchase_invoice', docPrefix, defaultDocPrefix);
  const initial = initialDocNoForDefaultPrefix(docPrefix, defaultDocPrefix, legacyInitial);
  const docNo = await getNextSequence(counterKey, initial);

  const payload = {
    docPrefix,
    docNo,
    formattedDocNo: formatPrefixDocNo(docPrefix, docNo),
    billDate: group.billDate,
    supplier: group.party || 'Supplier',
    salesMan: group.salesMan,
    narration: group.narration,
    status: 'posted',
    lines,
    totals: buildTotals(lines)
  };

  const item = await PurchaseInvoice.create(payload);
  await applyDocumentStock(item.lines, 'in');
  return item;
}

export async function importProducts(buffer) {
  const rows = sheetToRows(buffer);
  const result = { imported: 0, failed: 0, errors: [], documents: [] };

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const code = cell(row, 'code', 'productcode').toUpperCase();
    const name = cell(row, 'name', 'productname');
    if (!code || !name) continue;

    try {
      const payload = {
        code,
        name,
        category: cell(row, 'category') || 'General',
        unit: cell(row, 'unit', 'uom') || 'EA',
        salePrice: parseNumber(cell(row, 'saleprice'), 0),
        purchasePrice: parseNumber(cell(row, 'purchaseprice'), 0),
        reorderQty: parseNumber(cell(row, 'reorderqty'), 0),
        stockQty: parseNumber(cell(row, 'stockqty'), 0),
        hsnCode: cell(row, 'hsncode', 'hsn'),
        productType: cell(row, 'producttype'),
        activeStatus: parseBool(cell(row, 'active'), true)
      };

      const item = await Product.findOneAndUpdate({ code }, payload, {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      });
      result.imported += 1;
      result.documents.push(item.code);
    } catch (err) {
      result.failed += 1;
      result.errors.push({ row: index + 2, message: err.message || 'Import failed' });
    }
  }

  return result;
}

export async function importAccounts(buffer) {
  const rows = sheetToRows(buffer);
  const result = { imported: 0, failed: 0, errors: [], documents: [] };

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const code = cell(row, 'code', 'accountcode').toUpperCase();
    const name = cell(row, 'name', 'accountname');
    const accountType = cell(row, 'accounttype', 'type').toLowerCase();
    if (!code || !name) continue;

    try {
      if (!['customer', 'supplier'].includes(accountType)) {
        throw new Error('AccountType must be customer or supplier');
      }

      const payload = {
        accountType,
        code,
        name,
        contactPerson: cell(row, 'contactperson'),
        email: cell(row, 'email'),
        mobileNo: cell(row, 'mobileno', 'mobile'),
        city: cell(row, 'city'),
        state: cell(row, 'state'),
        gstNo: cell(row, 'gstno', 'gst'),
        creditLimit: parseNumber(cell(row, 'creditlimit'), 0),
        creditDays: parseNumber(cell(row, 'creditdays'), 0),
        activeStatus: parseBool(cell(row, 'active'), true)
      };

      const item = await Account.findOneAndUpdate({ code }, payload, {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      });
      result.imported += 1;
      result.documents.push(item.code);
    } catch (err) {
      result.failed += 1;
      result.errors.push({ row: index + 2, message: err.message || 'Import failed' });
    }
  }

  return result;
}

export async function importSalesInvoices(buffer) {
  const rows = sheetToRows(buffer);
  const groups = groupDocumentRows(rows, 'customer');
  const result = { imported: 0, failed: 0, errors: [], documents: [] };

  for (const group of groups) {
    try {
      const item = await createSalesInvoice(group);
      result.imported += 1;
      result.documents.push(item.formattedDocNo);
    } catch (err) {
      result.failed += 1;
      result.errors.push({ row: group.excelRow, message: err.message || 'Import failed' });
    }
  }

  return result;
}

export async function importPurchaseInvoices(buffer) {
  const rows = sheetToRows(buffer);
  const groups = groupDocumentRows(rows, 'supplier');
  const result = { imported: 0, failed: 0, errors: [], documents: [] };

  for (const group of groups) {
    try {
      const item = await createPurchaseInvoice(group);
      result.imported += 1;
      result.documents.push(item.formattedDocNo);
    } catch (err) {
      result.failed += 1;
      result.errors.push({ row: group.excelRow, message: err.message || 'Import failed' });
    }
  }

  return result;
}

export async function runImport(type, buffer) {
  switch (type) {
    case 'products':
      return importProducts(buffer);
    case 'accounts':
      return importAccounts(buffer);
    case 'sales-invoices':
      return importSalesInvoices(buffer);
    case 'purchase-invoices':
      return importPurchaseInvoices(buffer);
    default:
      throw new Error('Unknown import type');
  }
}
