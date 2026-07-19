import type { CSSProperties, ReactNode } from 'react';

export interface ErpFormGridProps {
  children: ReactNode;
  /** Default 3 — TMS booking header layout */
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  variant?: 'default' | 'gst' | 'eway';
  className?: string;
  'aria-label'?: string;
}

/** Responsive field grid — 3 columns on desktop, stacks on small screens. */
export function ErpFormGrid({
  children,
  columns = 3,
  variant = 'default',
  className = '',
  'aria-label': ariaLabel,
}: ErpFormGridProps) {
  const variantClass =
    variant === 'gst' ? ' erp-form-grid--gst' : variant === 'eway' ? ' erp-form-grid--eway' : '';

  return (
    <div
      className={`erp-form-grid${variantClass}${className ? ` ${className}` : ''}`}
      style={{ '--erp-form-cols': columns } as CSSProperties}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}
