/* AUTO-GENERATED from WPF: Views/CashEntryEntryView.xaml — UI only; refine for pixel parity */
import './CashEntryEntryView.scss';
import { placeholders } from '../../placeholders';

export interface CashEntryEntryViewProps {
  className?: string;
}

export function CashEntryEntryView({ className }: CashEntryEntryViewProps) {
  return (
    <div className={['wpf-root', 'CashEntryEntryView', className].filter(Boolean).join(' ')} data-wpf-source="Views/CashEntryEntryView.xaml">
    <div className="wpf-usercontrol wpf-transactionpagebackgroundbrush">
      <div className="wpf-transactionentryshell">
        <div className="wpf-transactionentryshell.titlerightheader">
          <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
            <span style={{"margin":"0 8 0 0"}} className="wpf-textblock wpf-transactioninlinefieldlabel">{"Entry type"} </span>
            <div style={{"padding":"4 10"}} className="wpf-border wpf-mockbadge">
              <span style={{"fontSize":"12px"}} className="wpf-textblock wpf-warningbrush">{placeholders.VoucherTypeLabel} </span>
            </div>
          </div>
        </div>
        <div style={{"margin":"0"}} className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          </div>
          <span style={{"margin":"0 0 10 0"}} className="wpf-textblock wpf-pagesubtitle">{placeholders.PageDescription} </span>
          <div style={{"padding":"10 12 6 12"}} className="wpf-border wpf-transactionsectionborder">
            <div className="wpf-uniformgrid">
              <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                <span className="wpf-textblock wpf-subpageformlabel">{"Entry No *"} </span>
                <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
              </div>
              <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                <span className="wpf-textblock wpf-subpageformlabel">{"Date *"} </span>
                <input type="date" style={{"height":"28px"}} className="wpf-datepicker" onChange={() => placeholders.noop()} />
              </div>
            </div>
          </div>
          <div style={{"margin":"6 0 0 0","padding":"8 12"}} className="wpf-border wpf-transactionsectionborder">
            <div className="wpf-grid">
              <div className="wpf-grid.rowdefinitions">
                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                <div className="wpf-rowdefinition" />
              </div>
              <div style={{"margin":"0 0 8 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                <div className="wpf-grid.columndefinitions">
                  <div className="wpf-columndefinition" />
                  <div className="wpf-columndefinition" />
                  <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                </div>
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                  <span className="wpf-textblock wpf-subpageformlabel">{"Particular"} </span>
                  <select style={{"height":"28px"}} className="wpf-combobox wpf-subpageformcombo" />
                </div>
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                  <span className="wpf-textblock wpf-subpageformlabel">{"Amount"} </span>
                  <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                </div>
                <button type="button" style={{"margin":"0 0 6 0","height":"28px"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Add</button>
              </div>
              <div className="wpf-border wpf-white">
                <table className="wpf-datagrid wpf-transactionlinegrid">
                  <div className="wpf-datagrid.columnheaderstyle">
                    <div className="wpf-style" />
                  </div>
                  <div className="wpf-datagrid.cellstyle">
                    <div className="wpf-style" />
                  </div>
                  <div className="wpf-datagrid.rowstyle">
                    <div className="wpf-style" />
                  </div>
                  <div className="wpf-datagrid.columns">
                    <div style={{"width":"40px"}} className="wpf-datagridtemplatecolumn">
                      <div className="wpf-datagridtemplatecolumn.celltemplate">
                        <div className="wpf-datatemplate">
                          <button type="button" style={{"margin":"0 2","padding":"0","width":"28px","height":"24px"}} className="wpf-button wpf-dangerlightbrush" onClick={() => placeholders.noop()} />
                        </div>
                      </div>
                    </div>
                    <div className="wpf-datagridtextcolumn" />
                    <div style={{"width":"120px"}} className="wpf-datagridtextcolumn">
                      <div className="wpf-datagridtextcolumn.elementstyle">
                        <div className="wpf-style">
                          <div className="wpf-setter" />
                        </div>
                      </div>
                    </div>
                  </div>
                </table>
              </div>
            </div>
          </div>
          <div style={{"margin":"6 0 0 0","padding":"8 12 0 12"}} className="wpf-border">
            <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
              <div className="wpf-grid.columndefinitions">
                <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                <div className="wpf-columndefinition" />
              </div>
              <span style={{"margin":"0 12 0 0","fontSize":"13px"}} className="wpf-textblock wpf-textprimarybrush">{"Total"} </span>
              <input type="text" className="wpf-textbox wpf-successlightbrush wpf-subpageforminput" onChange={() => placeholders.noop()} />
            </div>
          </div>
          <div style={{"margin":"10 12 0 12","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
            <label style={{"margin":"0 0 8 0"}} className="wpf-checkbox wpf-textsecondarybrush" />
            <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
              <button type="button" style={{"margin":"0 10 0 0"}} className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()} />
              <button type="button" className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()} />
            </div>
            <span style={{"margin":"8 0 0 0"}} className="wpf-textblock wpf-subpagefooternote">{"Select a particular and amount, click Add for each line, then Save to post to MongoDB."} </span>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default CashEntryEntryView;
