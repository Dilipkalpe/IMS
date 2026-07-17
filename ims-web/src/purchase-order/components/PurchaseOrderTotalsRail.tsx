import { memo } from 'react';
import {
  buildGstTotalsFields,
  TransactionTotalsRail,
  type TransactionDisplayTotals,
} from '../../components/transaction/TransactionTotalsRail';

export interface PurchaseOrderTotalsRailProps {
  displayTotals: TransactionDisplayTotals;
}

function PurchaseOrderTotalsRailInner({ displayTotals }: PurchaseOrderTotalsRailProps) {
  return (
    <TransactionTotalsRail
      highlighted
      fields={buildGstTotalsFields(displayTotals, { totalLabel: 'Order Total' })}
    />
  );
}

export const PurchaseOrderTotalsRail = memo(PurchaseOrderTotalsRailInner);
