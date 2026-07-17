import { useEffect } from 'react';

export function useListStats<TStats>(
  repository: { fetchStats(): Promise<TStats> } | null | undefined,
  listVersion: number,
  onStats: (stats: TStats) => void,
): void {
  useEffect(() => {
    if (!repository) return;
    let cancelled = false;
    void repository
      .fetchStats()
      .then((stats) => {
        if (!cancelled) onStats(stats);
      })
      .catch(() => {
        /* keep prior stats on transient API failure */
      });
    return () => {
      cancelled = true;
    };
  }, [repository, listVersion, onStats]);
}
