import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

export interface ErpFormNarrationProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

/** Full-width remarks / narration textarea at document bottom. */
export const ErpFormNarration = forwardRef<HTMLTextAreaElement, ErpFormNarrationProps>(function ErpFormNarration(
  { label = 'Narration', className = '', ...rest },
  ref,
) {
  return (
    <div className={`erp-form-narration si-bottom__narration${className ? ` ${className}` : ''}`}>
      <label className="erp-form-field__label">{label}</label>
      <textarea ref={ref} className="erp-form-narration__input" rows={3} {...rest} />
    </div>
  );
});
