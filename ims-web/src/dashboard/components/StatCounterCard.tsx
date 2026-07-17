import type { DashboardStat } from '../../api/dashboard';

export function StatCounterCard({ stat }: { stat: DashboardStat }) {
  return (
    <div
      className="dash-stat-card"
      style={{ borderColor: stat.accentColor }}
    >
      <div className="dash-stat-card__accent" style={{ backgroundColor: stat.accentColor }} />
      <div className="dash-stat-card__body">
        <div className="dash-stat-card__label">{stat.label}</div>
        <div className="dash-stat-card__value" style={{ color: stat.accentColor }}>
          {stat.value}
        </div>
      </div>
      {stat.iconGlyph ? (
        <div className="dash-stat-card__icon" style={{ backgroundColor: stat.accentColor }}>
          <span className="dash-stat-card__glyph" aria-hidden>
            {stat.iconGlyph}
          </span>
        </div>
      ) : null}
    </div>
  );
}
