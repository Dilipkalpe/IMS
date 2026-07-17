import { lazy, Suspense } from 'react';

const LazySalesReturnList = lazy(() =>
  import('./SalesReturnListScreen').then((m) => ({ default: m.SalesReturnListScreen })),
);
const LazySalesReturnWorkspace = lazy(() =>
  import('./SalesReturnWorkspaceScreen').then((m) => ({ default: m.SalesReturnWorkspaceScreen })),
);

function listRoute() {
  return function SalesReturnListRoute() {
    return (
      <Suspense fallback={<div className="si-list-toolbar__status">Loading sales returns…</div>}>
        <LazySalesReturnList />
      </Suspense>
    );
  };
}

function workspaceRoute() {
  return function SalesReturnWorkspaceRoute() {
    return (
      <Suspense fallback={<div className="si-list-toolbar__status">Loading workspace…</div>}>
        <LazySalesReturnWorkspace />
      </Suspense>
    );
  };
}

export const SalesReturnListRouteScreen = listRoute();
export const SalesReturnWorkspaceRouteScreen = workspaceRoute();
