import { memo } from 'react';
import {
  buildGstTotalsFields,
  TransactionTotalsRail,
  type TransactionDisplayTotals,
} from '../../components/transaction/TransactionTotalsRail';

export interface GrnTotalsRailProps {
  displayTotals: TransactionDisplayTotals;
}

function GrnTotalsRailInner({ displayTotals }: GrnTotalsRailProps) {
  return (
    <TransactionTotalsRail
      highlighted
      title="Totals"
      fields={buildGstTotalsFields(displayTotals, { totalLabel: 'GRN Total' })}
    />
  );
}

export const GrnTotalsRail = memo(GrnTotalsRailInner);
