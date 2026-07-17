import { PageLoadingOverlay } from './PageLoadingOverlay';
import './PageLoadingOverlay.scss';

export interface PageLoadingFallbackProps {
  title?: string;
  subtitle?: string;
}

/** Centered loader for React Suspense and route-level lazy loading. */
export function PageLoadingFallback({
  title = 'Loading…',
  subtitle = 'Please wait',
}: PageLoadingFallbackProps) {
  return (
    <div className="page-loading-fallback content-host__loading">
      <PageLoadingOverlay title={title} subtitle={subtitle} variant="card" />
    </div>
  );
}
