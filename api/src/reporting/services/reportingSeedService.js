import * as paperRepo from '../repositories/paperSizeRepository.js';
import * as fieldRepo from '../repositories/fieldRegistryRepository.js';
import { layoutForTransaction } from '../constants/defaultLayouts.js';
import * as reportFormatRepo from '../repositories/reportFormatRepository.js';
import { ReportFormat } from '../models/ReportFormat.js';
import { TRANSACTION_TYPES } from '../constants/transactionTypes.js';

const DEFAULT_TRANSACTION_TYPES = TRANSACTION_TYPES.filter((t) => !t.future).map((t) => t.key);

const PAPER_SIZES = [
  { key: 'A4_PORTRAIT', name: 'A4 Portrait', widthMm: 210, heightMm: 297, orientation: 'portrait', isThermal: false },
  { key: 'A4_LANDSCAPE', name: 'A4 Landscape', widthMm: 297, heightMm: 210, orientation: 'landscape', isThermal: false },
  { key: 'A5_PORTRAIT', name: 'A5 Portrait', widthMm: 148, heightMm: 210, orientation: 'portrait', isThermal: false },
  { key: 'A5_LANDSCAPE', name: 'A5 Landscape', widthMm: 210, heightMm: 148, orientation: 'landscape', isThermal: false },
  { key: 'LETTER', name: 'Letter', widthMm: 216, heightMm: 279, orientation: 'portrait', isThermal: false },
  { key: 'THERMAL_58', name: 'Thermal 58mm', widthMm: 58, heightMm: 297, orientation: 'portrait', isThermal: true },
  { key: 'THERMAL_80', name: 'Thermal 80mm', widthMm: 80, heightMm: 297, orientation: 'portrait', isThermal: true }
];

const CORE_FIELDS = [
  { fieldKey: 'companyName', displayLabel: 'Company Name', token: '{{companyName}}', category: 'company', dataPath: 'company.name', transactionTypes: ['*'] },
  { fieldKey: 'companyAddress', displayLabel: 'Company Address', token: '{{companyAddress}}', category: 'company', dataPath: 'company.address', transactionTypes: ['*'] },
  { fieldKey: 'gstin', displayLabel: 'GSTIN', token: '{{gstin}}', category: 'company', dataPath: 'company.gstin', transactionTypes: ['*'] },
  { fieldKey: 'invoiceNo', displayLabel: 'Document Number', token: '{{invoiceNo}}', category: 'document', dataPath: 'document.formattedDocNo', transactionTypes: ['*'] },
  { fieldKey: 'invoiceDate', displayLabel: 'Document Date', token: '{{invoiceDate}}', category: 'document', dataPath: 'document.billDate', transactionTypes: ['*'] },
  { fieldKey: 'customerName', displayLabel: 'Customer Name', token: '{{customerName}}', category: 'party', dataPath: 'party.name', transactionTypes: ['sales_invoice', 'sales_order', 'sales_return', 'delivery_challan'] },
  { fieldKey: 'supplierName', displayLabel: 'Supplier Name', token: '{{supplierName}}', category: 'party', dataPath: 'party.name', transactionTypes: ['purchase_invoice', 'purchase_order', 'purchase_return', 'grn'] },
  { fieldKey: 'itemTable', displayLabel: 'Item Table', token: '{{itemTable}}', category: 'lines', dataPath: 'lines', controlTypes: ['table'], transactionTypes: ['*'] },
  { fieldKey: 'totalAmount', displayLabel: 'Total Amount', token: '{{totalAmount}}', category: 'tax', dataPath: 'totals.net', transactionTypes: ['*'] },
  { fieldKey: 'taxAmount', displayLabel: 'Tax Amount', token: '{{taxAmount}}', category: 'tax', dataPath: 'totals.tax', transactionTypes: ['*'] },
  { fieldKey: 'grandTotal', displayLabel: 'Grand Total', token: '{{grandTotal}}', category: 'tax', dataPath: 'totals.grandTotal', transactionTypes: ['*'] }
];

export async function seedReportingMasterData() {
  for (const p of PAPER_SIZES) {
    await paperRepo.upsertPaperSize({
      ...p,
      marginsMm: { top: 10, right: 10, bottom: 10, left: 10 },
      isSystem: true,
      isActive: true
    });
  }

  for (const f of CORE_FIELDS) {
    await fieldRepo.upsertFieldRegistry({ ...f, sortOrder: 0, isActive: true, controlTypes: f.controlTypes ?? ['text', 'dynamicText'] });
  }

  const paper = await paperRepo.findPaperSizeByKey('A4_PORTRAIT');
  let formatsCreated = 0;
  for (const tx of DEFAULT_TRANSACTION_TYPES) {
    const existing = await reportFormatRepo.findDefaultReportFormat(tx);
    if (existing) continue;
    formatsCreated += 1;
    await reportFormatRepo.createReportFormat({
      formatCode: `${tx.toUpperCase().replace(/_/g, '-')}-STD`,
      formatName: `Standard ${tx}`,
      transactionType: tx,
      paperSizeKey: 'A4_PORTRAIT',
      orientation: 'portrait',
      isDefault: true,
      isActive: true,
      isSystem: true,
      layoutJson: layoutForTransaction(tx, paper),
      schemaVersion: 2,
      printSettings: { printPreview: true, numberOfCopies: 1, watermark: 'original' }
    });
  }

  return {
    paperSizes: PAPER_SIZES.length,
    fields: CORE_FIELDS.length,
    formatsCreated,
    transactionTypes: DEFAULT_TRANSACTION_TYPES.length
  };
}

/** Refresh layoutJson on all system default formats (professional template + logo). */
export async function applyStandardLayoutsToSystemFormats() {
  const paper = await paperRepo.findPaperSizeByKey('A4_PORTRAIT');
  let updated = 0;
  for (const tx of DEFAULT_TRANSACTION_TYPES) {
    const format = await reportFormatRepo.findDefaultReportFormat(tx);
    if (!format?.isSystem) continue;
    await reportFormatRepo.updateReportFormatById(format._id, {
      layoutJson: layoutForTransaction(tx, paper),
      schemaVersion: 2
    });
    updated += 1;
  }
  return { updated, transactionTypes: DEFAULT_TRANSACTION_TYPES.length };
}

/** Create master data when the database has no active report formats yet. */
export async function ensureReportingDefaults() {
  const activeCount = await ReportFormat.countDocuments({ isActive: true });
  if (activeCount > 0) {
    return { ensured: false, count: activeCount };
  }
  const seed = await seedReportingMasterData();
  const count = await ReportFormat.countDocuments({ isActive: true });
  return { ensured: true, count, ...seed };
}
