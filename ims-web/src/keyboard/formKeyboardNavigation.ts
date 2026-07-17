/** Mirrors IMS.Helpers.FormKeyboardNavigation (Enter → next tab stop). */

export const SUPPRESS_ENTER_AS_TAB = 'data-suppress-enter-as-tab';
export const FIELD_FOCUS_KEY = 'data-focus-key';

export function hasSuppressEnterAsTab(element: Element | null): boolean {
  let node: Element | null = element;
  while (node) {
    if (node.hasAttribute(SUPPRESS_ENTER_AS_TAB)) return true;
    node = node.parentElement;
  }
  return false;
}

export function isEnterAsTabTarget(element: HTMLElement): boolean {
  if (!element.isConnected) return false;
  if ('disabled' in element && (element as HTMLInputElement).disabled) return false;
  if (element.getAttribute('aria-hidden') === 'true') return false;

  const tag = element.tagName;
  if (tag === 'SELECT') return true;
  if (tag === 'TEXTAREA') {
    const ta = element as HTMLTextAreaElement;
    if (!ta.readOnly && ta.rows > 1) return false;
    return true;
  }
  if (tag === 'INPUT') {
    const inp = element as HTMLInputElement;
    if (inp.type === 'hidden' || inp.type === 'button' || inp.type === 'submit' || inp.type === 'file') {
      return false;
    }
    return true;
  }
  return false;
}

/** Focusable fields in DOM order (respects tabIndex >= 0). */
export function getFocusableElements(root: HTMLElement): HTMLElement[] {
  const candidates = root.querySelectorAll<HTMLElement>(
    [
      'input:not([type="hidden"])',
      'select',
      'textarea',
      'button',
    ].join(','),
  );

  const visible: HTMLElement[] = [];
  for (const el of candidates) {
    if (
      ('disabled' in el && Boolean((el as HTMLButtonElement | HTMLInputElement | HTMLSelectElement).disabled)) ||
      el.tabIndex < 0
    ) {
      continue;
    }
    if (el.closest('[aria-hidden="true"]')) continue;
    const style = window.getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') continue;
    visible.push(el);
  }

  return visible;
}

export function focusNextInScope(current: HTMLElement, root: HTMLElement): boolean {
  const all = getFocusableElements(root);
  const idx = all.indexOf(current);
  if (idx >= 0 && idx < all.length - 1) {
    all[idx + 1].focus();
    return true;
  }
  if (idx < 0 && all.length > 0) {
    all[0].focus();
    return true;
  }
  return false;
}

export function focusPrevInScope(current: HTMLElement, root: HTMLElement): boolean {
  const all = getFocusableElements(root);
  const idx = all.indexOf(current);
  if (idx > 0) {
    all[idx - 1].focus();
    return true;
  }
  return false;
}

export function focusByKey(root: HTMLElement, key: string): boolean {
  const el = root.querySelector<HTMLElement>(`[${FIELD_FOCUS_KEY}="${key}"]`);
  if (!el || el.tabIndex < 0) return false;
  el.focus();
  return true;
}

export function focusFirstErrorField(
  root: HTMLElement,
  field: string | undefined,
  grid?: { focusLineColumn: (lineId: string, columnId: string) => void; focusFirstEditable: () => void },
): boolean {
  if (!field) return false;
  if (field === 'lines') {
    grid?.focusFirstEditable();
    return true;
  }
  if (field.startsWith('qty-')) {
    const lineId = field.slice(4);
    grid?.focusLineColumn(lineId, 'qty');
    return true;
  }
  return focusByKey(root, field);
}
