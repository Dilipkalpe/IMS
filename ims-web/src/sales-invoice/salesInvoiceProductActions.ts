import { lookupProduct } from '../api/products';
import type { SalesInvoiceLineItem } from './types';
import { resolveForSalesInvoice } from './salesRateResolver';
import {
  addOrIncrementSalesLine,
  addUnknownScanSalesLine,
  createBlankSalesLine,
  interStateFromSalesHeader,
  type GstSalesHeader,
  type SalesProductInfo,
} from '../components/transaction/salesProductLines';

export interface SalesInvoiceProductWorkspaceDeps<
  H extends GstSalesHeader,
  L extends SalesInvoiceLineItem,
  S,
> {
  getDoc: (tabId: string) => { barcode: string; lines: L[]; header: H } | undefined;
  updateDocument: (tabId: string, updater: (doc: S) => S) => void;
  markDirty: (state: S, header: H, lines: L[]) => S;
}

function formatStatusMessage(base: string, warnings: string[]): string {
  if (warnings.length === 0) return base;
  const unique = [...new Set(warnings)];
  return `${unique.join(' ')} · ${base}`;
}

async function resolveLineRate(
  product: SalesProductInfo,
): Promise<{ rate: number; warning: string | null }> {
  const resolution = await resolveForSalesInvoice(product.code, product);
  const rate = resolution.rate > 0 ? resolution.rate : product.rate;
  return { rate, warning: resolution.warningMessage };
}

/** SI-only product scan/browse — applies SalesRateResolver (WPF AddSalesInvoiceProductLineAsync). */
export function createSalesInvoiceProductScanHandlers<
  H extends GstSalesHeader,
  L extends SalesInvoiceLineItem,
  S extends { barcode: string; lines: L[]; header: H; statusMessage?: string | null },
>(deps: SalesInvoiceProductWorkspaceDeps<H, L, S>) {
  const addLineFromScan = async (tabId: string) => {
    const snap = deps.getDoc(tabId);
    if (!snap) return;

    const term = snap.barcode.trim();
    if (!term) return;

    const product = await lookupProduct(term);
    const inter = interStateFromSalesHeader(snap.header);

    if (!product) {
      deps.updateDocument(tabId, (d) => {
        const lines = addUnknownScanSalesLine(
          d.lines,
          term,
          inter,
          createBlankSalesLine as (sr: number) => L,
        );
        const statusMessage = `Added line ${lines.length} (product not found — enter rate manually).`;
        return deps.markDirty({ ...d, barcode: '', statusMessage }, d.header, lines);
      });
      return;
    }

    const { rate, warning } = await resolveLineRate(product);

    deps.updateDocument(tabId, (d) => {
      const lines = addOrIncrementSalesLine(
        d.lines,
        product,
        inter,
        createBlankSalesLine as (sr: number) => L,
        rate,
      );
      const base = `Added ${product.code} — ${product.name}.`;
      const statusMessage = formatStatusMessage(base, warning ? [warning] : []);
      return deps.markDirty({ ...d, barcode: '', statusMessage }, d.header, lines);
    });
  };

  const addProductsFromBrowse = async (tabId: string, products: SalesProductInfo[]) => {
    if (!products.length) return;

    const snap = deps.getDoc(tabId);
    if (!snap) return;

    const inter = interStateFromSalesHeader(snap.header);
    const warnings: string[] = [];

    let lines = snap.lines;
    for (const product of products) {
      const { rate, warning } = await resolveLineRate(product);
      if (warning) warnings.push(warning);
      lines = addOrIncrementSalesLine(
        lines,
        product,
        inter,
        createBlankSalesLine as (sr: number) => L,
        rate,
      );
    }

    deps.updateDocument(tabId, (d) => {
      const base = `Added ${products.length} product(s) from browse.`;
      const statusMessage = formatStatusMessage(base, warnings);
      return deps.markDirty({ ...d, barcode: '', statusMessage }, d.header, lines);
    });
  };

  return { addLineFromScan, addProductsFromBrowse };
}
