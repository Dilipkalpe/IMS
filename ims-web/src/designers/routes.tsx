import { lazy, Suspense } from 'react';
import { PageLoadingFallback } from '../components/loading';

const LazyBillDesigner = lazy(() =>
  import('./BillFormatDesignerScreen').then((m) => ({ default: m.BillFormatDesignerScreen })),
);
const LazyReportFormatDesigner = lazy(() =>
  import('./ReportFormatDesignerScreen').then((m) => ({ default: m.ReportFormatDesignerScreen })),
);
const LazyPaymentAllocation = lazy(() =>
  import('../payment-voucher/PaymentAllocationScreen').then((m) => ({ default: m.PaymentAllocationScreen })),
);

export function BillFormatDesignerRouteScreen() {
  return (
    <Suspense fallback={<PageLoadingFallback title="Loading Bill Designer…" />}>
      <LazyBillDesigner />
    </Suspense>
  );
}

export function ReportFormatDesignerRouteScreen() {
  return (
    <Suspense fallback={<PageLoadingFallback title="Loading Report Designer…" />}>
      <LazyReportFormatDesigner />
    </Suspense>
  );
}

export function PaymentAllocationRouteScreen() {
  return (
    <Suspense fallback={<PageLoadingFallback title="Loading Payment Allocation…" />}>
      <LazyPaymentAllocation />
    </Suspense>
  );
}
