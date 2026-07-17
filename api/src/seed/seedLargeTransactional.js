import { DOC_INITIAL } from '../services/docTypeMap.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { DeliveryChallan } from '../models/DeliveryChallan.js';
import { SalesInvoice } from '../models/SalesInvoice.js';
import { SalesReturn } from '../models/SalesReturn.js';
import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { Grn } from '../models/Grn.js';
import { PurchaseInvoice } from '../models/PurchaseInvoice.js';
import { PurchaseReturn } from '../models/PurchaseReturn.js';
import { StockTransfer } from '../models/StockTransfer.js';
import { PaymentVoucher } from '../models/PaymentVoucher.js';
import { ReceiptVoucher } from '../models/ReceiptVoucher.js';
import { CreditNote } from '../models/CreditNote.js';
import { DebitNote } from '../models/DebitNote.js';
import { CashEntry } from '../models/CashEntry.js';
import { BankEntry } from '../models/BankEntry.js';
import { ProductionOrder } from '../models/ProductionOrder.js';
import {
  buildGenerationContext,
  generateSalesSlice,
  generatePurchaseSlice,
  generateSalesReturnsSlice,
  generatePurchaseReturnsSlice,
  generateStockTransfersSlice,
  generateFinanceVouchersSlice
} from './generateTwoMonthData.js';
import { generateProductionOrdersSlice } from './generateManufacturingData.js';
import { insertManyInBatches } from './insertBatches.js';

const GENERATE_CHUNK = Number(process.env.SEED_GENERATE_CHUNK) || 10_000;

async function insertSlice(model, docs, label) {
  if (!docs.length) return;
  await insertManyInBatches(model, docs, { label, batchSize: 5000 });
}

/**
 * Generate and insert transactional data in memory-safe chunks.
 * @param {object} options
 * @param {object[]} options.products
 * @param {number} options.months
 * @param {number} options.recordsPerSection
 * @param {object[]} options.boms
 */
export async function seedTransactionalInChunks(options) {
  const { products, months, recordsPerSection, boms } = options;
  const ctx = buildGenerationContext({ products, months });
  const total = recordsPerSection;

  console.log(`Chunked insert: ${total.toLocaleString()} records/section (chunk size ${GENERATE_CHUNK.toLocaleString()})…`);

  let lastSales = {};
  let lastPurchase = {};
  let lastProductionNo = 0;

  for (let offset = 0; offset < total; offset += GENERATE_CHUNK) {
    const count = Math.min(GENERATE_CHUNK, total - offset);
    const chunkLabel = `${offset.toLocaleString()}–${(offset + count).toLocaleString()}`;

    const sales = generateSalesSlice(count, ctx, offset);
    await insertSlice(SalesOrder, sales.salesOrders, `salesorders ${chunkLabel}`);
    await insertSlice(DeliveryChallan, sales.deliveryChallans, `deliverychallans ${chunkLabel}`);
    await insertSlice(SalesInvoice, sales.salesInvoices, `salesinvoices ${chunkLabel}`);
    lastSales = sales;

    const purchase = generatePurchaseSlice(count, ctx, offset);
    await insertSlice(PurchaseOrder, purchase.purchaseOrders, `purchaseorders ${chunkLabel}`);
    await insertSlice(Grn, purchase.grns, `grns ${chunkLabel}`);
    await insertSlice(PurchaseInvoice, purchase.purchaseInvoices, `purchaseinvoices ${chunkLabel}`);
    lastPurchase = purchase;

    const salesRet = generateSalesReturnsSlice(count, ctx, offset);
    await insertSlice(SalesReturn, salesRet.salesReturns, `salesreturns ${chunkLabel}`);

    const purchaseRet = generatePurchaseReturnsSlice(count, ctx, offset);
    await insertSlice(PurchaseReturn, purchaseRet.purchaseReturns, `purchasereturns ${chunkLabel}`);

    const stockTransfers = generateStockTransfersSlice(count, ctx, offset);
    await insertSlice(StockTransfer, stockTransfers, `stocktransfers ${chunkLabel}`);

    const finance = generateFinanceVouchersSlice(count, ctx, offset);
    await insertSlice(ReceiptVoucher, finance.receiptVouchers, `receiptvouchers ${chunkLabel}`);
    await insertSlice(PaymentVoucher, finance.paymentVouchers, `paymentvouchers ${chunkLabel}`);
    await insertSlice(CreditNote, finance.creditNotes, `creditnotes ${chunkLabel}`);
    await insertSlice(DebitNote, finance.debitNotes, `debitnotes ${chunkLabel}`);
    await insertSlice(CashEntry, finance.cashEntries, `cashentries ${chunkLabel}`);
    await insertSlice(BankEntry, finance.bankEntries, `bankentries ${chunkLabel}`);

    const manufacturing = generateProductionOrdersSlice(count, {
      ...ctx,
      boms,
      randomDateInRange: ctx.randomDateInRange
    }, offset);
    await insertSlice(ProductionOrder, manufacturing.productionOrders, `productionorders ${chunkLabel}`);
    lastProductionNo = manufacturing.productionNo;
  }

  return {
    startDate: ctx.startDate,
    endDate: ctx.endDate,
    recordsPerSection: total,
    counters: {
      'sales_order:SO': Number(lastSales.soNo ?? DOC_INITIAL.sales_order + total),
      'delivery_challan:DC': Number(lastSales.dcNo ?? DOC_INITIAL.delivery_challan + total),
      'sales_invoice:INV': Number(lastSales.invNo ?? DOC_INITIAL.sales_invoice + total),
      'sales_return:SR': DOC_INITIAL.sales_return + total,
      'purchase_order:PO': Number(lastPurchase.poNo ?? DOC_INITIAL.purchase_order + total),
      'grn:GRN': Number(lastPurchase.grnNo ?? DOC_INITIAL.grn + total),
      'purchase_invoice:PI': Number(lastPurchase.piNo ?? DOC_INITIAL.purchase_invoice + total),
      'purchase_return:PR': DOC_INITIAL.purchase_return + total,
      payment_voucher: total,
      receipt_voucher: total,
      credit_note: total,
      debit_note: total,
      cash_entry: total,
      bank_entry: total,
      production_order: lastProductionNo || total
    },
    summary: {
      recordsPerSection: total,
      startDate: ctx.startDate,
      endDate: ctx.endDate,
      salesOrders: total,
      deliveryChallans: total,
      salesInvoices: total,
      salesReturns: total,
      purchaseOrders: total,
      grns: total,
      purchaseInvoices: total,
      purchaseReturns: total,
      stockTransfers: total,
      receiptVouchers: total,
      paymentVouchers: total,
      creditNotes: total,
      debitNotes: total,
      cashEntries: total,
      bankEntries: total,
      productionOrders: total
    }
  };
}
