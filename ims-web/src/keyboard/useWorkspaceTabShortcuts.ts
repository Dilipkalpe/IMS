import { useEffect } from 'react';

/** Ctrl+Tab / Ctrl+Shift+Tab — cycle document workspace tabs. */
export function useWorkspaceTabShortcuts(
  tabIds: string[],
  activeId: string,
  onSelect: (id: string) => void,
  options?: { onNewTab?: () => void },
) {
  useEffect(() => {
    if (tabIds.length === 0) return;

    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        const idx = tabIds.indexOf(activeId);
        const next =
          e.shiftKey
            ? tabIds[(idx - 1 + tabIds.length) % tabIds.length]
            : tabIds[(idx + 1) % tabIds.length];
        onSelect(next);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        options?.onNewTab?.();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tabIds, activeId, onSelect, options?.onNewTab]);
}
