import { lazy, Suspense } from 'react';
import { PageLoadingFallback } from '../components/loading';

const LazyWorkOrderList = lazy(() =>
  import('./WorkOrderListScreen').then((m) => ({ default: m.WorkOrderListScreen })),
);
const LazyWorkOrderEntry = lazy(() =>
  import('./WorkOrderEntryScreen').then((m) => ({ default: m.WorkOrderEntryScreen })),
);

export function WorkOrderListRouteScreen() {
  return (
    <Suspense fallback={<PageLoadingFallback title="Loading Work Orders…" />}>
      <LazyWorkOrderList />
    </Suspense>
  );
}

export function WorkOrderEntryRouteScreen() {
  return (
    <Suspense fallback={<PageLoadingFallback title="Loading Job Work…" />}>
      <LazyWorkOrderEntry />
    </Suspense>
  );
}
