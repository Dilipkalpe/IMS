import { DOC_INITIAL } from '../services/docTypeMap.js';
import { BUYERS, SALESMEN, accounts } from './mastersData.js';
import { generateBoms, generateProductionOrders } from './generateManufacturingData.js';

const DEFAULT_RECORDS_PER_SECTION = 10_000;

/** @param {number} seed */
function createRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function randomDateInRange(rng, startDate, endDate) {
  const start = startDate.getTime();
  const end = endDate.getTime();
  return new Date(start + Math.floor(rng() * (end - start + 1)));
}

function formatBillDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

function buildSalesLine(sr, product, qty) {
  const rate = product.salePrice ?? product.purchasePrice ?? 100;
  const taxPercent = Number(product.taxPercent) || 18;
  const taxable = qty * rate;
  const tax = roundMoney((taxable * taxPercent) / 100);
  const amount = roundMoney(taxable + tax);
  return {
    sr,
    productRetailCode: product.code,
    itemDescription: product.name,
    qty: String(qty),
    rate: rate.toFixed(2),
    discPercent: '0',
    discValue: '0.00',
    taxType: 'GST',
    taxPercent: String(taxPercent),
    amount: amount.toFixed(2)
  };
}

function buildPurchaseLine(sr, product, qty) {
  const rate = product.purchasePrice ?? product.salePrice ?? 80;
  const taxPercent = Number(product.taxPercent) || 18;
  const taxable = qty * rate;
  const tax = roundMoney((taxable * taxPercent) / 100);
  const amount = roundMoney(taxable + tax);
  return {
    sr,
    productRetailCode: product.code,
    itemDescription: product.name,
    qty: String(qty),
    rate: rate.toFixed(2),
    discPercent: '0',
    discValue: '0.00',
    taxType: 'GST',
    taxPercent: String(taxPercent),
    amount: amount.toFixed(2)
  };
}

function salesTotalsFromLines(lines) {
  const net = roundMoney(lines.reduce((s, l) => s + Number(l.amount), 0));
  const totQty = roundMoney(lines.reduce((s, l) => s + Number(l.qty), 0));
  return {
    totQty: String(totQty),
    gross: net.toFixed(2),
    discount: '0.00',
    spDiscount: '0.00',
    addOther: '0.00',
    net: net.toFixed(2),
    saleAmount: net.toFixed(2),
    orderAmount: net.toFixed(2),
    customerReturn: '0.00',
    receivableToCustomer: net.toFixed(2)
  };
}

function purchaseTotalsFromLines(lines) {
  const net = roundMoney(lines.reduce((s, l) => s + Number(l.amount), 0));
  const totQty = roundMoney(lines.reduce((s, l) => s + Number(l.qty), 0));
  return {
    totQty: String(totQty),
    gross: net.toFixed(2),
    discount: '0.00',
    spDiscount: '0.00',
    addOther: '0.00',
    net: net.toFixed(2),
    orderAmount: net.toFixed(2),
    saleAmount: net.toFixed(2),
    supplierReturn: '0.00',
    payableToSupplier: net.toFixed(2)
  };
}

function paymentProfile(rng, net, invoiceDate, creditDays, today) {
  const roll = rng();
  let paidAmount = 0;
  let status = 'posted';
  let paymentType = 'credit';

  if (roll < 0.42) {
    paidAmount = net;
    status = 'paid';
    paymentType = roll < 0.15 ? 'cash' : 'credit';
  } else if (roll < 0.72) {
    paidAmount = roundMoney(net * (0.3 + rng() * 0.5));
    paymentType = 'partial';
  }

  const dueDate = addDays(invoiceDate, creditDays);
  const balanceDue = roundMoney(Math.max(0, net - paidAmount));
  if (balanceDue > 0 && dueDate < today && roll > 0.5) {
    status = 'posted';
  }

  return { billAmount: net, paidAmount, balanceDue, status, paymentType, dueDate };
}

