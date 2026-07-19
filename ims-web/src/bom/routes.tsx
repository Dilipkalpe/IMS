import { lazy, Suspense } from 'react';
import { PageLoadingFallback } from '../components/loading';

const LazyBomList = lazy(() => import('./BomListScreen').then((m) => ({ default: m.BomListScreen })));
const LazyBomEditor = lazy(() => import('./BomEditorScreen').then((m) => ({ default: m.BomEditorScreen })));

export function BomListRouteScreen() {
  return (
    <Suspense fallback={<PageLoadingFallback title="Loading BOM list…" />}>
      <LazyBomList />
    </Suspense>
  );
}

export function BomEntryRouteScreen() {
  return (
    <Suspense fallback={<PageLoadingFallback title="Loading BOM editor…" />}>
      <LazyBomEditor />
    </Suspense>
  );
}
