/* AUTO-GENERATED from WPF: Views/Controls/StatCounterCard.xaml — UI only; refine for pixel parity */
import './StatCounterCard.scss';
import { placeholders } from '../../../placeholders';

export interface StatCounterCardProps {
  className?: string;
}

export function StatCounterCard({ className }: StatCounterCardProps) {
  return (
    <div className={['wpf-root', 'StatCounterCard', className].filter(Boolean).join(' ')} data-wpf-source="Views/Controls/StatCounterCard.xaml">
    <div style={{"margin":"0"}} className="wpf-usercontrol">
      <div className="wpf-border">
        <div className="wpf-border.style">
          <div className="wpf-style">
            <div className="wpf-setter" />
            <div className="wpf-setter" />
            <div className="wpf-style.triggers">
              <div className="wpf-trigger">
                <div className="wpf-setter" />
              </div>
            </div>
          </div>
        </div>
        <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
          <div className="wpf-grid.columndefinitions">
            <div style={{"width":"4px"}} className="wpf-columndefinition" />
            <div className="wpf-columndefinition" />
            <div style={{"width":"Auto"}} className="wpf-columndefinition" />
          </div>
          <div style={{"margin":"2 8 2 0"}} className="wpf-border wpf--binding-accentcolor-converter-hextobrushconverter" />
          <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
            <span style={{"fontSize":"11px"}} className="wpf-textblock wpf-textsecondarybrush">{placeholders.Label} </span>
            <span style={{"margin":"2 0 0 0","fontSize":"18px"}} className="wpf-textblock wpf--binding-accentcolor-converter-hextobrushconverter">{placeholders.Value} </span>
          </div>
          <div className="wpf-border">
            <div className="wpf-border.style">
              <div className="wpf-style">
                <div className="wpf-setter" />
              </div>
            </div>
            <span className="wpf-textblock wpf-soliststaticonglyph" />
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default StatCounterCard;
