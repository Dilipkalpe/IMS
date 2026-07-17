import { memo } from 'react';
import {
  buildGstTotalsFields,
  TransactionTotalsRail,
  type TransactionDisplayTotals,
} from '../../components/transaction/TransactionTotalsRail';

export interface QuotationTotalsRailProps {
  displayTotals: TransactionDisplayTotals;
}

function QuotationTotalsRailInner({ displayTotals }: QuotationTotalsRailProps) {
  return (
    <TransactionTotalsRail
      highlighted
      fields={buildGstTotalsFields(displayTotals, { totalLabel: 'Quote Total' })}
    />
  );
}

export const QuotationTotalsRail = memo(QuotationTotalsRailInner);
