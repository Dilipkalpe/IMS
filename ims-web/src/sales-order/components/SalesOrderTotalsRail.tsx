import { memo } from 'react';
import {
  buildGstTotalsFields,
  TransactionTotalsRail,
  type TransactionDisplayTotals,
} from '../../components/transaction/TransactionTotalsRail';

export interface SalesOrderTotalsRailProps {
  displayTotals: TransactionDisplayTotals;
}

function SalesOrderTotalsRailInner({ displayTotals }: SalesOrderTotalsRailProps) {
  return (
    <TransactionTotalsRail
      highlighted
      fields={buildGstTotalsFields(displayTotals, { totalLabel: 'Order Total' })}
    />
  );
}

export const SalesOrderTotalsRail = memo(SalesOrderTotalsRailInner);
