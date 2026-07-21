import { useEffect, useState } from 'react';
import { NavKeys } from '../navigation/navKeys';
import { useDeliveryChallanRepositoryOptional } from '../delivery-challan/repository/DeliveryChallanRepositoryContext';
import { useQuotationRepositoryOptional } from '../quotation/repository/QuotationRepositoryContext';
import { useSalesInvoiceRepositoryOptional } from '../sales-invoice/repository/SalesInvoiceRepositoryContext';
import { useSalesOrderRepositoryOptional } from '../sales-order/repository/SalesOrderRepositoryContext';
import { useSalesReturnRepositoryOptional } from '../sales-return/repository/SalesReturnRepositoryContext';

export type SalesHubTabCounts = Partial<Record<string, number>>;

async function fetchTotal(
  repository: { fetchStats(): Promise<{ total: number }> } | null | undefined,
): Promise<number | undefined> {
  if (!repository) return undefined;
  try {
    const stats = await repository.fetchStats();
    return stats.total;
  } catch {
    return undefined;
  }
}

/** Total record counts for each Sales hub tab (refreshed when any sales list changes). */
export function useSalesHubTabCounts(): SalesHubTabCounts {
  const salesOrder = useSalesOrderRepositoryOptional();
  const quotation = useQuotationRepositoryOptional();
  const deliveryChallan = useDeliveryChallanRepositoryOptional();
  const salesInvoice = useSalesInvoiceRepositoryOptional();
  const salesReturn = useSalesReturnRepositoryOptional();

  const [counts, setCounts] = useState<SalesHubTabCounts>({});

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      fetchTotal(salesOrder.repository).then((total) => ({ key: NavKeys.SalesOrders, total })),
      fetchTotal(quotation.repository).then((total) => ({ key: NavKeys.Quotation, total })),
      fetchTotal(deliveryChallan.repository).then((total) => ({ key: NavKeys.DeliveryChallan, total })),
      fetchTotal(salesInvoice.repository).then((total) => ({ key: NavKeys.SalesInvoice, total })),
      fetchTotal(salesReturn.repository).then((total) => ({ key: NavKeys.SalesReturn, total })),
    ]).then((results) => {
      if (cancelled) return;
      const next: SalesHubTabCounts = {};
      for (const { key, total } of results) {
        if (total != null) next[key] = total;
      }
      setCounts(next);
    });

    return () => {
      cancelled = true;
    };
  }, [
    salesOrder.repository,
    salesOrder.listVersion,
    quotation.repository,
    quotation.listVersion,
    deliveryChallan.repository,
    deliveryChallan.listVersion,
    salesInvoice.repository,
    salesInvoice.listVersion,
    salesReturn.repository,
    salesReturn.listVersion,
  ]);

  return counts;
}
