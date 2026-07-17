import { lazy, Suspense, useMemo, type ComponentType } from 'react';
import { PageLoadingFallback } from './loading';
import { xamlUiManifest } from '../wpf-ui/manifest';

export interface ContentHostProps {
  xamlPath: string;
  className?: string;
}

export function ContentHost({ xamlPath, className }: ContentHostProps) {
  const LazyView = useMemo(() => {
    const loader = xamlUiManifest[xamlPath];
    if (!loader) return null;
    return lazy(loader as () => Promise<{ default: ComponentType<unknown> }>);
  }, [xamlPath]);

  if (!LazyView) {
    return (
      <div className={className} style={{ padding: 24 }}>
        <p>No React UI mapped for: {xamlPath}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Suspense fallback={<PageLoadingFallback />}>
        <LazyView />
      </Suspense>
    </div>
  );
}
