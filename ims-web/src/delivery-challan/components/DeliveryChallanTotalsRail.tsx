import { memo } from 'react';
import {
  buildGstTotalsFields,
  TransactionTotalsRail,
  type TransactionDisplayTotals,
} from '../../components/transaction/TransactionTotalsRail';

export interface DeliveryChallanTotalsRailProps {
  displayTotals: TransactionDisplayTotals;
}

function DeliveryChallanTotalsRailInner({ displayTotals }: DeliveryChallanTotalsRailProps) {
  return (
    <TransactionTotalsRail
      highlighted
      title="Totals"
      fields={buildGstTotalsFields(displayTotals, { totalLabel: 'DC Total' })}
    />
  );
}

export const DeliveryChallanTotalsRail = memo(DeliveryChallanTotalsRailInner);
