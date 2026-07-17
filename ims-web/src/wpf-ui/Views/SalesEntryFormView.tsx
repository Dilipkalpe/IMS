/* AUTO-GENERATED from WPF: Views/SalesEntryFormView.xaml — UI only; refine for pixel parity */
import './SalesEntryFormView.scss';
import { placeholders } from '../../placeholders';

export interface SalesEntryFormViewProps {
  className?: string;
}

export function SalesEntryFormView({ className }: SalesEntryFormViewProps) {
  return (
    <div className={['wpf-root', 'SalesEntryFormView', className].filter(Boolean).join(' ')} data-wpf-source="Views/SalesEntryFormView.xaml">
    <div className="wpf-usercontrol wpf-contentbackgroundbrush">
      <div style={{"margin":"4 6","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
        <div className="wpf-grid.columndefinitions">
          <div className="wpf-columndefinition" />
          <div style={{"width":"140px"}} className="wpf-columndefinition" />
        </div>
        <div className="wpf-grid.rowdefinitions">
          <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          <div className="wpf-rowdefinition" />
          <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
        </div>
        <div style={{"margin":"0 6 4 0","padding":"6 8"}} className="wpf-border wpf-card">
          <div className="wpf-grid">
            <div className="wpf-grid.rowdefinitions">
              <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
              <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            </div>
            <div style={{"margin":"0 0 4 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
              <div className="wpf-grid.columndefinitions">
                <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                <div style={{"width":"88px"}} className="wpf-columndefinition" />
                <div style={{"width":"12px"}} className="wpf-columndefinition" />
                <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                <div style={{"width":"96px"}} className="wpf-columndefinition" />
                <div style={{"width":"12px"}} className="wpf-columndefinition" />
                <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                <div className="wpf-columndefinition" />
              </div>
              <span className="wpf-textblock wpf-salesfieldlabel">{placeholders.DocNoLabel} </span>
              <input type="text" className="wpf-textbox wpf-salescompactinput" onChange={() => placeholders.noop()} />
              <span className="wpf-textblock wpf-salesfieldlabel">{"Date"} </span>
              <input type="text" className="wpf-textbox wpf-salescompactinput" onChange={() => placeholders.noop()} />
              <span className="wpf-textblock wpf-salesfieldlabel">{"Sales Man"} </span>
              <select className="wpf-combobox wpf-salescompactcombo" />
            </div>
            <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
              <div className="wpf-grid.columndefinitions">
                <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                <div style={{"width":"120px"}} className="wpf-columndefinition" />
                <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                <div className="wpf-columndefinition" />
              </div>
              <span className="wpf-textblock wpf-salesfieldlabel">{"Customer"} </span>
              <select className="wpf-combobox wpf-salescompactcombo" />
              <button type="button" style={{"margin":"0 6","padding":"0","width":"26px","height":"26px"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()} />
              <span style={{"margin":"0 6 0 6"}} className="wpf-textblock wpf-salesfieldlabel">{"Details"} </span>
              <input type="text" className="wpf-textbox wpf-salescompactinput" onChange={() => placeholders.noop()} />
            </div>
          </div>
        </div>
        <div style={{"margin":"0 6 4 0","padding":"6 8"}} className="wpf-border wpf-accentlightbrush">
          <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div style={{"width":"Auto"}} className="wpf-columndefinition" />
              <div style={{"width":"90px"}} className="wpf-columndefinition" />
              <div style={{"width":"8px"}} className="wpf-columndefinition" />
              <div style={{"width":"Auto"}} className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
              <div style={{"width":"8px"}} className="wpf-columndefinition" />
              <div style={{"width":"Auto"}} className="wpf-columndefinition" />
              <div style={{"width":"56px"}} className="wpf-columndefinition" />
              <div style={{"width":"8px"}} className="wpf-columndefinition" />
              <div style={{"width":"Auto"}} className="wpf-columndefinition" />
              <div style={{"width":"64px"}} className="wpf-columndefinition" />
              <div style={{"width":"8px"}} className="wpf-columndefinition" />
              <div style={{"width":"Auto"}} className="wpf-columndefinition" />
              <div style={{"width":"64px"}} className="wpf-columndefinition" />
              <div style={{"width":"8px"}} className="wpf-columndefinition" />
              <div style={{"width":"Auto"}} className="wpf-columndefinition" />
            </div>
            <span className="wpf-textblock wpf-salesfieldlabel">{"Bar code"} </span>
            <input type="text" className="wpf-textbox wpf-salescompactinput" onChange={() => placeholders.noop()} />
            <span className="wpf-textblock wpf-salesfieldlabel">{"Product"} </span>
            <input type="text" className="wpf-textbox wpf-salescompactinput" onChange={() => placeholders.noop()} />
            <span className="wpf-textblock wpf-salesfieldlabel">{"Qty"} </span>
            <input type="text" className="wpf-textbox wpf-salescompactinput" onChange={() => placeholders.noop()} />
            <span className="wpf-textblock wpf-salesfieldlabel">{"MRP"} </span>
            <input type="text" className="wpf-textbox wpf-salescompactinput" onChange={() => placeholders.noop()} />
            <span className="wpf-textblock wpf-salesfieldlabel">{"Rate"} </span>
            <input type="text" className="wpf-textbox wpf-salescompactinput" onChange={() => placeholders.noop()} />
            <button type="button" style={{"padding":"4 10"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()} />
          </div>
        </div>
        <div style={{"margin":"0 6 4 0","padding":"0"}} className="wpf-border wpf-card">
          <table className="wpf-datagrid wpf-saleslinegrid">
            <div className="wpf-datagrid.columnheaderstyle">
              <div className="wpf-style" />
            </div>
            <div className="wpf-datagrid.rowstyle">
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
            <div className="wpf-datagrid.columns">
              <div style={{"width":"36px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"90px"}} className="wpf-datagridtextcolumn" />
              <div className="wpf-datagridtextcolumn" />
              <div style={{"width":"44px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"64px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"50px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"58px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"52px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"50px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"72px"}} className="wpf-datagridtextcolumn" />
            </div>
          </table>
        </div>
        <div style={{"margin":"0 6 0 0","padding":"6 8"}} className="wpf-border wpf-card">
          <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div style={{"width":"200px"}} className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
              <div style={{"width":"220px"}} className="wpf-columndefinition" />
            </div>
            <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <div style={{"margin":"0 0 4 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                <span style={{"width":"88px","fontSize":"11px"}} className="wpf-textblock wpf-salesfieldlabel">{"Cust. Return"} </span>
                <input type="text" style={{"width":"80px","height":"24px"}} className="wpf-textbox wpf-salescompactinput" onChange={() => placeholders.noop()} />
              </div>
              <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                <span style={{"width":"88px","fontSize":"11px"}} className="wpf-textblock wpf-salesfieldlabel">{"Receivable"} </span>
                <input type="text" style={{"width":"80px","height":"24px"}} className="wpf-textbox wpf-salescompactinput" onChange={() => placeholders.noop()} />
              </div>
            </div>
            <div style={{"margin":"0 10","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
              <div className="wpf-grid.rowdefinitions">
                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
              </div>
              <div className="wpf-grid.columndefinitions">
                <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                <div className="wpf-columndefinition" />
                <div style={{"width":"10px"}} className="wpf-columndefinition" />
                <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                <div style={{"width":"80px"}} className="wpf-columndefinition" />
              </div>
              <span style={{"fontSize":"11px"}} className="wpf-textblock wpf-salesfieldlabel">{"Narration"} </span>
              <input type="text" style={{"height":"24px"}} className="wpf-textbox wpf-salescompactinput" onChange={() => placeholders.noop()} />
              <span style={{"margin":"4 6 0 0","fontSize":"11px"}} className="wpf-textblock wpf-salesfieldlabel">{"Tot Qty"} </span>
              <input type="text" style={{"margin":"4 0 0 0","height":"24px"}} className="wpf-textbox wpf-panelmutedbrush wpf-salescompactinput" onChange={() => placeholders.noop()} />
              <span style={{"margin":"4 6 0 0","fontSize":"11px"}} className="wpf-textblock wpf-salesfieldlabel">{"Gross"} </span>
              <input type="text" style={{"margin":"4 0 0 0","height":"24px"}} className="wpf-textbox wpf-panelmutedbrush wpf-salescompactinput" onChange={() => placeholders.noop()} />
            </div>
            <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <div style={{"margin":"0 0 3 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                <span style={{"width":"82px","fontSize":"11px"}} className="wpf-textblock wpf-salesfieldlabel">{"Discount"} </span>
                <input type="text" style={{"width":"88px","height":"24px"}} className="wpf-textbox wpf-salescompactinput" onChange={() => placeholders.noop()} />
              </div>
              <div style={{"margin":"0 0 3 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                <span style={{"width":"82px","fontSize":"11px"}} className="wpf-textblock wpf-salesfieldlabel">{"Sp. Disc."} </span>
                <input type="text" style={{"width":"88px","height":"24px"}} className="wpf-textbox wpf-salescompactinput" onChange={() => placeholders.noop()} />
              </div>
              <div style={{"margin":"0 0 3 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                <span style={{"width":"82px","fontSize":"11px"}} className="wpf-textblock wpf-salesfieldlabel">{"Add other"} </span>
                <input type="text" style={{"width":"88px","height":"24px"}} className="wpf-textbox wpf-salescompactinput" onChange={() => placeholders.noop()} />
              </div>
              <div style={{"margin":"0 0 3 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                <span style={{"width":"82px","fontSize":"11px"}} className="wpf-textblock wpf-salesfieldlabel">{"Net"} </span>
                <input type="text" style={{"width":"88px","height":"24px"}} className="wpf-textbox wpf-panelmutedbrush wpf-salescompactinput" onChange={() => placeholders.noop()} />
              </div>
              <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                <span style={{"width":"82px","fontSize":"11px"}} className="wpf-textblock wpf-salesfieldlabel">{placeholders.AmountTotalLabel} </span>
                <input type="text" style={{"width":"88px","height":"24px"}} className="wpf-textbox wpf-accentbrush wpf-accentlightbrush wpf-salescompactinput" onChange={() => placeholders.noop()} />
              </div>
            </div>
          </div>
        </div>
        <div style={{"padding":"6 8"}} className="wpf-border wpf-card">
          <div className="wpf-scrollviewer">
            <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span style={{"margin":"0 0 6 0","fontSize":"12px"}} className="wpf-textblock wpf-sectionheader">{"Actions"} </span>
              <button type="button" className="wpf-button wpf-salessidebutton" onClick={() => placeholders.noop()} />
              <button type="button" className="wpf-button wpf-salessidebutton" onClick={() => placeholders.noop()} />
              <button type="button" className="wpf-button wpf-salessidebuttonsecondary" onClick={() => placeholders.noop()}>Edit (F2)</button>
              <button type="button" className="wpf-button wpf-salessidebutton" onClick={() => placeholders.noop()} />
              <button type="button" className="wpf-button wpf-salessidebuttonsecondary" onClick={() => placeholders.noop()}>Search (F9)</button>
              <button type="button" className="wpf-button wpf-salessidebutton" onClick={() => placeholders.noop()} />
              <button type="button" style={{"fontSize":"10px"}} className="wpf-button wpf-salessidebuttonsecondary" onClick={() => placeholders.noop()}>Save, Next (F11)</button>
              <button type="button" className="wpf-button wpf-salessidebuttonsecondary" onClick={() => placeholders.noop()}>Delete</button>
              <button type="button" className="wpf-button wpf-salessidebuttonsecondary" onClick={() => placeholders.noop()} />
              <button type="button" style={{"fontSize":"10px"}} className="wpf-button wpf-salessidebuttonsecondary" onClick={() => placeholders.noop()}>Edit Previous</button>
              <button type="button" className="wpf-button wpf-salessidebuttonsecondary" onClick={() => placeholders.noop()}>Sales Return</button>
              <button type="button" className="wpf-button wpf-salessidebuttonsecondary" onClick={() => placeholders.noop()}>Cancel (F7)</button>
              <button type="button" className="wpf-button wpf-salessidebuttonsecondary" onClick={() => placeholders.noop()}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default SalesEntryFormView;
