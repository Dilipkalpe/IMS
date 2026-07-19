import { connectDb, disconnectDb } from '../src/config/db.js';
import { SalesOrder } from '../src/models/SalesOrder.js';
import { toSalesOrderListItem, summarizeSalesOrderLines } from '../src/services/salesOrderListSummary.js';

await connectDb();
let doc = await SalesOrder.findOne({ formattedDocNo: /^PSO-/ }).lean();
if (!doc) doc = await SalesOrder.findOne({ 'lines.0': { $exists: true } }).lean();
if (!doc) {
  console.log('no document with lines');
  process.exit(0);
}
console.log('totals', doc.totals);
console.log('line0', doc.lines?.[0]);
console.log('summary', summarizeSalesOrderLines(doc.lines, doc.totals));
console.log('listItem', toSalesOrderListItem(doc));
await disconnectDb();