function generateSalesChain(count, ctx, offset = 0) {
  const { rng, products, customers, startDate, endDate, today } = ctx;
  const salesOrders = [];
  const deliveryChallans = [];
  const salesInvoices = [];
  let soNo = DOC_INITIAL.sales_order + offset;
  let dcNo = DOC_INITIAL.delivery_challan + offset;
  let invNo = DOC_INITIAL.sales_invoice + offset;

  for (let i = 0; i < count; i += 1) {
    const idx = offset + i;
    const docDate = randomDateInRange(rng, startDate, endDate);
    const customer = customers[idx % customers.length];
    const product = products[idx % products.length];
    const salesMan = SALESMEN[idx % SALESMEN.length];
    const qty = 1 + (idx % 12);
    const lines = [buildSalesLine(1, product, qty)];
    const totals = salesTotalsFromLines(lines);

    soNo += 1;
    const soFormatted = `SO-${soNo}`;
    const soStatus = idx % 25 === 0 ? 'open' : idx % 17 === 0 ? 'confirmed' : 'closed';

    salesOrders.push({
      soPrefix: 'SO',
      docNo: soNo,
      formattedDocNo: soFormatted,
      soDate: docDate,
      billDate: formatBillDate(docDate),
      salesMan,
      customer: customer.name,
      paymentTerms: 'Net 30',
      deliveryPriority: idx % 10 === 0 ? 'Urgent' : 'Normal',
      billingAddress: `${customer.name}, Pune`,
      shippingAddress: 'Main Godown, Pune',
      narration: `Sales order ${soFormatted}`,
      status: soStatus,
      lines,
      totals
    });

    dcNo += 1;
    const dcFormatted = `DC-${dcNo}`;
    const dcDate = addDays(docDate, 1);
    deliveryChallans.push({
      docPrefix: 'DC',
      docNo: dcNo,
      formattedDocNo: dcFormatted,
      dcDate,
      billDate: formatBillDate(dcDate),
      soReference: soFormatted,
      warehouse: idx % 2 === 0 ? 'Main Godown' : 'Godown B',
      vehicleNo: `MH-12-${String(1000 + (dcNo % 9000)).slice(-4)}`,
      transporter: 'FastMove Logistics',
      customer: customer.name,
      salesMan,
      status: idx % 20 === 0 ? 'open' : 'dispatched',
      lines,
      totals
    });

    invNo += 1;
    const invDate = addDays(docDate, 2);
    const net = Number(totals.net);
    const payment = paymentProfile(rng, net, invDate, customer.creditDays ?? 30, today);
    const invFormatted = `INV-${invNo}`;

    salesInvoices.push({
      docPrefix: 'INV',
      docNo: invNo,
      formattedDocNo: invFormatted,
      invoiceDate: invDate,
      billDate: formatBillDate(invDate),
      dcReference: dcFormatted,
      gstin: '27AABCU9603R1ZM',
      placeOfSupply: 'Maharashtra',
      dueDate: payment.dueDate,
      customer: customer.name,
      salesMan,
      status: payment.status,
      paymentType: payment.paymentType,
      paymentMode: payment.paidAmount > 0 ? (idx % 2 === 0 ? 'bank' : 'cash') : '',
      billAmount: payment.billAmount,
      paidAmount: payment.paidAmount,
      balanceDue: payment.balanceDue,
      paymentLinks: [],
      lines,
      totals: { ...totals, receivableToCustomer: payment.balanceDue.toFixed(2) }
    });
  }

  return { salesOrders, deliveryChallans, salesInvoices, soNo, dcNo, invNo };
}

