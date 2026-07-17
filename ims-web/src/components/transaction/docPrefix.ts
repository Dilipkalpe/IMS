/** Align with WPF prefix normalization (alphanumeric + _ -, max 12 chars). */
export function normalizeDocPrefix(value: string | undefined, defaultPrefix: string): string {
  if (!value?.trim()) return defaultPrefix;
  const trimmed = value.trim().toUpperCase();
  const chars = [...trimmed].filter((c) => /[A-Z0-9_-]/.test(c)).slice(0, 12);
  return chars.length > 0 ? chars.join('') : defaultPrefix;
}

export function prefixFromPeekNext(
  next: {
    docPrefix?: string;
    qtPrefix?: string;
    deliveryChallanPrefix?: string;
    soPrefix?: string;
    poPrefix?: string;
    grnPrefix?: string;
  },
  fallback: string,
): string {
  return (
    next.docPrefix ??
    next.qtPrefix ??
    next.deliveryChallanPrefix ??
    next.soPrefix ??
    next.poPrefix ??
    next.grnPrefix ??
    fallback
  );
}
