import { lazy, Suspense } from 'react';
import { PageLoadingFallback } from '../components/loading';

const LazyUserList = lazy(() =>
  import('./UserListScreen').then((m) => ({ default: m.UserListScreen })),
);
const LazyUserForm = lazy(() =>
  import('./UserFormScreen').then((m) => ({ default: m.UserFormScreen })),
);
const LazyRoleList = lazy(() =>
  import('./RoleMasterListScreen').then((m) => ({ default: m.RoleMasterListScreen })),
);
const LazyRoleForm = lazy(() =>
  import('./RoleFormScreen').then((m) => ({ default: m.RoleFormScreen })),
);

export function UserRolesListRouteScreen() {
  return (
    <Suspense fallback={<PageLoadingFallback title="Loading Users…" />}>
      <LazyUserList />
    </Suspense>
  );
}

export function UserFormRouteScreen() {
  return (
    <Suspense fallback={<PageLoadingFallback title="Loading user form…" />}>
      <LazyUserForm />
    </Suspense>
  );
}

export function RoleMasterListRouteScreen() {
  return (
    <Suspense fallback={<PageLoadingFallback title="Loading Roles & Permissions…" />}>
      <LazyRoleList />
    </Suspense>
  );
}

export function RoleFormRouteScreen() {
  return (
    <Suspense fallback={<PageLoadingFallback title="Loading role form…" />}>
      <LazyRoleForm />
    </Suspense>
  );
}
