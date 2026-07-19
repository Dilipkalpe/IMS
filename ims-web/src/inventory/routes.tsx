import { lazy, Suspense } from 'react';
import { PageLoadingFallback } from '../components/loading';

const LazyStockLevels = lazy(() =>
  import('./StockLevelsScreen').then((m) => ({ default: m.StockLevelsScreen })),
);

export function StockLevelsRouteScreen() {
  return (
    <Suspense fallback={<PageLoadingFallback title="Loading stock levels…" />}>
      <LazyStockLevels />
    </Suspense>
  );
}
