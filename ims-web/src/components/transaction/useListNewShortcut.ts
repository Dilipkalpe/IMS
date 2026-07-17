import { useEffect } from 'react';

/** WPF list parity: Ctrl+N opens new document when permitted. */
export function useListNewShortcut(canAdd: boolean, onNew: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!canAdd) return;
      if (e.ctrlKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        onNew();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canAdd, onNew]);
}
