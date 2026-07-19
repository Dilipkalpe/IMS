import type { ReactNode } from 'react';

export interface ErpFormSectionProps {
  children: ReactNode;
  className?: string;
}

/** White card section for transaction entry header fields. */
export function ErpFormSection({ children, className = '' }: ErpFormSectionProps) {
  return <section className={`erp-form-section${className ? ` ${className}` : ''}`}>{children}</section>;
}
