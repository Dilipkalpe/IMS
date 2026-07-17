/* AUTO-GENERATED from WPF: Views/OutstandingReportView.xaml — UI only; refine for pixel parity */
import './OutstandingReportView.scss';
import { placeholders } from '../../placeholders';

export interface OutstandingReportViewProps {
  className?: string;
}

export function OutstandingReportView({ className }: OutstandingReportViewProps) {
  return (
    <div className={['wpf-root', 'OutstandingReportView', className].filter(Boolean).join(' ')} data-wpf-source="Views/OutstandingReportView.xaml">
    <div className="wpf-usercontrol wpf-contentbackgroundbrush">
      <div className="wpf-standardreportview">
        <div className="wpf-standardreportview.filtercontent">
          <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
              <div style={{"width":"Auto"}} className="wpf-columndefinition" />
            </div>
            <div style={{"margin":"0 12 0 0","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span className="wpf-textblock wpf-solistreportfieldlabel">{"As On Date"} </span>
              <input type="date" style={{"height":"32px"}} className="wpf-datepicker" onChange={() => placeholders.noop()} />
            </div>
            <div style={{"margin":"0 12 0 0","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span className="wpf-textblock wpf-solistreportfieldlabel">{"Type"} </span>
              <select style={{"padding":"6 8","fontSize":"13px"}} className="wpf-combobox wpf-formcombo" />
            </div>
            <div style={{"margin":"0 12 0 0","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span className="wpf-textblock wpf-solistreportfieldlabel">{"Party"} </span>
              <input type="text" style={{"padding":"6 8","fontSize":"13px"}} className="wpf-textbox" onChange={() => placeholders.noop()} />
            </div>
            <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
              <button type="button" className="wpf-button wpf-solistreportshowbutton" onClick={() => placeholders.noop()} />
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
              <div style={{"width":"90px"}} className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.elementstyle">
                  <div className="wpf-style" />
                </div>
              </div>
              <div className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.elementstyle">
                  <div className="wpf-style" />
                </div>
              </div>
              <div style={{"width":"95px"}} className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.elementstyle">
                  <div className="wpf-style" />
                </div>
              </div>
              <div style={{"width":"95px"}} className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.elementstyle">
                  <div className="wpf-style" />
                </div>
              </div>
              <div style={{"width":"95px"}} className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.elementstyle">
                  <div className="wpf-style" />
                </div>
              </div>
              <div style={{"width":"85px"}} className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.elementstyle">
                  <div className="wpf-style" />
                </div>
              </div>
              <div style={{"width":"85px"}} className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.elementstyle">
                  <div className="wpf-style" />
                </div>
              </div>
              <div style={{"width":"90px"}} className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.elementstyle">
                  <div className="wpf-style" />
                </div>
              </div>
              <div style={{"width":"55px"}} className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.elementstyle">
                  <div className="wpf-style" />
                </div>
              </div>
              <div style={{"width":"65px"}} className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.elementstyle">
                  <div className="wpf-style" />
                </div>
              </div>
              <div style={{"width":"85px"}} className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.elementstyle">
                  <div className="wpf-style" />
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

export default OutstandingReportView;
