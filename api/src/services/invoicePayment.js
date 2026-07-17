export function parseMoney(value) {

  const n = Number.parseFloat(String(value ?? '0').replace(/,/g, ''));

  return Number.isFinite(n) ? n : 0;

}



export function normalizeInvoicePaymentFields(payload) {

  const net = parseMoney(payload?.totals?.net ?? payload?.totals?.saleAmount ?? payload?.billAmount);

  payload.billAmount = net;



  const type = String(payload?.paymentType ?? 'credit').toLowerCase();

  let paid = parseMoney(payload?.paidAmount);



  if (type === 'cash') {

    paid = net;

  }



  paid = Math.min(Math.max(0, paid), net);

  const balance = Math.max(0, net - paid);



  payload.paidAmount = paid;

  payload.balanceDue = balance;



  if (net > 0 && balance <= 0.001) {

    payload.status = 'paid';

  } else if (paid > 0 && payload.status === 'paid') {

    payload.status = 'open';

  }

}



function resolveInvoiceFilter(allocation) {

  const formatted = String(allocation?.sourceFormattedDocNo ?? '').trim();

  const id = String(allocation?.sourceDocId ?? '').trim();

  if (!formatted && !id) return null;

  return id ? { _id: id } : { formattedDocNo: formatted };

}



function voucherLinkKey(voucher) {

  return {

    voucherType: String(voucher?.voucherType ?? 'payment').trim().toLowerCase(),

    voucherNo: Number(voucher?.voucherNo ?? 0),

  };

}



function matchesVoucherLink(link, voucher) {

  const key = voucherLinkKey(voucher);

  return (

    Number(link?.voucherNo ?? 0) === key.voucherNo &&

    String(link?.voucherType ?? 'payment').trim().toLowerCase() === key.voucherType

  );

}



export function validatePaymentAllocations(voucherAmount, allocations) {

  const amount = parseMoney(voucherAmount);

  const rows = Array.isArray(allocations) ? allocations : [];

  let total = 0;



  for (const row of rows) {

    const alloc = parseMoney(row?.amount);

    if (alloc < 0) {

      const err = new Error('Allocation amounts cannot be negative.');

      err.status = 400;

      throw err;

    }

    if (alloc <= 0) continue;

    total += alloc;

  }



  if (total > amount + 0.001) {

    const err = new Error(`Total allocation (${total.toFixed(2)}) exceeds voucher amount (${amount.toFixed(2)}).`);

    err.status = 400;

    throw err;

  }



  return { totalAllocated: total, unallocated: Math.max(0, amount - total) };

}



export async function assertAllocationsWithinOutstanding(Model, allocations, voucher, options = {}) {

  const voucherNo = Number(voucher?.voucherNo ?? 0);

  const rows = Array.isArray(allocations) ? allocations : [];



  for (const row of rows) {

    const alloc = parseMoney(row?.amount);

    if (alloc <= 0) continue;



    const filter = resolveInvoiceFilter(row);

    if (!filter) continue;



    const invoice = await Model.findOne(filter);

    if (!invoice) {

      const err = new Error(`Invoice not found: ${row?.sourceFormattedDocNo || row?.sourceDocId || 'unknown'}.`);

      err.status = 404;

      throw err;

    }



    const bill = parseMoney(invoice.billAmount ?? invoice.totals?.net ?? invoice.totals?.saleAmount);

    const outstanding = parseMoney(invoice.balanceDue);

    const fromThisVoucher = (Array.isArray(invoice.paymentLinks) ? invoice.paymentLinks : [])

      .filter((link) => matchesVoucherLink(link, voucher))

      .reduce((sum, link) => sum + parseMoney(link.amount), 0);



    const maxAllowed = outstanding + (options?.editing ? fromThisVoucher : 0);

    if (alloc > maxAllowed + 0.001) {

      const label = invoice.formattedDocNo || row?.sourceFormattedDocNo || 'invoice';

      const err = new Error(

        `Allocation ${alloc.toFixed(2)} for ${label} exceeds outstanding balance (${maxAllowed.toFixed(2)}).`,

      );

      err.status = 400;

      throw err;

    }



    if (alloc > bill + 0.001) {

      const label = invoice.formattedDocNo || row?.sourceFormattedDocNo || 'invoice';

      const err = new Error(`Allocation ${alloc.toFixed(2)} for ${label} exceeds invoice total (${bill.toFixed(2)}).`);

      err.status = 400;

      throw err;

    }

  }

}



