import type { CSSProperties, ReactNode } from 'react';
import { PageLoadingOverlay } from './PageLoadingOverlay';

export interface LoadingHostProps {
  loading?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/** Relative container that shows the WPF-style loading card over its content. */
export function LoadingHost({
  loading = false,
  title = 'Loading…',
  subtitle = 'Please wait while data is retrieved',
  className,
  style,
  children,
}: LoadingHostProps) {
  return (
    <div className={['loading-host', className].filter(Boolean).join(' ')} style={style}>
      {children}
      {loading ? <PageLoadingOverlay title={title} subtitle={subtitle} /> : null}
    </div>
  );
}
