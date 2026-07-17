import { lazy, Suspense } from 'react';

const LazyGrnList = lazy(() => import('./GrnListScreen').then((m) => ({ default: m.GrnListScreen })));
const LazyGrnWorkspace = lazy(() =>
  import('./GrnWorkspaceScreen').then((m) => ({ default: m.GrnWorkspaceScreen })),
);

function listRoute() {
  return function GrnListRoute() {
    return (
      <Suspense fallback={<div className="si-list-toolbar__status">Loading GRNs…</div>}>
        <LazyGrnList />
      </Suspense>
    );
  };
}

function workspaceRoute() {
  return function GrnWorkspaceRoute() {
    return (
      <Suspense fallback={<div className="si-list-toolbar__status">Loading workspace…</div>}>
        <LazyGrnWorkspace />
      </Suspense>
    );
  };
}

export const GrnListRouteScreen = listRoute();
export const GrnWorkspaceRouteScreen = workspaceRoute();
