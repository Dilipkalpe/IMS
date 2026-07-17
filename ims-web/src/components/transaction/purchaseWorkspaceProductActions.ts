import type { SalesInvoiceLineItem } from '../../sales-invoice/types';
import {
  addOrIncrementSalesLine,
  addUnknownScanSalesLine,
  createBlankSalesLine,
  interStateFromSalesHeader,
  type GstSalesHeader,
  type SalesProductInfo,
} from './salesProductLines';
import { lookupPurchaseProduct } from './purchaseProductLines';

export interface PurchaseProductWorkspaceDeps<
  H extends GstSalesHeader,
  L extends SalesInvoiceLineItem,
  S,
> {
  getDoc: (tabId: string) => { barcode: string; lines: L[]; header: H } | undefined;
  updateDocument: (tabId: string, updater: (doc: S) => S) => void;
  markDirty: (state: S, header: H, lines: L[]) => S;
}

export function createPurchaseProductScanHandlers<
  H extends GstSalesHeader,
  L extends SalesInvoiceLineItem,
  S extends { barcode: string; lines: L[]; header: H; statusMessage?: string | null },
>(deps: PurchaseProductWorkspaceDeps<H, L, S>) {
  const addLineFromScan = async (tabId: string) => {
    const snap = deps.getDoc(tabId);
    if (!snap) return;

    const term = snap.barcode.trim();
    if (!term) return;

    const product = await lookupPurchaseProduct(term);
    const inter = interStateFromSalesHeader(snap.header);

    deps.updateDocument(tabId, (d) => {
      const lines = product
        ? addOrIncrementSalesLine(d.lines, product, inter, createBlankSalesLine as (sr: number) => L)
        : addUnknownScanSalesLine(d.lines, term, inter, createBlankSalesLine as (sr: number) => L);

      const statusMessage = product
        ? `Added ${product.code} — ${product.name}.`
        : `Added line ${lines.length} (product not found — enter rate manually).`;

      return deps.markDirty({ ...d, barcode: '', statusMessage }, d.header, lines);
    });
  };

  const addProductsFromBrowse = (tabId: string, products: SalesProductInfo[]) => {
    if (!products.length) return;

    const snap = deps.getDoc(tabId);
    if (!snap) return;

    const inter = interStateFromSalesHeader(snap.header);

    deps.updateDocument(tabId, (d) => {
      let lines = d.lines;
      for (const raw of products) {
        const product = lookupPurchaseProductFromBrowse(raw);
        lines = addOrIncrementSalesLine(lines, product, inter, createBlankSalesLine as (sr: number) => L);
      }

      return deps.markDirty(
        {
          ...d,
          barcode: '',
          statusMessage: `Added ${products.length} product(s) from browse.`,
        },
        d.header,
        lines,
      );
    });
  };

  return { addLineFromScan, addProductsFromBrowse };
}

function lookupPurchaseProductFromBrowse(product: SalesProductInfo): SalesProductInfo {
  const purchaseRate = product.purchasePrice ?? 0;
  const rate = purchaseRate > 0 ? purchaseRate : product.rate;
  return { ...product, rate };
}
