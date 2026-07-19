import { lazy, Suspense } from 'react';
import { PageLoadingFallback } from '../components/loading';

const LazyList = lazy(() =>
  import('./StockTransferListScreen').then((m) => ({ default: m.StockTransferListScreen })),
);
const LazyEntry = lazy(() =>
  import('./StockTransferEntryScreen').then((m) => ({ default: m.StockTransferEntryScreen })),
);

export function StockTransferListRouteScreen() {
  return (
    <Suspense fallback={<PageLoadingFallback title="Loading transfers…" />}>
      <LazyList />
    </Suspense>
  );
}

export function StockTransferEntryRouteScreen() {
  return (
    <Suspense fallback={<PageLoadingFallback title="Loading transfer entry…" />}>
      <LazyEntry />
    </Suspense>
  );
}
