import type { DashboardChartSeries } from '../../api/dashboard';
import { formatLocaleNumber } from '../../utils/formatLocaleNumber';

function pointX(index: number, count: number, leftPad: number, plotW: number): number {
  if (count <= 1) return leftPad + plotW / 2;
  return leftPad + (plotW * index) / (count - 1);
}

export function DashboardLineChart({ chart }: { chart: DashboardChartSeries }) {
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
  const rightPad = 4;
  const plotW = width - leftPad - rightPad;
  const plotH = height - bottomPad - topPad;
  const max = Math.max(1, ...series1, ...series2);
  const count = labels.length;

  const buildPolyline = (values: number[]) =>
    values
      .map((value, i) => {
        const x = pointX(i, count, leftPad, plotW);
        const y = topPad + plotH - (value / max) * plotH;
        return `${x},${y}`;
      })
      .join(' ');

  const renderSeries = (values: number[], color: string | undefined, name: string | undefined) => (
    <g key={name ?? 'series'}>
      <polyline
        fill="none"
        stroke={color ?? '#006B9E'}
        strokeWidth={2}
        points={buildPolyline(values)}
      />
      {values.map((value, i) => {
        const x = pointX(i, count, leftPad, plotW);
        const y = topPad + plotH - (value / max) * plotH;
        return (
          <circle key={`${name}-${labels[i]}`} cx={x} cy={y} r={4} fill={color ?? '#006B9E'}>
            <title>{`${name}\n${labels[i]}: ${formatLocaleNumber(value)}`}</title>
          </circle>
        );
      })}
    </g>
  );

  return (
    <div className="dash-chart">
      <div className="dash-chart__title">{chart.title}</div>
      <div className="dash-chart__legend">
        {chart.series1Name ? (
          <span className="dash-chart__legend-item">
            <span className="dash-chart__legend-swatch" style={{ backgroundColor: chart.series1Color }} />
            {chart.series1Name}
          </span>
        ) : null}
        {chart.series2Name ? (
          <span className="dash-chart__legend-item">
            <span className="dash-chart__legend-swatch" style={{ backgroundColor: chart.series2Color }} />
            {chart.series2Name}
          </span>
        ) : null}
      </div>
      <svg className="dash-chart__svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={chart.title}>
        <line
          x1={leftPad}
          y1={topPad + plotH}
          x2={leftPad + plotW}
          y2={topPad + plotH}
          className="dash-chart__baseline"
        />
        {renderSeries(series1, chart.series1Color, chart.series1Name)}
        {chart.series2Name ? renderSeries(series2, chart.series2Color, chart.series2Name) : null}
        {labels.map((label, i) => (
          <text
            key={label}
            x={pointX(i, count, leftPad, plotW)}
            y={topPad + plotH + 14}
            textAnchor="middle"
            className="dash-chart__axis-label"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}