export async function applyPaymentToInvoice(Model, voucher, allocation) {

  const filter = resolveInvoiceFilter(allocation ?? voucher);

  if (!filter) return null;



  const invoice = await Model.findOne(filter);

  if (!invoice) return null;



  const bill = parseMoney(invoice.billAmount ?? invoice.totals?.net ?? invoice.totals?.saleAmount);

  const add = parseMoney(allocation?.amount ?? voucher.amount);

  const paid = parseMoney(invoice.paidAmount) + add;

  const balance = Math.max(0, bill - paid);



  invoice.billAmount = bill;

  invoice.paidAmount = paid;

  invoice.balanceDue = balance;

  invoice.status = bill > 0 && balance <= 0.001 ? 'paid' : invoice.status === 'cancelled' ? 'cancelled' : 'open';



  const links = Array.isArray(invoice.paymentLinks) ? invoice.paymentLinks : [];

  links.push({

    voucherType: voucher.voucherType ?? '',

    voucherNo: voucher.voucherNo ?? 0,

    amount: add,

    voucherDate: voucher.voucherDate ?? new Date(),

    refNo: voucher.refNo ?? '',

    cashBank: voucher.cashBank ?? '',

  });

  invoice.paymentLinks = links;



  await invoice.save();

  return invoice;

}



/** @deprecated use applyPaymentToInvoice */

export async function applyVoucherToInvoice(Model, voucher) {

  return applyPaymentToInvoice(Model, voucher, voucher);

}



export async function reversePaymentOnInvoice(Model, invoice, voucher) {

  const links = Array.isArray(invoice.paymentLinks) ? invoice.paymentLinks : [];

  const matching = links.filter((link) => matchesVoucherLink(link, voucher));

  if (matching.length === 0) return null;



  const subtract = matching.reduce((sum, link) => sum + parseMoney(link.amount), 0);

  const bill = parseMoney(invoice.billAmount ?? invoice.totals?.net ?? invoice.totals?.saleAmount);

  const paid = Math.max(0, parseMoney(invoice.paidAmount) - subtract);

  const balance = Math.max(0, bill - paid);



  invoice.paidAmount = paid;

  invoice.balanceDue = balance;

  invoice.paymentLinks = links.filter((link) => !matchesVoucherLink(link, voucher));

  invoice.status =

    bill > 0 && balance <= 0.001 ? 'paid' : invoice.status === 'cancelled' ? 'cancelled' : 'open';



  await invoice.save();

  return invoice;

}



export async function reverseVoucherAllocations(Model, voucher) {

  const allocations = collectVoucherInvoiceAllocations(voucher);

  const results = [];



  for (const allocation of allocations) {

    const filter = resolveInvoiceFilter(allocation);

    if (!filter) continue;

    const invoice = await Model.findOne(filter);

    if (!invoice) continue;

    const updated = await reversePaymentOnInvoice(Model, invoice, voucher);

    if (updated) results.push(updated);

  }



  return results;

}



export function collectVoucherInvoiceAllocations(voucher) {

  const rows = Array.isArray(voucher?.invoiceAllocations) ? voucher.invoiceAllocations : [];

  const normalized = rows

    .map((row) => ({

      sourceDocType: String(row?.sourceDocType ?? voucher?.sourceDocType ?? '').trim(),

      sourceDocId: String(row?.sourceDocId ?? '').trim(),

      sourceFormattedDocNo: String(row?.sourceFormattedDocNo ?? '').trim(),

      amount: parseMoney(row?.amount),

    }))

    .filter((row) => row.amount > 0 && (row.sourceDocId || row.sourceFormattedDocNo));



  if (normalized.length > 0) return normalized;



  const singleAmount = parseMoney(voucher?.amount);

  if (singleAmount <= 0) return [];

  if (!voucher?.sourceDocId && !voucher?.sourceFormattedDocNo) return [];



  return [

    {

      sourceDocType: String(voucher?.sourceDocType ?? '').trim(),

      sourceDocId: String(voucher?.sourceDocId ?? '').trim(),

      sourceFormattedDocNo: String(voucher?.sourceFormattedDocNo ?? '').trim(),

      amount: singleAmount,

    },

  ];

}



export async function applyVoucherAllocations(Model, voucher) {

  const allocations = collectVoucherInvoiceAllocations(voucher);

  const results = [];

  for (const allocation of allocations) {

    const updated = await applyPaymentToInvoice(Model, voucher, allocation);

    if (updated) results.push(updated);

  }

  return results;

}



export async function replaceVoucherAllocations(Model, previousVoucher, nextVoucher) {

  await reverseVoucherAllocations(Model, previousVoucher);

  return applyVoucherAllocations(Model, nextVoucher);

}



export function mapOutstandingInvoice(inv) {

  const totalAmount = parseMoney(inv.billAmount ?? inv.totals?.net ?? inv.totals?.saleAmount);

  const paidAmount = parseMoney(inv.paidAmount);

  const outstandingBalance = parseMoney(inv.balanceDue ?? Math.max(0, totalAmount - paidAmount));



  return {

    sourceDocType: 'purchase_invoice',

    sourceDocId: String(inv._id),

    sourceFormattedDocNo: inv.formattedDocNo,

    invoiceDate: inv.billDate || inv.invoiceDate || '',

    supplier: inv.supplier ?? '',

    totalAmount,

    paidAmount,

    outstandingBalance,

  };

}


