import type { DashboardChartSeries } from '../../api/dashboard';
import { formatLocaleNumber } from '../../utils/formatLocaleNumber';

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutArcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  sweepAngle: number,
): string {
  if (sweepAngle <= 0) return '';
  const endAngle = startAngle + sweepAngle;
  const largeArc = sweepAngle > 180 ? 1 : 0;
  const outerStart = polarToCartesian(cx, cy, outerR, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, startAngle);
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

export function DashboardDonutChart({ chart }: { chart: DashboardChartSeries }) {
  const slices = chart.slices ?? [];
  const total = slices.reduce((sum, slice) => sum + (Number(slice.value) || 0), 0);
  if (slices.length === 0 || total <= 0) {
    return (
      <div className="dash-chart dash-chart--empty">
        <div className="dash-chart__title">{chart.title}</div>
        <p className="dash-chart__empty">No chart data</p>
      </div>
    );
  }

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR * 0.55;
  let startAngle = 0;

  return (
    <div className="dash-chart dash-chart--donut">
      <div className="dash-chart__title">{chart.title}</div>
      <div className="dash-chart__donut-wrap">
        <svg className="dash-chart__donut-svg" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={chart.title}>
          {slices.map((slice) => {
            const sweep = (slice.value / total) * 360;
            const path = donutArcPath(cx, cy, outerR, innerR, startAngle, sweep);
            startAngle += sweep;
            return (
              <path key={slice.label} d={path} fill={slice.color}>
                <title>{`${slice.label}: ${formatLocaleNumber(slice.value)}`}</title>
              </path>
            );
          })}
        </svg>
        <div className="dash-chart__donut-legend">
          {slices.map((slice) => (
            <div key={slice.label} className="dash-chart__donut-legend-row">
              <span className="dash-chart__legend-swatch" style={{ backgroundColor: slice.color }} />
              <span className="dash-chart__donut-legend-label">{slice.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
