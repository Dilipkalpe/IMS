import { memo } from 'react';
import {
  buildGstTotalsFields,
  TransactionTotalsRail,
  type TransactionDisplayTotals,
} from '../../components/transaction/TransactionTotalsRail';

export interface SalesReturnTotalsRailProps {
  displayTotals: TransactionDisplayTotals;
}

function SalesReturnTotalsRailInner({ displayTotals }: SalesReturnTotalsRailProps) {
  return (
    <TransactionTotalsRail
      highlighted
      fields={buildGstTotalsFields(displayTotals, { totalLabel: 'Return Total' })}
    />
  );
}

export const SalesReturnTotalsRail = memo(SalesReturnTotalsRailInner);
