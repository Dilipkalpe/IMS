import { lazy, Suspense, type ComponentType } from 'react';
import { PageLoadingFallback } from '../components/loading';

const LazyReceiptVoucherEntry = lazy(() =>
  import('./ReceiptVoucherEntryScreen').then((m) => ({ default: m.ReceiptVoucherEntryScreen })),
);

function entryRoute(): ComponentType {
  function ReceiptVoucherEntryRoute() {
    return (
      <Suspense fallback={<PageLoadingFallback title="Loading Receipt Voucher…" />}>
        <LazyReceiptVoucherEntry />
      </Suspense>
    );
  }
  return ReceiptVoucherEntryRoute;
}

export const ReceiptVoucherEntryRouteScreen = entryRoute();