function generatePurchaseChain(count, ctx, offset = 0) {
  const { rng, products, suppliers, startDate, endDate, today } = ctx;
  const purchaseOrders = [];
  const grns = [];
  const purchaseInvoices = [];
  let poNo = DOC_INITIAL.purchase_order + offset;
  let grnNo = DOC_INITIAL.grn + offset;
  let piNo = DOC_INITIAL.purchase_invoice + offset;

  for (let i = 0; i < count; i += 1) {
    const idx = offset + i;
    const docDate = randomDateInRange(rng, startDate, endDate);
    const supplier = suppliers[idx % suppliers.length];
    const product = products[(idx + 3) % products.length];
    const buyer = BUYERS[idx % BUYERS.length];
    const qty = 5 + (idx % 20);
    const lines = [buildPurchaseLine(1, product, qty)];
    const totals = purchaseTotalsFromLines(lines);

    poNo += 1;
    const poFormatted = `PO-${poNo}`;
    purchaseOrders.push({
      docPrefix: 'PO',
      docNo: poNo,
      formattedDocNo: poFormatted,
      poDate: docDate,
      billDate: formatBillDate(docDate),
      supplier: supplier.name,
      buyer,
      paymentTerms: 'Net 30',
      deliveryPriority: 'Normal',
      billingAddress: `${supplier.name}, Mumbai`,
      shipToAddress: 'Main Godown, Pune',
      narration: `Purchase order ${poFormatted}`,
      status: idx % 18 === 0 ? 'open' : 'confirmed',
      lines,
      totals
    });

    grnNo += 1;
    const grnFormatted = `GRN-${grnNo}`;
    const grnDate = addDays(docDate, 1);
    grns.push({
      docPrefix: 'GRN',
      docNo: grnNo,
      formattedDocNo: grnFormatted,
      grnDate,
      billDate: formatBillDate(grnDate),
      poReference: poFormatted,
      warehouse: 'Main Godown',
      supplier: supplier.name,
      buyer,
      status: 'received',
      lines,
      totals
    });

    piNo += 1;
    const piDate = addDays(docDate, 3);
    const net = Number(totals.net);
    const payment = paymentProfile(rng, net, piDate, supplier.creditDays ?? 30, today);
    const piFormatted = `PI-${piNo}`;

    purchaseInvoices.push({
      docPrefix: 'PI',
      docNo: piNo,
      formattedDocNo: piFormatted,
      invoiceDate: piDate,
      billDate: formatBillDate(piDate),
      grnReference: grnFormatted,
      gstin: '27AABCW1234F1Z5',
      placeOfSupply: 'Maharashtra',
      dueDate: payment.dueDate,
      supplier: supplier.name,
      buyer,
      status: payment.status,
      paymentType: payment.paymentType,
      billAmount: payment.billAmount,
      paidAmount: payment.paidAmount,
      balanceDue: payment.balanceDue,
      paymentLinks: [],
      lines,
      totals: { ...totals, payableToSupplier: payment.balanceDue.toFixed(2) }
    });
  }

  return { purchaseOrders, grns, purchaseInvoices, poNo, grnNo, piNo };
}

function generateSalesReturns(count, ctx, offset = 0) {
  const { rng, products, customers, startDate, endDate } = ctx;
  const salesReturns = [];
  let srNo = DOC_INITIAL.sales_return + offset;

  for (let i = 0; i < count; i += 1) {
    const idx = offset + i;
    const customer = customers[idx % customers.length];
    const product = products[idx % products.length];
    const invNo = DOC_INITIAL.sales_invoice + idx + 1;
    const lines = [buildSalesLine(1, product, 1 + (idx % 3))];
    const totals = salesTotalsFromLines(lines);
    srNo += 1;
    const returnDate = randomDateInRange(rng, startDate, endDate);

    salesReturns.push({
      docPrefix: 'SR',
      docNo: srNo,
      formattedDocNo: `SR-${srNo}`,
      returnDate,
      billDate: formatBillDate(returnDate),
      invoiceReference: `INV-${invNo}`,
      returnReason: 'Damaged goods',
      qcRemark: 'Inspected',
      returnWarehouse: 'Main Godown',
      customer: customer.name,
      salesMan: SALESMEN[idx % SALESMEN.length],
      status: idx % 3 === 0 ? 'open' : 'posted',
      lines,
      totals
    });
  }

  return { salesReturns, srNo };
}

function generatePurchaseReturns(count, ctx, offset = 0) {
  const { rng, products, suppliers, startDate, endDate } = ctx;
  const purchaseReturns = [];
  let prNo = DOC_INITIAL.purchase_return + offset;

  for (let i = 0; i < count; i += 1) {
    const idx = offset + i;
    const supplier = suppliers[idx % suppliers.length];
    const product = products[(idx + 2) % products.length];
    const piNo = DOC_INITIAL.purchase_invoice + idx + 1;
    const lines = [buildPurchaseLine(1, product, 2)];
    const totals = purchaseTotalsFromLines(lines);
    prNo += 1;
    const returnDate = randomDateInRange(rng, startDate, endDate);

    purchaseReturns.push({
      docPrefix: 'PR',
      docNo: prNo,
      formattedDocNo: `PR-${prNo}`,
      returnDate,
      billDate: formatBillDate(returnDate),
      invoiceReference: `PI-${piNo}`,
      returnReason: 'Short supply',
      returnWarehouse: 'Main Godown',
      supplier: supplier.name,
      buyer: BUYERS[idx % BUYERS.length],
      status: 'posted',
      lines,
      totals
    });
  }

  return { purchaseReturns, prNo };
}

