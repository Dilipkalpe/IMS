import type { DashboardChartSeries } from '../../api/dashboard';

function legendItem(name: string | undefined, color: string | undefined) {
  if (!name) return null;
  return (
    <span key={name} className="dash-chart__legend-item">
      <span className="dash-chart__legend-swatch" style={{ backgroundColor: color ?? '#006B9E' }} />
      {name}
    </span>
  );
}

export function DashboardBarChart({ chart }: { chart: DashboardChartSeries }) {
  const labels = chart.labels ?? [];
  const series1 = chart.series1 ?? [];
  const series2 = chart.series2 ?? [];
  if (labels.length === 0) {
    return (
      <div className="dash-chart dash-chart--empty">
        <div className="dash-chart__title">{chart.title}</div>
        <p className="dash-chart__empty">No chart data</p>
      </div>
    );
  }

  const width = 360;
  const height = 220;
  const leftPad = 8;
  const bottomPad = 22;
  const topPad = 6;
  const plotW = width - leftPad - 4;
  const plotH = height - bottomPad - topPad;
  const max = Math.max(1, ...series1, ...series2);
  const count = labels.length;
  const groupW = plotW / count;
  const barW = Math.max(4, (groupW - 10) / 2);

  return (
    <div className="dash-chart">
      <div className="dash-chart__title">{chart.title}</div>
      <div className="dash-chart__legend">
        {legendItem(chart.series1Name, chart.series1Color)}
        {legendItem(chart.series2Name, chart.series2Color)}
      </div>
      <svg className="dash-chart__svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={chart.title}>
        <line
          x1={leftPad}
          y1={topPad + plotH}
          x2={leftPad + plotW}
          y2={topPad + plotH}
          className="dash-chart__baseline"
        />
        {labels.map((label, i) => {
          const cx = leftPad + groupW * i + groupW / 2;
          const v1 = series1[i] ?? 0;
          const v2 = series2[i] ?? 0;
          const h1 = (v1 / max) * plotH;
          const h2 = (v2 / max) * plotH;
          return (
            <g key={label}>
              <rect
                x={cx - barW - 2}
                y={topPad + plotH - Math.max(h1, 1)}
                width={barW}
                height={Math.max(h1, 1)}
                rx={2}
                fill={chart.series1Color ?? '#006B9E'}
              >
                <title>{`${chart.series1Name}\n${label}: ${v1.toLocaleString('en-IN')}`}</title>
              </rect>
              <rect
                x={cx + 2}
                y={topPad + plotH - Math.max(h2, 1)}
                width={barW}
                height={Math.max(h2, 1)}
                rx={2}
                fill={chart.series2Color ?? '#B8860B'}
              >
                <title>{`${chart.series2Name}\n${label}: ${v2.toLocaleString('en-IN')}`}</title>
              </rect>
              <text
                x={leftPad + groupW * i + groupW / 2}
                y={topPad + plotH + 14}
                textAnchor="middle"
                className="dash-chart__axis-label"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
