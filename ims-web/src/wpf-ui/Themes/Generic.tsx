/* AUTO-GENERATED from WPF: Themes/Generic.xaml — UI only; refine for pixel parity */
import './Generic.scss';
import { placeholders } from '../../placeholders';

export interface GenericProps {
  className?: string;
}

export function Generic({ className }: GenericProps) {
  return (
    <div className={['wpf-root', 'Generic', className].filter(Boolean).join(' ')} data-wpf-source="Themes/Generic.xaml">
    <div className="wpf-resourcedictionary">
      <div className="wpf-style">
        <div className="wpf-setter" />
        <div className="wpf-setter" />
        <div className="wpf-setter" />
        <div className="wpf-setter" />
        <div className="wpf-setter" />
        <div className="wpf-setter">
          <div className="wpf-setter.value">
            <div className="wpf-controltemplate">
              <div style={{"margin":"0"}} className="wpf-border wpf-white">
                <div className="wpf-grid">
                  <div className="wpf-grid.rowdefinitions">
                    <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                    <div className="wpf-rowdefinition" />
                  </div>
                  <div style={{"padding":"4 8"}} className="wpf-border">
                    <div className="wpf-border.background">
                      <div className="wpf-lineargradientbrush">
                        <div className="wpf-gradientstop" />
                        <div className="wpf-gradientstop" />
                      </div>
                    </div>
                    <div className="wpf-grid">
                      <span style={{"fontSize":"13px"}} className="wpf-textblock wpf-textprimarybrush">{"&#123;TemplateBinding Title&#125;"} </span>
                      <div className="wpf-contentpresenter" />
                    </div>
                  </div>
                  <div style={{"margin":"{TemplateBinding ContentMargin}"}} className="wpf-contentpresenter" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default Generic;
