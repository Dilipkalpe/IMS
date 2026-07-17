import { lazy, Suspense } from 'react';
import { PageLoadingFallback } from '../components/loading';

const LazyPaymentVoucherEntry = lazy(() =>
  import('./PaymentVoucherEntryScreen').then((m) => ({ default: m.PaymentVoucherEntryScreen })),
);

export function PaymentVoucherEntryRouteScreen() {
  return (
    <Suspense fallback={<PageLoadingFallback title="Loading Payment Voucher…" />}>
      <LazyPaymentVoucherEntry />
    </Suspense>
  );
}
