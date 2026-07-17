import type { ReactNode } from 'react';
import { LoadingHost } from './LoadingHost';

export interface ListGridAreaProps {
  loading?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}

/** List/report grid region with the standard loading overlay. */
export function ListGridArea({
  loading = false,
  title = 'Loading…',
  subtitle = 'Please wait while data is retrieved',
  className,
  children,
}: ListGridAreaProps) {
  return (
    <LoadingHost
      loading={loading}
      title={title}
      subtitle={subtitle}
      className={['si-list-grid-wrap', className].filter(Boolean).join(' ')}
    >
      {children}
    </LoadingHost>
  );
}
