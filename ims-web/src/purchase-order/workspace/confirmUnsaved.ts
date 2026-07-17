export function confirmDiscardUnsaved(title: string, detail?: string): boolean {
  const message = detail ? `${title}\n\n${detail}` : title;
  return window.confirm(message);
}

export function confirmDiscardMultipleDirty(count: number): boolean {
  if (count <= 0) return true;
  const noun = count === 1 ? 'tab has' : 'tabs have';
  return confirmDiscardUnsaved(
    'Discard unsaved changes?',
    `${count} open order ${noun} unsaved changes. Close anyway?`,
  );
}
