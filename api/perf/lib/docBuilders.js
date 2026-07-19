import { intBetween, pick } from './rng.js';

const SALESMEN = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Reddy', 'Vikram Singh'];
const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad', 'Kolkata'];
const STATUSES = {
  sales_order: ['open', 'confirmed', 'shipped', 'closed', 'cancelled'],
  delivery_challan: ['open', 'dispatched', 'closed', 'cancelled'],
  sales_invoice: ['draft', 'posted', 'open', 'cancelled'],
  sales_return: ['open', 'draft', 'closed', 'cancelled']
};

const PREFIX_BY_KIND = {
  sales_order: 'PSO',
  delivery_challan: 'PDC',
  sales_invoice: 'PSI',
  sales_return: 'PSR'
};

export function formatBillDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export function buildLine(sr, product, qty, rng) {
  const rate = product.salePrice ?? 100;
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
    discPercent: rng() > 0.7 ? String(intBetween(rng, 0, 10)) : '0',
    discValue: '0.00',
    taxType: 'GST',
    taxPercent: String(taxPercent),
    amount: amount.toFixed(2)
  };
}

export function buildTotals(lines) {
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

export function buildProduct(index) {
  const code = `PERF-P${String(index).padStart(6, '0')}`;
  const base = 50 + (index % 500);
  return {
    code,
    name: `Performance Test Product ${index} — ${['Widget', 'Assembly', 'Component', 'Kit'][index % 4]}`,
    category: index % 3 === 0 ? 'Raw Material' : index % 3 === 1 ? 'Component' : 'Finished Goods',
    unit: 'PCS',
    salePrice: base * 10,
    purchasePrice: base * 7,
    taxPercent: '18',
    cgst: 9,
    sgst: 9,
    igst: 18,
    productType: index % 3 === 0 ? 'Raw' : index % 3 === 1 ? 'Component' : 'Finished',
    activeStatus: true,
    stockQty: 100 + (index % 1000),
    reorderQty: 10
  };
}

export function buildCustomer(index) {
  const code = `PERF-C${String(index).padStart(6, '0')}`;
  const city = CITIES[index % CITIES.length];
  return {
    accountType: 'customer',
    code,
    name: `Perf Customer ${index} Pvt Ltd`,
    contactPerson: `Contact ${index}`,
    email: `customer${index}@perf-test.example`,
    city,
    state: city === 'Mumbai' ? 'Maharashtra' : 'Karnataka',
    country: 'India',
    pincode: String(400000 + (index % 99999)),
    creditLimit: 500000,
    creditDays: 30,
    activeStatus: true,
    gstNo: `27AAAAA${String(1000 + (index % 8999)).slice(0, 4)}A1Z5`
  };
}

/**
 * @param {'sales_order'|'delivery_challan'|'sales_invoice'|'sales_return'} kind
 */
export function buildSalesDocument(kind, docNo, customer, products, rng, dateRange) {
  const prefix = PREFIX_BY_KIND[kind];
  const lineCount = intBetween(rng, dateRange.linesMin, dateRange.linesMax);
  const lines = [];
  for (let i = 0; i < lineCount; i++) {
    const product = pick(rng, products);
    lines.push(buildLine(i + 1, product, intBetween(rng, 1, 25), rng));
  }
  const totals = buildTotals(lines);
  const billDate = formatBillDate(
    new Date(dateRange.start.getTime() + rng() * (dateRange.end.getTime() - dateRange.start.getTime()))
  );
  const formattedDocNo = `${prefix}-${docNo}`;
  const base = {
    docNo,
    formattedDocNo,
    billDate,
    salesMan: pick(rng, SALESMEN),
    customer: customer.name,
    customerDetails: `${customer.city}, ${customer.state}`,
    narration: `Perf load doc ${formattedDocNo}`,
    status: pick(rng, STATUSES[kind]),
    lines,
    totals
  };

  if (kind === 'sales_order') {
    return {
      soPrefix: prefix,
      docNo,
      formattedDocNo,
      billDate: base.billDate,
      salesMan: base.salesMan,
      customer: base.customer,
      customerDetails: base.customerDetails,
      narration: base.narration,
      status: base.status,
      lines: base.lines,
      totals: base.totals,
      soDate: new Date(dateRange.end),
      paymentTerms: 'Net 30',
      deliveryPriority: 'Normal'
    };
  }
  if (kind === 'delivery_challan') {
    return {
      ...base,
      docPrefix: prefix,
      dcDate: new Date(dateRange.end),
      soReference: `SO-${docNo - 1}`,
      warehouse: 'Main',
      vehicleNo: `MH12AB${String(1000 + (docNo % 8999))}`,
      transporter: 'Perf Logistics'
    };
  }
  if (kind === 'sales_invoice') {
    const net = Number(totals.net);
    const paid = rng() > 0.4 ? net : roundMoney(net * rng());
    const paymentType = paid >= net ? 'cash' : paid > 0 ? 'partial' : 'credit';
    return {
      ...base,
      docPrefix: prefix,
      invoiceDate: new Date(dateRange.end),
      dueDate: new Date(dateRange.end.getTime() + 30 * 86400000),
      gstin: customer.gstNo || '',
      placeOfSupply: customer.state || 'Maharashtra',
      paymentType,
      paymentMode: 'bank',
      billAmount: net,
      paidAmount: paid,
      balanceDue: roundMoney(net - paid)
    };
  }
  return {
    ...base,
    docPrefix: prefix,
    returnDate: new Date(dateRange.end),
    invoiceReference: `INV-${docNo - 2}`,
    returnReason: pick(rng, ['Damaged', 'Wrong item', 'Quality issue', 'Excess stock']),
    qcRemark: 'Perf QC',
    returnWarehouse: 'Main'
  };
}
