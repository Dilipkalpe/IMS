import type { ReactNode } from 'react';

export interface ErpFormFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
  span?: 'full' | 2 | 3;
  htmlFor?: string;
}

/** Label-above field cell matching TMS booking control style. */
export function ErpFormField({ label, children, className = '', span, htmlFor }: ErpFormFieldProps) {
  const spanClass = span === 'full' ? ' erp-form-field--full' : span ? ` erp-form-field--span-${span}` : '';

  return (
    <label className={`erp-form-field si-field${spanClass}${className ? ` ${className}` : ''}`} htmlFor={htmlFor}>
      <span className="erp-form-field__label">{label}</span>
      {children}
    </label>
  );
}
