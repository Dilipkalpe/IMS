/** Dev/stress: `?stressLines=500` on workspace route loads N sample lines. */
export function parseStressLineCount(search = ''): number | undefined {
  if (!search) return undefined;
  const raw = new URLSearchParams(search).get('stressLines');
  if (!raw) return undefined;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 5000) return undefined;
  return n;
}

export function readStressLineCountFromLocation(): number | undefined {
  if (typeof window === 'undefined') return undefined;
  return parseStressLineCount(window.location.search);
}
