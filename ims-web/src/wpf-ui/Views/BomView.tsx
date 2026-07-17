/* AUTO-GENERATED from WPF: Views/BomView.xaml — UI only; refine for pixel parity */
import './BomView.scss';
import { placeholders } from '../../placeholders';

export interface BomViewProps {
  className?: string;
}

export function BomView({ className }: BomViewProps) {
  return (
    <div className={['wpf-root', 'BomView', className].filter(Boolean).join(' ')} data-wpf-source="Views/BomView.xaml">
    <div className="wpf-usercontrol wpf-transactionpagebackgroundbrush">
      <div className="wpf-transactionentryshell">
        <div style={{"margin":"0"}} className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          </div>
          <div style={{"margin":"0 0 8 0","padding":"8 10"}} className="wpf-border wpf-transactionsectionborder">
            <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
              <div className="wpf-grid.columndefinitions">
                <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                <div className="wpf-columndefinition" />
              </div>
              <span style={{"margin":"0 8 0 0"}} className="wpf-textblock wpf-transactioninlinefieldlabel">{"Product ID"} </span>
              <input type="text" style={{"margin":"0 12 0 0","width":"110px","height":"26px"}} className="wpf-textbox wpf--f5f5f5 wpf-subpageforminput" onChange={() => placeholders.noop()} />
              <span style={{"margin":"0 8 0 0"}} className="wpf-textblock wpf-transactioninlinefieldlabel">{"Product Code"} </span>
              <input type="text" style={{"margin":"0 12 0 0","width":"100px","height":"26px"}} className="wpf-textbox wpf--f5f5f5 wpf-subpageforminput" onChange={() => placeholders.noop()} />
              <span style={{"margin":"0 8 0 0"}} className="wpf-textblock wpf-transactioninlinefieldlabel">{"Product Name"} </span>
              <input type="text" style={{"height":"26px"}} className="wpf-textbox wpf--f5f5f5 wpf-subpageforminput" onChange={() => placeholders.noop()} />
            </div>
          </div>
          <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div className="wpf-columndefinition" />
              <div style={{"width":"8px"}} className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
            </div>
            <div className="wpf-border wpf-transactionshellborder">
              <div className="wpf-grid">
                <div className="wpf-grid.rowdefinitions">
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  <div className="wpf-rowdefinition" />
                </div>
                <div className="wpf-border wpf-bomsectiontitlebar">
                  <span className="wpf-textblock wpf-transactiontitletext">{"1. Raw Material"} </span>
                </div>
                <div className="wpf-productscanpickerbar wpf-name-RawMaterialProductPicker" />
                <div style={{"padding":"0"}} className="wpf-border wpf-white">
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
                      <div style={{"width":"50px"}} className="wpf-datagridtextcolumn" />
                      <div style={{"width":"90px"}} className="wpf-datagridtextcolumn" />
                      <div className="wpf-datagridtextcolumn" />
                      <div style={{"width":"50px"}} className="wpf-datagridtextcolumn" />
                      <div style={{"width":"60px"}} className="wpf-datagridtextcolumn">
                        <div className="wpf-datagridtextcolumn.elementstyle">
                          <div className="wpf-style" />
                        </div>
                      </div>
                      <div style={{"width":"60px"}} className="wpf-datagridtextcolumn">
                        <div className="wpf-datagridtextcolumn.elementstyle">
                          <div className="wpf-style" />
                        </div>
                      </div>
                      <div style={{"width":"70px"}} className="wpf-datagridtextcolumn">
                        <div className="wpf-datagridtextcolumn.elementstyle">
                          <div className="wpf-style" />
                        </div>
                      </div>
                      <div style={{"width":"80px"}} className="wpf-datagridtextcolumn">
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
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  <div className="wpf-rowdefinition" />
                </div>
                <div className="wpf-border wpf-bomsectiontitlebar">
                  <span className="wpf-textblock wpf-transactiontitletext">{"2. Consumable Material"} </span>
                </div>
                <div className="wpf-border wpf-transactionscanbar">
                  <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                    <div className="wpf-grid.columndefinitions">
                      <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                      <div className="wpf-columndefinition" />
                      <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                    </div>
                    <span style={{"margin":"0 8 0 0"}} className="wpf-textblock wpf-salesfieldlabel">{"Material"} </span>
                    <input type="text" className="wpf-textbox wpf-salescompactinput" onChange={() => placeholders.noop()} />
                    <button type="button" style={{"margin":"0 0 0 8","padding":"0 14","height":"28px"}} className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()}>ADD</button>
                  </div>
                </div>
                <div style={{"padding":"0"}} className="wpf-border wpf-white">
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
                      <div style={{"width":"50px"}} className="wpf-datagridtextcolumn" />
                      <div className="wpf-datagridtextcolumn" />
                      <div style={{"width":"60px"}} className="wpf-datagridtextcolumn">
                        <div className="wpf-datagridtextcolumn.elementstyle">
                          <div className="wpf-style" />
                        </div>
                      </div>
                      <div style={{"width":"70px"}} className="wpf-datagridtextcolumn">
                        <div className="wpf-datagridtextcolumn.elementstyle">
                          <div className="wpf-style" />
                        </div>
                      </div>
                      <div style={{"width":"80px"}} className="wpf-datagridtextcolumn">
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
          <div style={{"margin":"8 0 6 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div className="wpf-columndefinition" />
              <div style={{"width":"8px"}} className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
            </div>
            <div style={{"padding":"8 10"}} className="wpf-border wpf-transactionsectionborder">
              <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                <span style={{"margin":"0 10 0 0"}} className="wpf-textblock wpf-transactioninlinefieldlabel">{"Raw Material Amount"} </span>
                <div style={{"padding":"4 10"}} className="wpf-border wpf-white">
                  <span style={{"fontSize":"12px"}} className="wpf-textblock">{placeholders.RawMaterialAmount} </span>
                </div>
              </div>
            </div>
            <div style={{"padding":"8 10"}} className="wpf-border wpf-transactionsectionborder">
              <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                <span style={{"margin":"0 10 0 0"}} className="wpf-textblock wpf-transactioninlinefieldlabel">{"Production Amount"} </span>
                <div style={{"padding":"4 10"}} className="wpf-border wpf-white">
                  <span style={{"fontSize":"12px"}} className="wpf-textblock">{placeholders.ProductionAmount} </span>
                </div>
              </div>
            </div>
          </div>
          <div style={{"margin":"4 0 0 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
            <button type="button" style={{"margin":"0 8 0 0","padding":"6 30"}} className="wpf-button wpf-white" onClick={() => placeholders.noop()}>SAVE</button>
            <button type="button" style={{"padding":"6 16"}} className="wpf-button wpf-salessidebuttonsecondary" onClick={() => placeholders.noop()}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default BomView;
