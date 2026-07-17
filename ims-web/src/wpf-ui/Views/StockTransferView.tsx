/* AUTO-GENERATED from WPF: Views/StockTransferView.xaml — UI only; refine for pixel parity */
import './StockTransferView.scss';
import { placeholders } from '../../placeholders';

export interface StockTransferViewProps {
  className?: string;
}

export function StockTransferView({ className }: StockTransferViewProps) {
  return (
    <div className={['wpf-root', 'StockTransferView', className].filter(Boolean).join(' ')} data-wpf-source="Views/StockTransferView.xaml">
    <div className="wpf-usercontrol wpf-transactionpagebackgroundbrush">
      <div className="wpf-transactionentryshell">
        <div className="wpf-transactionentryshell.titlerightheader">
          <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
            <span style={{"fontSize":"12px"}} className="wpf-textblock wpf-red">{"Current Stock :"} </span>
            <span style={{"margin":"0 0 0 6","fontSize":"12px"}} className="wpf-textblock wpf-red">{placeholders.CurrentStockDisplay} </span>
          </div>
        </div>
        <div className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          </div>
          <div style={{"margin":"0 0 10 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
            </div>
            <div style={{"margin":"0 10 0 0","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <div style={{"margin":"0 0 6 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                <div className="wpf-grid.columndefinitions">
                  <div style={{"width":"120px"}} className="wpf-columndefinition" />
                  <div className="wpf-columndefinition" />
                </div>
                <span className="wpf-textblock wpf-transactioninlinefieldlabel">{"Entry No"} </span>
                <input type="text" style={{"height":"26px"}} className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
              </div>
              <div style={{"margin":"0 0 6 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                <div className="wpf-grid.columndefinitions">
                  <div style={{"width":"120px"}} className="wpf-columndefinition" />
                  <div className="wpf-columndefinition" />
                </div>
                <span className="wpf-textblock wpf-transactioninlinefieldlabel">{"From Godown"} </span>
                <select style={{"height":"26px"}} className="wpf-combobox wpf-subpageformcombo" />
              </div>
              <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                <div className="wpf-grid.columndefinitions">
                  <div style={{"width":"120px"}} className="wpf-columndefinition" />
                  <div className="wpf-columndefinition" />
                </div>
                <span style={{"margin":"4 0 0 0"}} className="wpf-textblock wpf-transactioninlinefieldlabel">{"Remark"} </span>
                <input type="text" style={{"height":"60px"}} className="wpf-textbox wpf-subpageformmultiline" onChange={() => placeholders.noop()} />
              </div>
            </div>
            <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <div style={{"margin":"0 0 6 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                <div className="wpf-grid.columndefinitions">
                  <div style={{"width":"120px"}} className="wpf-columndefinition" />
                  <div className="wpf-columndefinition" />
                </div>
                <span className="wpf-textblock wpf-transactioninlinefieldlabel">{"Transfer Date"} </span>
                <input type="date" style={{"height":"26px"}} className="wpf-datepicker" onChange={() => placeholders.noop()} />
              </div>
              <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                <div className="wpf-grid.columndefinitions">
                  <div style={{"width":"120px"}} className="wpf-columndefinition" />
                  <div className="wpf-columndefinition" />
                </div>
                <span className="wpf-textblock wpf-transactioninlinefieldlabel">{"To Godown"} </span>
                <select style={{"height":"26px"}} className="wpf-combobox wpf-subpageformcombo" />
              </div>
            </div>
          </div>
          <div style={{"margin":"0 0 4 0"}} className="wpf-border wpf-transactionscanbar">
            <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
              <div className="wpf-grid.columndefinitions">
                <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                <div className="wpf-columndefinition" />
              </div>
              <span style={{"margin":"0 8 0 0"}} className="wpf-textblock wpf-salesfieldlabel">{"Barcode / Product"} </span>
              <input type="text" className="wpf-textbox wpf-salescompactinput" onChange={() => placeholders.noop()} />
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
                <div style={{"width":"90px"}} className="wpf-datagridtextcolumn" />
                <div style={{"width":"100px"}} className="wpf-datagridtextcolumn" />
                <div className="wpf-datagridtextcolumn" />
                <div className="wpf-datagridtextcolumn" />
                <div style={{"width":"80px"}} className="wpf-datagridtextcolumn" />
                <div style={{"width":"80px"}} className="wpf-datagridtextcolumn" />
                <div style={{"width":"90px"}} className="wpf-datagridtextcolumn" />
                <div style={{"width":"60px"}} className="wpf-datagridtextcolumn">
                  <div className="wpf-datagridtextcolumn.elementstyle">
                    <div className="wpf-style">
                      <div className="wpf-setter" />
                    </div>
                  </div>
                  <div className="wpf-datagridtextcolumn.editingelementstyle">
                    <div className="wpf-style">
                      <div className="wpf-setter" />
                      <div className="wpf-setter" />
                      <div className="wpf-setter" />
                      <div className="wpf-setter" />
                      <div className="wpf-setter" />
                    </div>
                  </div>
                </div>
                <div style={{"width":"60px"}} className="wpf-datagridtextcolumn">
                  <div className="wpf-datagridtextcolumn.editingelementstyle">
                    <div className="wpf-style">
                      <div className="wpf-setter" />
                      <div className="wpf-setter" />
                      <div className="wpf-setter" />
                      <div className="wpf-setter" />
                    </div>
                  </div>
                </div>
              </div>
            </table>
          </div>
          <div style={{"margin":"10 0 0 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
            <button type="button" style={{"margin":"0 8 0 0","padding":"6 30"}} className="wpf-button wpf-white" onClick={() => placeholders.noop()}>SAVE</button>
            <button type="button" style={{"padding":"6 16"}} className="wpf-button wpf-salessidebuttonsecondary" onClick={() => placeholders.noop()}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default StockTransferView;
