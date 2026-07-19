import { lazy, Suspense } from 'react';
import { PageLoadingFallback } from '../components/loading';

const LazyPayrollReports = lazy(() =>
  import('./PayrollReportsScreen').then((m) => ({ default: m.PayrollReportsScreen })),
);

const LazyPayrollEmployeeForm = lazy(() =>
  import('./PayrollEmployeeFormScreen').then((m) => ({ default: m.PayrollEmployeeFormScreen })),
);

const LazyPayrollRuns = lazy(() =>
  import('./PayrollRunsScreen').then((m) => ({ default: m.PayrollRunsScreen })),
);

export function PayrollRunsRouteScreen() {
  return (
    <Suspense fallback={<PageLoadingFallback title="Loading Payroll Runs…" />}>
      <LazyPayrollRuns />
    </Suspense>
  );
}

export function PayrollReportsRouteScreen() {
  return (
    <Suspense fallback={<PageLoadingFallback title="Loading Payroll Reports…" />}>
      <LazyPayrollReports />
    </Suspense>
  );
}

export function PayrollEmployeeFormRouteScreen() {
  return (
    <Suspense fallback={<PageLoadingFallback title="Loading payroll employee form…" />}>
      <LazyPayrollEmployeeForm />
    </Suspense>
  );
}