import {

  createSalesOrder,

  deleteSalesOrder,

  deleteSalesOrderByNo,

  getSalesOrderByFormatted,

  getSalesOrderById,

  getSalesOrderStats,

  listSalesOrders,

  peekSalesOrderNextNo,

  updateSalesOrder,

} from '../../api/salesOrders';

import { parseFormattedSoNo } from '../soDocumentNo';
import { buildSavePayload, mapApiRecord, recordToEditor } from './recordMappers';

import type {

  SalesOrderListQuery,

  SalesOrderListResult,

  SalesOrderListStats,

  SalesOrderNextNo,

  SalesOrderRecord,

  SalesOrderRepository,

  SaveSalesOrderInput,

  SaveSalesOrderResult,

} from './types';



export class HttpSalesOrderRepository implements SalesOrderRepository {

  readonly mode = 'http' as const;



  async fetchList(query: SalesOrderListQuery = {}): Promise<SalesOrderListResult> {

    const result = await listSalesOrders(query);

    return {

      items: result.items as unknown as SalesOrderRecord[],

      total: result.total,

      page: result.page,

      limit: result.limit,

    };

  }



  async fetchStats(): Promise<SalesOrderListStats> {

    const stats = await getSalesOrderStats();

    return {
      total: stats.total,
      draft: stats.draft,
      open: stats.open,
      confirmed: stats.confirmed,
      toShip: stats.toShip,
      shipped: stats.shipped,
      cancelled: stats.cancelled,
    };

  }



  async loadById(id: string): Promise<SalesOrderRecord> {

    return mapApiRecord(await getSalesOrderById(id));

  }



  async loadByFormatted(formatted: string): Promise<SalesOrderRecord> {

    return mapApiRecord(await getSalesOrderByFormatted(formatted));

  }



  async peekNextNo(prefix?: string): Promise<SalesOrderNextNo> {

    return peekSalesOrderNextNo(prefix ?? 'SO');

  }



  async save(input: SaveSalesOrderInput): Promise<SaveSalesOrderResult> {

    const payload = buildSavePayload(input);

    if (input.id) {

      const item = mapApiRecord(await updateSalesOrder(input.id, payload));

      return { record: item, created: false };

    }

    const item = mapApiRecord(await createSalesOrder(payload));

    return { record: item, created: true };

  }



  async deleteById(id: string): Promise<void> {

    await deleteSalesOrder(id);

  }



  async deleteByBillNo(billNo: string): Promise<void> {

    const parsed = parseFormattedSoNo(billNo);

    if (!parsed) throw new Error('Invalid sales order number.');

    await deleteSalesOrderByNo(parsed.docNo, parsed.prefix);

  }

}



export { recordToEditor };


