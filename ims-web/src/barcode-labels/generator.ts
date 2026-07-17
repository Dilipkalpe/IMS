import { getProductByCode } from '../api/products';
import { probeApiHealth } from '../api/client';
import type { PurchaseInvoiceRecord } from '../purchase-invoice/repository/types';
import type {
  BarcodeLabelItem,
  BarcodeLabelPrintOptions,
  BarcodeLabelPrintResult,
} from './types';

function formatMoney(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '';
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseQty(qty: string | number | undefined): number {
  if (qty == null || qty === '') return 1;
  const n = typeof qty === 'number' ? qty : Number(String(qty).replace(/,/g, ''));
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.max(1, Math.ceil(n));
}

function parseDecimal(value: string | number | undefined): number {
  if (value == null || value === '') return 0;
  const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function resolveBarcodeValue(code: string): string {
  return code.trim().toUpperCase();
}

/** WPF: BarcodeLabelGenerator.GenerateFromPurchaseInvoiceAsync */
export async function generateLabelsFromPurchaseInvoice(
  invoice: PurchaseInvoiceRecord,
  options: BarcodeLabelPrintOptions,
): Promise<BarcodeLabelPrintResult> {
  const warnings: string[] = [];
  const labels: BarcodeLabelItem[] = [];
  const productCache = new Map<string, Awaited<ReturnType<typeof getProductByCode>> | null>();
  const docNo = invoice.formattedDocNo || `${invoice.docPrefix}-${invoice.docNo}`;
  const copyMultiplier = Math.max(1, options.copyMultiplier);
  const apiUp = await probeApiHealth();

  for (const line of invoice.lines ?? []) {
    const code = line.productRetailCode?.trim() ?? '';
    if (!code) {
      warnings.push(`Skipped a line with no product code (${line.itemDescription ?? 'line'}).`);
      continue;
    }

    if (!productCache.has(code) && apiUp) {
      try {
        productCache.set(code, await getProductByCode(code));
      } catch {
        productCache.set(code, null);
      }
    }

    const product = productCache.get(code) ?? null;
    const barcodeValue = resolveBarcodeValue(code);
    const missingBarcode = !barcodeValue;

    if (missingBarcode) {
      warnings.push(`Product ${code} has no scannable barcode — using product code on the label.`);
    }

    const labelCount =
      options.quantitySource === 'purchase'
        ? parseQty(line.qty)
        : Math.max(1, options.customQuantityPerLine);
    const totalCount = labelCount * copyMultiplier;

    const salePrice = product?.salePrice ?? 0;
    const mrp = salePrice > 0 ? salePrice : parseDecimal(line.rate);
    const salesRate = parseDecimal(line.salesRate) || salePrice;

    const item: BarcodeLabelItem = {
      productCode: code,
      productName: line.itemDescription?.trim() || product?.name || code,
      barcodeValue: missingBarcode ? code : barcodeValue,
      missingBarcode,
      mrp: formatMoney(mrp),
      salesRate: formatMoney(salesRate),
      purchaseInvoiceNo: docNo,
    };

    for (let i = 0; i < totalCount; i += 1) {
      labels.push({ ...item });
    }
  }

  if (labels.length === 0) {
    warnings.push('No labels were generated — the purchase invoice has no product lines.');
  }

  return { labels, warnings };
}
