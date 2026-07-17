import { memo } from 'react';
import {
  buildGstTotalsFields,
  TransactionTotalsRail,
  type TransactionDisplayTotals,
} from '../../components/transaction/TransactionTotalsRail';

export interface PurchaseReturnTotalsRailProps {
  displayTotals: TransactionDisplayTotals;
}

function PurchaseReturnTotalsRailInner({ displayTotals }: PurchaseReturnTotalsRailProps) {
  return (
    <TransactionTotalsRail
      highlighted
      fields={buildGstTotalsFields(displayTotals, { totalLabel: 'Return Total' })}
    />
  );
}

export const PurchaseReturnTotalsRail = memo(PurchaseReturnTotalsRailInner);
