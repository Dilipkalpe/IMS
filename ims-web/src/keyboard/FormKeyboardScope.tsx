import { forwardRef, useCallback, useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import {
  FIELD_FOCUS_KEY,
  focusByKey,
  focusNextInScope,
  hasSuppressEnterAsTab,
  isEnterAsTabTarget,
} from './formKeyboardNavigation';

export interface FormKeyboardScopeProps {
  children: ReactNode;
  className?: string;
  /** Focus this data-focus-key on mount / when key changes (e.g. workspace tab). */
  autoFocusFieldKey?: string;
  /** Called when Enter-as-tab cannot find a next field inside the scope. */
  onEnterAtEnd?: () => void;
}

/**
 * Container-level Enter-as-tab (WPF FormKeyboardNavigation).
 * Grid cells handle Enter internally; barcode uses data-suppress-enter-as-tab.
 */
export const FormKeyboardScope = forwardRef<HTMLDivElement, FormKeyboardScopeProps>(function FormKeyboardScope(
  { children, className, autoFocusFieldKey, onEnterAtEnd },
  forwardedRef,
) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const setRootRef = useCallback(
    (el: HTMLDivElement | null) => {
      rootRef.current = el;
      if (typeof forwardedRef === 'function') forwardedRef(el);
      else if (forwardedRef) forwardedRef.current = el;
    },
    [forwardedRef],
  );

  useEffect(() => {
    if (!autoFocusFieldKey || !rootRef.current) return;
    const t = window.setTimeout(() => focusByKey(rootRef.current!, autoFocusFieldKey), 0);
    return () => window.clearTimeout(t);
  }, [autoFocusFieldKey]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'Enter' || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target;
      if (!(target instanceof HTMLElement) || !rootRef.current?.contains(target)) return;
      if (hasSuppressEnterAsTab(target)) return;
      if (target.classList.contains('corporate-data-grid__input')) return;
      if (!isEnterAsTabTarget(target)) return;

      e.preventDefault();
      if (!focusNextInScope(target, rootRef.current)) {
        onEnterAtEnd?.();
      }
    },
    [onEnterAtEnd],
  );

  return (
    <div ref={setRootRef} className={className} onKeyDown={onKeyDown}>
      {children}
    </div>
  );
});

export { FIELD_FOCUS_KEY };
