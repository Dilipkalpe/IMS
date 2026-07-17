/* AUTO-GENERATED from WPF: Views/WorkOrderView.xaml — UI only; refine for pixel parity */
import './WorkOrderView.scss';
import { placeholders } from '../../placeholders';

export interface WorkOrderViewProps {
  className?: string;
}

export function WorkOrderView({ className }: WorkOrderViewProps) {
  return (
    <div className={['wpf-root', 'WorkOrderView', className].filter(Boolean).join(' ')} data-wpf-source="Views/WorkOrderView.xaml">
    <div className="wpf-usercontrol wpf-transactionpagebackgroundbrush">
      <div className="wpf-transactionentryshell">
        <div className="wpf-transactionentryshell.titlerightheader">
          <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
            <span style={{"margin":"0 6 0 0"}} className="wpf-textblock wpf-transactioninlinefieldlabel">{"Final qty"} </span>
            <div style={{"padding":"2 8"}} className="wpf-border wpf-white">
              <span style={{"fontSize":"12px"}} className="wpf-textblock">{placeholders.FinalQty} </span>
            </div>
          </div>
        </div>
        <div className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          </div>
          <div style={{"margin":"0 0 4 0","padding":"6 8"}} className="wpf-border wpf-transactionsectionborder">
            <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
              <div className="wpf-grid.columndefinitions">
                <div className="wpf-columndefinition" />
                <div style={{"width":"8px"}} className="wpf-columndefinition" />
                <div className="wpf-columndefinition" />
              </div>
              <div className="wpf-grid">
                <div className="wpf-grid.rowdefinitions">
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                </div>
                <div style={{"margin":"0 0 4 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                  <div className="wpf-grid.columndefinitions">
                    <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                    <div style={{"width":"72px"}} className="wpf-columndefinition" />
                    <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                    <div style={{"width":"130px"}} className="wpf-columndefinition" />
                  </div>
                  <span style={{"margin":"0 6 0 0"}} className="wpf-textblock wpf-transactioninlinefieldlabel">{"Production ID"} </span>
                  <input type="text" style={{"margin":"0 12 0 0"}} className="wpf-textbox wpf--f5f5f5 wpf-wocompactinput" onChange={() => placeholders.noop()} />
                  <span style={{"margin":"0 6 0 0"}} className="wpf-textblock wpf-transactioninlinefieldlabel">{"Date"} </span>
                  <input type="date" style={{"height":"24px"}} className="wpf-datepicker" onChange={() => placeholders.noop()} />
                </div>
                <div style={{"margin":"0 0 4 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                  <div className="wpf-grid.columndefinitions">
                    <div style={{"width":"56px"}} className="wpf-columndefinition" />
                    <div style={{"width":"76px"}} className="wpf-columndefinition" />
                    <div style={{"width":"76px"}} className="wpf-columndefinition" />
                    <div className="wpf-columndefinition" />
                  </div>
                  <span style={{"margin":"0 4 0 0"}} className="wpf-textblock wpf-transactioninlinefieldlabel">{"Item"} </span>
                  <input type="text" style={{"margin":"0 4 0 0"}} className="wpf-textbox wpf-wocompactinput" onChange={() => placeholders.noop()} />
                  <button type="button" style={{"margin":"0 4 0 0"}} className="wpf-button wpf-wolookupbutton" onClick={() => placeholders.noop()}>Look up</button>
                  <input type="text" className="wpf-textbox wpf--f5f5f5 wpf-wocompactinput" onChange={() => placeholders.noop()} />
                </div>
                <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                  <div className="wpf-grid.columndefinitions">
                    <div style={{"width":"56px"}} className="wpf-columndefinition" />
                    <div style={{"width":"76px"}} className="wpf-columndefinition" />
                    <div style={{"width":"76px"}} className="wpf-columndefinition" />
                    <div className="wpf-columndefinition" />
                  </div>
                  <span style={{"margin":"0 4 0 0"}} className="wpf-textblock wpf-transactioninlinefieldlabel">{"Machine"} </span>
                  <input type="text" style={{"margin":"0 4 0 0"}} className="wpf-textbox wpf-wocompactinput" onChange={() => placeholders.noop()} />
                  <button type="button" style={{"margin":"0 4 0 0"}} className="wpf-button wpf-wolookupbutton" onClick={() => placeholders.noop()}>Look up</button>
                  <input type="text" className="wpf-textbox wpf--f5f5f5 wpf-wocompactinput" onChange={() => placeholders.noop()} />
                </div>
              </div>
              <div className="wpf-grid">
                <div className="wpf-grid.rowdefinitions">
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                </div>
                <div style={{"margin":"0 0 4 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                  <div className="wpf-grid.columndefinitions">
                    <div style={{"width":"56px"}} className="wpf-columndefinition" />
                    <div style={{"width":"76px"}} className="wpf-columndefinition" />
                    <div style={{"width":"76px"}} className="wpf-columndefinition" />
                    <div className="wpf-columndefinition" />
                  </div>
                  <span style={{"margin":"0 4 0 0"}} className="wpf-textblock wpf-transactioninlinefieldlabel">{"Operator"} </span>
                  <input type="text" style={{"margin":"0 4 0 0"}} className="wpf-textbox wpf-wocompactinput" onChange={() => placeholders.noop()} />
                  <button type="button" style={{"margin":"0 4 0 0"}} className="wpf-button wpf-wolookupbutton" onClick={() => placeholders.noop()}>Look up</button>
                  <input type="text" className="wpf-textbox wpf--f5f5f5 wpf-wocompactinput" onChange={() => placeholders.noop()} />
                </div>
                <div style={{"margin":"0 0 4 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                  <div className="wpf-grid.columndefinitions">
                    <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                    <div className="wpf-columndefinition" />
                    <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                    <div className="wpf-columndefinition" />
                    <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                    <div style={{"width":"56px"}} className="wpf-columndefinition" />
                  </div>
                  <span style={{"margin":"0 6 0 0"}} className="wpf-textblock wpf-transactioninlinefieldlabel">{"Start"} </span>
                  <input type="text" style={{"margin":"0 8 0 0"}} className="wpf-textbox wpf-wocompactinput" onChange={() => placeholders.noop()} />
                  <span style={{"margin":"0 6 0 0"}} className="wpf-textblock wpf-transactioninlinefieldlabel">{"End"} </span>
                  <input type="text" style={{"margin":"0 8 0 0"}} className="wpf-textbox wpf-wocompactinput" onChange={() => placeholders.noop()} />
                  <span style={{"margin":"0 6 0 0"}} className="wpf-textblock wpf-transactioninlinefieldlabel">{"Min"} </span>
                  <input type="text" className="wpf-textbox wpf-wocompactinput" onChange={() => placeholders.noop()} />
                </div>
                <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                  <div className="wpf-grid.columndefinitions">
                    <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                    <div style={{"width":"56px"}} className="wpf-columndefinition" />
                    <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                    <div style={{"width":"56px"}} className="wpf-columndefinition" />
                    <div className="wpf-columndefinition" />
                  </div>
                  <span style={{"margin":"0 6 0 0"}} className="wpf-textblock wpf-transactioninlinefieldlabel">{"Produce"} </span>
                  <input type="text" style={{"margin":"0 12 0 0"}} className="wpf-textbox wpf-wocompactinput" onChange={() => placeholders.noop()} />
                  <span style={{"margin":"0 6 0 0"}} className="wpf-textblock wpf-transactioninlinefieldlabel">{"Rejected"} </span>
                  <input type="text" className="wpf-textbox wpf-wocompactinput" onChange={() => placeholders.noop()} />
                </div>
              </div>
            </div>
          </div>
          <div style={{"margin":"0 0 4 0","padding":"4 8"}} className="wpf-border wpf-transactionscanbar">
            <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
              <div className="wpf-grid.columndefinitions">
                <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                <div style={{"width":"130px"}} className="wpf-columndefinition" />
                <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                <div className="wpf-columndefinition" />
              </div>
              <span style={{"margin":"0 8 0 0"}} className="wpf-textblock wpf-salesfieldlabel">{"From godown"} </span>
              <select style={{"height":"24px"}} className="wpf-combobox wpf-subpageformcombo" />
              <button type="button" style={{"margin":"0 6 0 12","width":"Auto","height":"24px"}} className="wpf-button wpf-wolookupbutton" onClick={() => placeholders.noop()}>Generate from BOM</button>
              <button type="button" style={{"width":"Auto","height":"24px"}} className="wpf-button wpf-wolookupbutton" onClick={() => placeholders.noop()}>Open BOM</button>
            </div>
          </div>
          <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div className="wpf-columndefinition" />
              <div style={{"width":"6px"}} className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
            </div>
            <div className="wpf-border wpf-transactionshellborder">
              <div className="wpf-grid">
                <div className="wpf-grid.rowdefinitions">
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  <div className="wpf-rowdefinition" />
                </div>
                <div className="wpf-border wpf-wosectiontitlebar">
                  <span style={{"fontSize":"12px"}} className="wpf-textblock wpf-transactiontitletext">{"1. Raw materials"} </span>
                </div>
                <div style={{"padding":"0"}} className="wpf-border wpf-white">
                  <table className="wpf-datagrid wpf-wostretchlinegrid">
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
                      <div style={{"width":"40px"}} className="wpf-datagridtextcolumn" />
                      <div style={{"width":"70px"}} className="wpf-datagridtextcolumn" />
                      <div className="wpf-datagridtextcolumn" />
                      <div style={{"width":"44px"}} className="wpf-datagridtextcolumn" />
                      <div style={{"width":"56px"}} className="wpf-datagridtextcolumn">
                        <div className="wpf-datagridtextcolumn.elementstyle">
                          <div className="wpf-style" />
                        </div>
                      </div>
                      <div style={{"width":"56px"}} className="wpf-datagridtextcolumn">
                        <div className="wpf-datagridtextcolumn.elementstyle">
                          <div className="wpf-style">
                            <div className="wpf-setter" />
                            <div className="wpf-setter" />
                          </div>
                        </div>
                      </div>
                      <div style={{"width":"60px"}} className="wpf-datagridtextcolumn">
                        <div className="wpf-datagridtextcolumn.elementstyle">
                          <div className="wpf-style" />
                        </div>
                      </div>
                      <div style={{"width":"68px"}} className="wpf-datagridtextcolumn">
                        <div className="wpf-datagridtextcolumn.elementstyle">
                          <div className="wpf-style" />
                        </div>
                      </div>
                    </div>
                  </table>
                </div>
              </div>
            </div>
            <div className="wpf-border wpf-transactionshellborder">
              <div className="wpf-grid">
                <div className="wpf-grid.rowdefinitions">
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  <div className="wpf-rowdefinition" />
                </div>
                <div className="wpf-border wpf-wosectiontitlebar">
                  <span style={{"fontSize":"12px"}} className="wpf-textblock wpf-transactiontitletext">{"2. Consumables"} </span>
                </div>
                <div style={{"padding":"0"}} className="wpf-border wpf-white">
                  <table className="wpf-datagrid wpf-wostretchlinegrid">
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
                      <div style={{"width":"40px"}} className="wpf-datagridtextcolumn" />
                      <div className="wpf-datagridtextcolumn" />
                      <div style={{"width":"52px"}} className="wpf-datagridtextcolumn">
                        <div className="wpf-datagridtextcolumn.elementstyle">
                          <div className="wpf-style" />
                        </div>
                      </div>
                      <div style={{"width":"60px"}} className="wpf-datagridtextcolumn">
                        <div className="wpf-datagridtextcolumn.elementstyle">
                          <div className="wpf-style" />
                        </div>
                      </div>
                      <div style={{"width":"68px"}} className="wpf-datagridtextcolumn">
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
          <div style={{"margin":"4 0 0 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div className="wpf-columndefinition" />
              <div style={{"width":"Auto"}} className="wpf-columndefinition" />
            </div>
            <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
              <span style={{"margin":"0 4 0 0"}} className="wpf-textblock wpf-transactioninlinefieldlabel">{"Raw:"} </span>
              <div style={{"margin":"0 12 0 0","padding":"2 8"}} className="wpf-border wpf-white">
                <span style={{"fontSize":"12px"}} className="wpf-textblock">{placeholders.RawMaterialAmount} </span>
              </div>
              <span style={{"margin":"0 4 0 0"}} className="wpf-textblock wpf-transactioninlinefieldlabel">{"Consumable:"} </span>
              <div style={{"margin":"0 12 0 0","padding":"2 8"}} className="wpf-border wpf-white">
                <span style={{"fontSize":"12px"}} className="wpf-textblock">{placeholders.ConsumableAmount} </span>
              </div>
              <span style={{"margin":"0 4 0 0"}} className="wpf-textblock wpf-transactioninlinefieldlabel">{"Total:"} </span>
              <div style={{"padding":"2 8"}} className="wpf-border wpf-white">
                <span style={{"fontSize":"12px"}} className="wpf-textblock">{placeholders.ProductionAmount} </span>
              </div>
            </div>
            <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
              <button type="button" style={{"margin":"0 8 0 0","height":"28px","fontSize":"12px"}} className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()}>Save</button>
              <button type="button" style={{"height":"28px","fontSize":"12px"}} className="wpf-button wpf-salessidebuttonsecondary" onClick={() => placeholders.noop()}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default WorkOrderView;
