import type { ReactNode } from 'react';

export function DashboardQuickLink({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="wpf-action-button dash-quick-link" onClick={onClick}>
      <span className="dash-quick-link__icon" aria-hidden>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

export function DashboardMetricGrid({
  cells,
}: {
  cells: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="dash-metric-grid">
      {cells.map((cell) => (
        <div key={cell.label} className="dash-metric-grid__cell">
          <div className="dash-metric-grid__label">{cell.label}</div>
          <div className="dash-metric-grid__value">{cell.value}</div>
        </div>
      ))}
    </div>
  );
}

export function DashboardPanel({
  title,
  metrics,
  quickLinks,
  chart,
}: {
  title: string;
  metrics: Array<{ label: string; value: string }>;
  quickLinks: ReactNode;
  chart: ReactNode;
}) {
  return (
    <section className="dash-panel">
      <header className="dash-panel__header">
        <h2 className="dash-panel__title">{title}</h2>
      </header>
      <div className="dash-panel__body">
        <DashboardMetricGrid cells={metrics} />
        <div className="dash-panel__actions">{quickLinks}</div>
        <div className="dash-panel__chart">{chart}</div>
      </div>
    </section>
  );
}
