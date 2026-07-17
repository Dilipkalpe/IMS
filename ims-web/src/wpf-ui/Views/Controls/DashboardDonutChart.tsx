/* AUTO-GENERATED from WPF: Views/Controls/DashboardDonutChart.xaml — UI only; refine for pixel parity */
import './DashboardDonutChart.scss';
import { placeholders } from '../../../placeholders';

export interface DashboardDonutChartProps {
  className?: string;
}

export function DashboardDonutChart({ className }: DashboardDonutChartProps) {
  return (
    <div className={['wpf-root', 'DashboardDonutChart', className].filter(Boolean).join(' ')} data-wpf-source="Views/Controls/DashboardDonutChart.xaml">
    <div className="wpf-usercontrol">
      <div className="wpf-grid">
        <div className="wpf-grid.rowdefinitions">
          <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          <div className="wpf-rowdefinition" />
        </div>
        <span style={{"margin":"0 0 4 0","fontSize":"12px"}} className="wpf-textblock wpf-name-TitleText wpf-textprimarybrush" />
        <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
          <div className="wpf-grid.columndefinitions">
            <div className="wpf-columndefinition" />
            <div style={{"width":"Auto"}} className="wpf-columndefinition" />
          </div>
          <div className="wpf-canvas wpf-name-PlotCanvas" />
          <div style={{"margin":"0 0 0 8","display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-name-LegendPanel" />
        </div>
      </div>
    </div>
    </div>
  );
}

export default DashboardDonutChart;