function generateStockTransfers(count, ctx, offset = 0) {
  const { rng, products, startDate, endDate } = ctx;
  const stockTransfers = [];

  for (let i = 0; i < count; i += 1) {
    const idx = offset + i;
    const p = products[idx % products.length];
    const tDate = randomDateInRange(rng, startDate, endDate);
    stockTransfers.push({
      entryNo: `ST-${String(idx + 1).padStart(6, '0')}`,
      fromGodown: idx % 2 === 0 ? 'Main Godown' : 'Godown B',
      toGodown: idx % 2 === 0 ? 'Counter' : 'Main Godown',
      transferDate: tDate,
      remark: 'Inter-godown movement',
      status: 'posted',
      lines: [
        {
          srNo: 1,
          productCode: p.code,
          productName: p.name,
          brandName: p.brand ?? '',
          qty: String(5 + (idx % 15)),
          unit: p.unit
        }
      ]
    });
  }

  return stockTransfers;
}

function generateFinanceVouchers(count, ctx, offset = 0) {
  const { rng, customers, suppliers, startDate, endDate } = ctx;
  const receiptVouchers = [];
  const paymentVouchers = [];
  const creditNotes = [];
  const debitNotes = [];
  const cashEntries = [];
  const bankEntries = [];

  for (let i = 0; i < count; i += 1) {
    const idx = offset + i;
    const vDate = randomDateInRange(rng, startDate, endDate);
    const customer = customers[idx % customers.length];
    const supplier = suppliers[idx % suppliers.length];
    const voucherNo = idx + 1;

    receiptVouchers.push({
      voucherType: 'receipt',
      voucherNo,
      refNo: String(voucherNo),
      voucherDate: vDate,
      cashBank: i % 3 === 0 ? 'CASH' : 'BANK',
      accountCode: customer.code,
      accountName: customer.name,
      amount: roundMoney(500 + (idx % 500) * 47.5),
      narration: `Receipt batch ${voucherNo}`,
      status: 'Posted'
    });

    paymentVouchers.push({
      voucherType: 'payment',
      voucherNo,
      refNo: String(voucherNo),
      voucherDate: vDate,
      cashBank: idx % 4 === 0 ? 'CASH' : 'BANK',
      accountCode: supplier.code,
      accountName: supplier.name,
      amount: roundMoney(800 + (idx % 400) * 52.25),
      narration: `Payment batch ${voucherNo}`,
      status: 'Posted'
    });

    const cnAmount = roundMoney(1000 + (idx % 200) * 25);
    creditNotes.push({
      voucherType: 'credit_note',
      voucherNo,
      refNo: `CN-${voucherNo}`,
      voucherDate: vDate,
      accountCode: customer.code,
      accountName: customer.name,
      amount: cnAmount,
      gstRate: 18,
      totalAmount: roundMoney(cnAmount * 1.18),
      isIgst: idx % 5 === 0,
      narration: 'Sales adjustment',
      status: 'Posted'
    });

    const dnAmount = roundMoney(900 + (idx % 180) * 22);
    debitNotes.push({
      voucherType: 'debit_note',
      voucherNo,
      refNo: `DN-${voucherNo}`,
      voucherDate: vDate,
      accountCode: supplier.code,
      accountName: supplier.name,
      amount: dnAmount,
      gstRate: 18,
      totalAmount: roundMoney(dnAmount * 1.18),
      isIgst: idx % 6 === 0,
      narration: 'Purchase adjustment',
      status: 'Posted'
    });

    const cash1 = roundMoney(200 + (idx % 50) * 12);
    const cash2 = roundMoney(80 + (idx % 30) * 8);
    cashEntries.push({
      entryType: 'cash_entry',
      entryNo: voucherNo,
      entryDate: vDate,
      lines: [
        { srNo: 1, particular: 'Office expense', amount: cash1 },
        { srNo: 2, particular: 'Courier', amount: cash2 }
      ],
      totalAmount: roundMoney(cash1 + cash2),
      status: 'Posted'
    });

    bankEntries.push({
      voucherType: 'bank_entry',
      voucherNo,
      refNo: `BE-${voucherNo}`,
      voucherDate: vDate,
      cashBank: idx % 2 === 0 ? 'DEPOSIT' : 'WITHDRAWAL',
      accountCode: customer.code,
      accountName: customer.name,
      amount: roundMoney(5000 + (idx % 300) * 125.5),
      narration: 'Bank entry',
      status: 'Posted'
    });
  }

  return {
    receiptVouchers,
    paymentVouchers,
    creditNotes,
    debitNotes,
    cashEntries,
    bankEntries
  };
}

