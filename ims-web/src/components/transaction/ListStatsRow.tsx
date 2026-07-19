import type { DashboardStat } from '../../api/dashboard';
import { StatCounterCard } from '../../dashboard/components/StatCounterCard';
import '../../dashboard/dashboard.scss';
import './transaction-list-layout.scss';

export function ListStatsRow({
  stats,
  className,
}: {
  stats: DashboardStat[];
  className?: string;
}) {
  return (
    <div className={['dash__stats-row', 'transaction-list__stats', className].filter(Boolean).join(' ')}>
      {stats.map((stat) => (
        <StatCounterCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
