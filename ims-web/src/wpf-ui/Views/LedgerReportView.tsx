/* AUTO-GENERATED from WPF: Views/LedgerReportView.xaml — UI only; refine for pixel parity */
import './LedgerReportView.scss';
import { placeholders } from '../../placeholders';

export interface LedgerReportViewProps {
  className?: string;
}

export function LedgerReportView({ className }: LedgerReportViewProps) {
  return (
    <div className={['wpf-root', 'LedgerReportView', className].filter(Boolean).join(' ')} data-wpf-source="Views/LedgerReportView.xaml">
    <div className="wpf-usercontrol wpf-contentbackgroundbrush">
      <div className="wpf-standardreportview">
        <div className="wpf-standardreportview.filtercontent">
          <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
              <div style={{"width":"Auto"}} className="wpf-columndefinition" />
            </div>
            <div className="wpf-grid.rowdefinitions">
              <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
              <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            </div>
            <div style={{"margin":"0 12 10 0","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span className="wpf-textblock wpf-solistreportfieldlabel">{"Date From"} </span>
              <input type="date" style={{"height":"32px"}} className="wpf-datepicker" onChange={() => placeholders.noop()} />
            </div>
            <div style={{"margin":"0 12 10 0","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span className="wpf-textblock wpf-solistreportfieldlabel">{"Date To"} </span>
              <input type="date" style={{"height":"32px"}} className="wpf-datepicker" onChange={() => placeholders.noop()} />
            </div>
            <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
              <button type="button" style={{"margin":"0 8 0 0"}} className="wpf-button wpf-solistreportshowbutton" onClick={() => placeholders.noop()} />
              <button type="button" className="wpf-button wpf-solistreportprintbutton" onClick={() => placeholders.noop()} />
            </div>
            <div style={{"margin":"0 12 0 0","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span className="wpf-textblock wpf-solistreportfieldlabel">{"Account Code"} </span>
              <input type="text" style={{"padding":"6 8","fontSize":"13px"}} className="wpf-textbox wpf--fafbfc" onChange={() => placeholders.noop()} />
            </div>
            <div style={{"margin":"0 12 0 0","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span className="wpf-textblock wpf-solistreportfieldlabel">{"Account"} </span>
              <select style={{"padding":"6 8","fontSize":"13px"}} className="wpf-combobox wpf-formcombo" />
            </div>
          </div>
        </div>
        <div className="wpf-standardreportview.gridcontent">
          <table className="wpf-datagrid wpf-solistordersgrid">
            <div className="wpf-datagrid.columns">
              <div style={{"width":"110px"}} className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.elementstyle">
                  <div className="wpf-style" />
                </div>
              </div>
              <div style={{"width":"110px"}} className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.elementstyle">
                  <div className="wpf-style" />
                </div>
              </div>
              <div style={{"width":"80px"}} className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.elementstyle">
                  <div className="wpf-style" />
                </div>
              </div>
              <div className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.elementstyle">
                  <div className="wpf-style" />
                </div>
              </div>
              <div style={{"width":"90px"}} className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.elementstyle">
                  <div className="wpf-style" />
                </div>
              </div>
              <div style={{"width":"90px"}} className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.elementstyle">
                  <div className="wpf-style">
                    <div className="wpf-style.triggers">
                      <div className="wpf-datatrigger">
                        <div className="wpf-setter" />
                        <div className="wpf-setter" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{"width":"90px"}} className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.elementstyle">
                  <div className="wpf-style" />
                </div>
              </div>
            </div>
          </table>
        </div>
        <div className="wpf-standardreportview.footercontent">
          <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div style={{"width":"Auto"}} className="wpf-columndefinition" />
              <div style={{"width":"120px"}} className="wpf-columndefinition" />
              <div style={{"width":"24px"}} className="wpf-columndefinition" />
              <div style={{"width":"Auto"}} className="wpf-columndefinition" />
              <div style={{"width":"120px"}} className="wpf-columndefinition" />
            </div>
            <span style={{"margin":"0 8 0 0","fontSize":"14px"}} className="wpf-textblock wpf--2c3e50">{"Debit"} </span>
            <span style={{"fontSize":"14px"}} className="wpf-textblock wpf--dc3545">{placeholders.FooterDebitDisplay} </span>
            <span style={{"margin":"0 8 0 0","fontSize":"14px"}} className="wpf-textblock wpf--2c3e50">{"Credit"} </span>
            <span style={{"fontSize":"14px"}} className="wpf-textblock wpf--dc3545">{placeholders.FooterCreditDisplay} </span>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default LedgerReportView;
