import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQty, formatQty, deriveSalesOrderStatus } from './salesOrderFulfillment.js';
import { deriveDeliveryChallanInvoiceStatus } from './deliveryChallanInvoicing.js';
import { derivePurchaseOrderStatus } from './purchaseOrderFulfillment.js';
import { deriveGrnInvoiceStatus } from './grnInvoicing.js';
import { buildLineQtyIndex, sumQtyFromIndex } from './fulfillmentQtyIndex.js';

test('parseQty handles comma-separated numbers', () => {
  assert.equal(parseQty('1,250.5'), 1250.5);
  assert.equal(parseQty(''), 0);
});

test('formatQty trims trailing zeros', () => {
  assert.equal(formatQty(10), '10');
  assert.equal(formatQty(10.5), '10.5');
});

test('deriveSalesOrderStatus detects partial and full delivery', () => {
  assert.equal(
    deriveSalesOrderStatus([
      { qty: '10', deliveredQty: '5' },
      { qty: '4', deliveredQty: '0' }
    ]),
    'partially_delivered'
  );
  assert.equal(
    deriveSalesOrderStatus([
      { qty: '10', deliveredQty: '10' },
      { qty: '4', deliveredQty: '4' }
    ]),
    'fully_delivered'
  );
});

test('deriveDeliveryChallanInvoiceStatus detects partial and full invoicing', () => {
  assert.equal(
    deriveDeliveryChallanInvoiceStatus([
      { qty: '8', invoicedQty: '3' }
    ]),
    'partially_invoiced'
  );
  assert.equal(
    deriveDeliveryChallanInvoiceStatus([
      { qty: '8', invoicedQty: '8' }
    ]),
    'fully_invoiced'
  );
});

test('deriveDeliveryChallanInvoiceStatus preserves operational status when not invoiced', () => {
  assert.equal(
    deriveDeliveryChallanInvoiceStatus([{ qty: '8', invoicedQty: '0' }], 'dispatched'),
    'dispatched'
  );
  assert.equal(
    deriveDeliveryChallanInvoiceStatus([{ qty: '8', invoicedQty: '0' }], 'open'),
    'open'
  );
});

test('derivePurchaseOrderStatus detects partial and full receipt', () => {
  assert.equal(
    derivePurchaseOrderStatus([
      { qty: '100', receivedQty: '40' }
    ]),
    'partially_received'
  );
  assert.equal(
    derivePurchaseOrderStatus([
      { qty: '100', receivedQty: '100' }
    ]),
    'fully_received'
  );
});

test('buildLineQtyIndex sums downstream qty by source line key', () => {
  const index = buildLineQtyIndex(
    [
      {
        lines: [
          { dcPrefix: 'DC', dcDocNo: 10, dcLineSr: 1, qty: '3' },
          { dcPrefix: 'DC', dcDocNo: 10, dcLineSr: 1, qty: '2' }
        ]
      }
    ],
    {
      prefixField: 'dcPrefix',
      docNoField: 'dcDocNo',
      lineSrField: 'dcLineSr',
      defaultPrefix: 'DC'
    }
  );

  assert.equal(sumQtyFromIndex(index, 'DC', 10, 1, 'DC'), 5);
  assert.equal(sumQtyFromIndex(index, 'DC', 10, 2, 'DC'), 0);
});

test('deriveGrnInvoiceStatus detects partial and full purchase invoicing', () => {
  assert.equal(
    deriveGrnInvoiceStatus([
      { qty: '50', invoicedQty: '20' }
    ]),
    'partially_invoiced'
  );
  assert.equal(
    deriveGrnInvoiceStatus([
      { qty: '50', invoicedQty: '50' }
    ]),
    'fully_invoiced'
  );
});

test('deriveGrnInvoiceStatus preserves operational status when not invoiced', () => {
  assert.equal(
    deriveGrnInvoiceStatus([{ qty: '50', invoicedQty: '0' }], 'received'),
    'received'
  );
  assert.equal(
    deriveGrnInvoiceStatus([{ qty: '50', invoicedQty: '0' }], 'open'),
    'open'
  );
});