export function buildGenerationContext(options = {}) {
  const endDate = options.endDate ?? new Date();
  const months = options.months ?? 2;
  const products = options.products ?? [];
  const startDate = addDays(endDate, -(months * 30));
  const customers = accounts.filter((a) => a.accountType === 'customer');
  const suppliers = accounts.filter((a) => a.accountType === 'supplier');
  const rng = createRng(20260529);
  const today = new Date(endDate);
  today.setHours(23, 59, 59, 999);

  return {
    rng,
    products,
    customers,
    suppliers,
    startDate,
    endDate,
    today,
    months,
    randomDateInRange
  };
}

export const generateSalesSlice = generateSalesChain;
export const generatePurchaseSlice = generatePurchaseChain;
export const generateSalesReturnsSlice = generateSalesReturns;
export const generatePurchaseReturnsSlice = generatePurchaseReturns;
export const generateStockTransfersSlice = generateStockTransfers;
export const generateFinanceVouchersSlice = generateFinanceVouchers;

/**
 * Generates linked sample data spread across the last N months.
 * @param {{ products: object[], endDate?: Date, months?: number, recordsPerSection?: number }} options
 */
export function generateTwoMonthSampleData(options = {}) {
  const endDate = options.endDate ?? new Date();
  const months = options.months ?? 2;
  const recordsPerSection =
    options.recordsPerSection ??
    (Number(process.env.SEED_RECORDS_PER_SECTION) || DEFAULT_RECORDS_PER_SECTION);

  const ctx = buildGenerationContext({ ...options, endDate, months });

  const sales = generateSalesChain(recordsPerSection, ctx);
  const purchase = generatePurchaseChain(recordsPerSection, ctx);
  const salesRet = generateSalesReturns(recordsPerSection, ctx);
  const purchaseRet = generatePurchaseReturns(recordsPerSection, ctx);
  const stockTransfers = generateStockTransfers(recordsPerSection, ctx);
  const finance = generateFinanceVouchers(recordsPerSection, ctx);
  const boms = generateBoms(ctx.products);
  const manufacturing = generateProductionOrders(recordsPerSection, ctx, 0, boms);

  return {
    salesOrders: sales.salesOrders,
    deliveryChallans: sales.deliveryChallans,
    salesInvoices: sales.salesInvoices,
    salesReturns: salesRet.salesReturns,
    purchaseOrders: purchase.purchaseOrders,
    grns: purchase.grns,
    purchaseInvoices: purchase.purchaseInvoices,
    purchaseReturns: purchaseRet.purchaseReturns,
    stockTransfers,
    receiptVouchers: finance.receiptVouchers,
    paymentVouchers: finance.paymentVouchers,
    creditNotes: finance.creditNotes,
    debitNotes: finance.debitNotes,
    cashEntries: finance.cashEntries,
    bankEntries: finance.bankEntries,
    boms,
    productionOrders: manufacturing.productionOrders,
    counters: {
      'sales_order:SO': sales.soNo,
      'delivery_challan:DC': sales.dcNo,
      'sales_invoice:INV': sales.invNo,
      'sales_return:SR': salesRet.srNo,
      'purchase_order:PO': purchase.poNo,
      'grn:GRN': purchase.grnNo,
      'purchase_invoice:PI': purchase.piNo,
      'purchase_return:PR': purchaseRet.prNo,
      payment_voucher: recordsPerSection,
      receipt_voucher: recordsPerSection,
      credit_note: recordsPerSection,
      debit_note: recordsPerSection,
      cash_entry: recordsPerSection,
      bank_entry: recordsPerSection,
      production_order: manufacturing.productionNo
    },
    summary: {
      recordsPerSection,
      startDate: ctx.startDate,
      endDate: ctx.endDate,
      salesOrders: sales.salesOrders.length,
      deliveryChallans: sales.deliveryChallans.length,
      salesInvoices: sales.salesInvoices.length,
      salesReturns: salesRet.salesReturns.length,
      purchaseOrders: purchase.purchaseOrders.length,
      grns: purchase.grns.length,
      purchaseInvoices: purchase.purchaseInvoices.length,
      purchaseReturns: purchaseRet.purchaseReturns.length,
      stockTransfers: stockTransfers.length,
      receiptVouchers: finance.receiptVouchers.length,
      paymentVouchers: finance.paymentVouchers.length,
      creditNotes: finance.creditNotes.length,
      debitNotes: finance.debitNotes.length,
      cashEntries: finance.cashEntries.length,
      bankEntries: finance.bankEntries.length,
      boms: boms.length,
      productionOrders: manufacturing.productionOrders.length
    }
  };
}
