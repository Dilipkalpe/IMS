import { lazy, Suspense } from 'react';
import { PageLoadingFallback } from '../components/loading';

const LazyDashboard = lazy(() =>
  import('./DashboardScreen').then((m) => ({ default: m.DashboardScreen })),
);

export function DashboardRouteScreen() {
  return (
    <Suspense fallback={<PageLoadingFallback title="Loading Dashboard…" />}>
      <LazyDashboard />
    </Suspense>
  );
}
