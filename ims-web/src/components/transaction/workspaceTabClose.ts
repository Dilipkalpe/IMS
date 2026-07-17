import type { Dispatch, SetStateAction } from 'react';

/** Close a workspace tab without unsaved confirmation (used after save+next on edit). */
export function closeWorkspaceTabWithoutConfirm<TTab extends { id: string; isSelected: boolean }, TDoc>(
  id: string,
  setTabs: Dispatch<SetStateAction<TTab[]>>,
  setDocuments: Dispatch<SetStateAction<Record<string, TDoc>>>,
  setFocusSeed: Dispatch<SetStateAction<number>>,
): number {
  let remaining = 0;
  setTabs((prev) => {
    const next = prev.filter((t) => t.id !== id);
    remaining = next.length;
    if (next.length === 0) return next;
    const wasSelected = prev.find((t) => t.id === id)?.isSelected;
    if (!wasSelected) return next;
    const idx = Math.min(prev.findIndex((t) => t.id === id), next.length - 1);
    const activeId = next[idx]?.id ?? next[0].id;
    return next.map((t) => ({ ...t, isSelected: t.id === activeId }));
  });
  setDocuments((prev) => {
    const { [id]: _, ...rest } = prev;
    return rest;
  });
  setFocusSeed((s) => s + 1);
  return remaining;
}
