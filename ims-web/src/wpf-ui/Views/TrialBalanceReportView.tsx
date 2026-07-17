/* AUTO-GENERATED from WPF: Views/TrialBalanceReportView.xaml — UI only; refine for pixel parity */
import './TrialBalanceReportView.scss';
import { placeholders } from '../../placeholders';

export interface TrialBalanceReportViewProps {
  className?: string;
}

export function TrialBalanceReportView({ className }: TrialBalanceReportViewProps) {
  return (
    <div className={['wpf-root', 'TrialBalanceReportView', className].filter(Boolean).join(' ')} data-wpf-source="Views/TrialBalanceReportView.xaml">
    <div className="wpf-usercontrol wpf-contentbackgroundbrush">
      <div className="wpf-standardreportview">
        <div className="wpf-standardreportview.filtercontent">
          <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
              <div style={{"width":"Auto"}} className="wpf-columndefinition" />
            </div>
            <div style={{"margin":"0 12 0 0","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span className="wpf-textblock wpf-solistreportfieldlabel">{"Date From"} </span>
              <input type="date" style={{"height":"32px"}} className="wpf-datepicker" onChange={() => placeholders.noop()} />
            </div>
            <div style={{"margin":"0 12 0 0","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span className="wpf-textblock wpf-solistreportfieldlabel">{"Date To"} </span>
              <input type="date" style={{"height":"32px"}} className="wpf-datepicker" onChange={() => placeholders.noop()} />
            </div>
            <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
              <button type="button" style={{"margin":"0 8 0 0"}} className="wpf-button wpf-solistreportshowbutton" onClick={() => placeholders.noop()} />
              <button type="button" className="wpf-button wpf-solistreportprintbutton" onClick={() => placeholders.noop()} />
            </div>
          </div>
        </div>
        <div className="wpf-standardreportview.gridcontent">
          <table className="wpf-datagrid wpf-solistordersgrid">
            <div className="wpf-datagrid.columns">
              <div style={{"width":"52px"}} className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.elementstyle">
                  <div className="wpf-style">
                    <div className="wpf-setter" />
                  </div>
                </div>
              </div>
              <div className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.elementstyle">
                  <div className="wpf-style" />
                </div>
              </div>
              <div style={{"width":"120px"}} className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.elementstyle">
                  <div className="wpf-style">
                    <div className="wpf-style.triggers">
                      <div className="wpf-datatrigger">
                        <div className="wpf-setter" />
                        <div className="wpf-setter" />
                        <div className="wpf-setter" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{"width":"120px"}} className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.elementstyle">
                  <div className="wpf-style">
                    <div className="wpf-style.triggers">
                      <div className="wpf-datatrigger">
                        <div className="wpf-setter" />
                        <div className="wpf-setter" />
                        <div className="wpf-setter" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </table>
        </div>
      </div>
    </div>
    </div>
  );
}

export default TrialBalanceReportView;
