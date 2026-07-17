/* AUTO-GENERATED from WPF: Views/Controls/DashboardBarChart.xaml — UI only; refine for pixel parity */
import './DashboardBarChart.scss';
import { placeholders } from '../../../placeholders';

export interface DashboardBarChartProps {
  className?: string;
}

export function DashboardBarChart({ className }: DashboardBarChartProps) {
  return (
    <div className={['wpf-root', 'DashboardBarChart', className].filter(Boolean).join(' ')} data-wpf-source="Views/Controls/DashboardBarChart.xaml">
    <div className="wpf-usercontrol">
      <div className="wpf-grid">
        <div className="wpf-grid.rowdefinitions">
          <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          <div className="wpf-rowdefinition" />
        </div>
        <span style={{"margin":"0 0 4 0","fontSize":"12px"}} className="wpf-textblock wpf-name-TitleText wpf-textprimarybrush" />
        <div style={{"margin":"0 0 4 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel wpf-name-LegendPanel" />
        <div className="wpf-canvas wpf-name-PlotCanvas" />
      </div>
    </div>
    </div>
  );
}

export default DashboardBarChart;
