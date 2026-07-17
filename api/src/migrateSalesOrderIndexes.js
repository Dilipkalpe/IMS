import { Counter } from './models/Counter.js';
import { SalesOrder } from './models/SalesOrder.js';
import { normalizeSoPrefix, parseFormattedSalesOrderNo } from './services/salesOrderNo.js';

/** Drop legacy docNo-only unique index and backfill soPrefix on existing rows. */
export async function migrateSalesOrderIndexes() {
  const collection = SalesOrder.collection;
  const indexes = await collection.indexes();

  for (const index of indexes) {
    const keys = Object.keys(index.key ?? {});
    if (keys.length === 1 && keys[0] === 'docNo' && index.unique) {
      await collection.dropIndex(index.name);
      console.log(`Dropped legacy index: ${index.name}`);
    }
  }

  const withoutPrefix = await SalesOrder.find({
    $or: [{ soPrefix: { $exists: false } }, { soPrefix: '' }, { soPrefix: null }]
  });

  for (const order of withoutPrefix) {
    const parsed = parseFormattedSalesOrderNo(order.formattedDocNo);
    order.soPrefix = parsed.soPrefix;
    if (!order.formattedDocNo && order.docNo) {
      order.formattedDocNo = `${parsed.soPrefix}-${order.docNo}`;
    }
    await order.save();
  }

  if (withoutPrefix.length > 0) {
    console.log(`Backfilled soPrefix on ${withoutPrefix.length} sales order(s).`);
  }

  await syncPrefixCountersFromOrders();
}

async function syncPrefixCountersFromOrders() {
  const counters = await Counter.find({ key: /^sales_order:/ });
  for (const counter of counters) {
    const prefix = normalizeSoPrefix(counter.key.replace(/^sales_order:/, ''));
    const latest = await SalesOrder.findOne({ soPrefix: prefix })
      .sort({ docNo: -1 })
      .select('docNo')
      .lean();

    const maxDocNo = latest?.docNo ?? 0;
    if (maxDocNo === 0 && counter.value > 1 && prefix !== 'SO') {
      await Counter.deleteOne({ _id: counter._id });
      console.log(`Removed orphan counter ${counter.key} (will restart at 1)`);
      continue;
    }

    if (counter.value < maxDocNo) {
      counter.value = maxDocNo;
      await counter.save();
      console.log(`Synced counter ${counter.key} -> ${maxDocNo}`);
    }
  }
}
