/* AUTO-GENERATED from WPF: Views/SalesOrderListView.xaml — UI only; refine for pixel parity */
import './SalesOrderListView.scss';
import { placeholders } from '../../placeholders';

export interface SalesOrderListViewProps {
  className?: string;
}

export function SalesOrderListView({ className }: SalesOrderListViewProps) {
  return (
    <div className={['wpf-root', 'SalesOrderListView', className].filter(Boolean).join(' ')} data-wpf-source="Views/SalesOrderListView.xaml">
    <div className="wpf-usercontrol wpf-name-Root wpf-contentbackgroundbrush">
      <div className="wpf-transactionentryshell">
        <div className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div className="wpf-rowdefinition" />
          </div>
          <div className="wpf-border wpf-transactionpagebackgroundbrush">
            <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span style={{"fontSize":"16px"}} className="wpf-textblock wpf-textprimarybrush">{"Loading…"} </span>
              <span style={{"margin":"6 0 0 0","fontSize":"12px"}} className="wpf-textblock wpf-textsecondarybrush">{placeholders.LoadingSubtitle} </span>
            </div>
          </div>
          <div style={{"margin":"0 0 6 0"}} className="wpf-itemscontrol">
            <div className="wpf-itemscontrol.itemspanel">
              <div className="wpf-itemspaneltemplate">
                <div className="wpf-uniformgrid" />
              </div>
            </div>
            <div className="wpf-itemscontrol.itemtemplate">
              <div className="wpf-datatemplate">
                <div style={{"margin":"0 8 0 0"}} className="wpf-border">
                  <div className="wpf-border.style">
                    <div className="wpf-style">
                      <div className="wpf-setter" />
                      <div className="wpf-setter" />
                      <div className="wpf-style.triggers">
                        <div className="wpf-datatrigger">
                          <div className="wpf-setter" />
                        </div>
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
                          <div className="wpf-style.triggers">
                            <div className="wpf-datatrigger">
                              <div className="wpf-setter" />
                              <div className="wpf-setter" />
                              <div className="wpf-setter" />
                              <div className="wpf-setter" />
                              <div className="wpf-setter" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <span className="wpf-textblock">
                        <div className="wpf-textblock.style">
                          <div className="wpf-style">
                            <div className="wpf-style.triggers">
                              <div className="wpf-datatrigger">
                                <div className="wpf-setter" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={{"margin":"0 0 4 0","padding":"6 8"}} className="wpf-border wpf-solistsectionborder">
            <div className="wpf-grid">
              <div className="wpf-grid.rowdefinitions">
                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
              </div>
              <div style={{"margin":"0 0 4 0"}} className="wpf-wrappanel">
                <div style={{"margin":"0 8 8 0"}} className="wpf-itemscontrol">
                  <div className="wpf-itemscontrol.itemspanel">
                    <div className="wpf-itemspaneltemplate">
                      <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel" />
                    </div>
                  </div>
                  <div className="wpf-itemscontrol.itemtemplate">
                    <div className="wpf-datatemplate">
                      <button type="button" style={{"margin":"0 8 0 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()} />
                    </div>
                  </div>
                </div>
                <input type="text" style={{"margin":"0 8 8 0","padding":"6 8","width":"220px","fontSize":"13px"}} className="wpf-textbox" onChange={() => placeholders.noop()} />
                <select style={{"margin":"0 8 8 0","width":"140px"}} className="wpf-combobox wpf-formcombo" />
                <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Refresh</button>
                <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Manage Columns</button>
                <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-name-ExportDataButton wpf-actionbutton" onClick={() => placeholders.noop()} />
              </div>
              <span style={{"fontSize":"12px"}} className="wpf-textblock wpf-textsecondarybrush">{placeholders.StatusMessage} </span>
            </div>
          </div>
          <div className="wpf-popup wpf-name-ExportDataPopup">
            <div style={{"padding":"4"}} className="wpf-border wpf-name-ExportDataMenuHost wpf-cardbrush">
              <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                <button type="button" style={{"margin":"0 0 2 0","padding":"6 12"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Excel</button>
                <button type="button" style={{"margin":"0 0 2 0","padding":"6 12"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>PDF</button>
                <button type="button" style={{"padding":"6 12"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Print</button>
              </div>
            </div>
          </div>
          <div style={{"padding":"1"}} className="wpf-border wpf-solistsectionborder">
            <div className="wpf-grid">
              <div className="wpf-grid.rowdefinitions">
                <div className="wpf-rowdefinition" />
                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
              </div>
              <table className="wpf-datagrid wpf-name-OrdersGrid wpf-solistordersgrid">
                <div className="wpf-datagrid.columns">
                  <div style={{"width":"52px"}} className="wpf-datagridtextcolumn wpf-name-ColSr">
                    <div className="wpf-datagridtextcolumn.elementstyle">
                      <div className="wpf-style">
                        <div className="wpf-setter" />
                        <div className="wpf-setter" />
                      </div>
                    </div>
                    <div className="wpf-datagridtextcolumn.header">
                      <button type="button" className="wpf-button wpf-solistsortheader" onClick={() => placeholders.noop()} />
                    </div>
                  </div>
                  <div style={{"width":"128px"}} className="wpf-datagridtemplatecolumn wpf-name-ColActions">
                    <div className="wpf-datagridtemplatecolumn.celltemplate">
                      <div className="wpf-datatemplate">
                        <div style={{"margin":"6 4","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                          <button type="button" className="wpf-button wpf-solistactionprintbutton" onClick={() => placeholders.noop()} />
                          <button type="button" className="wpf-button wpf-solistactioneditbutton" onClick={() => placeholders.noop()} />
                          <button type="button" className="wpf-button wpf-solistactiondeletebutton" onClick={() => placeholders.noop()} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{"width":"120px"}} className="wpf-datagridtextcolumn wpf-name-ColSoNo">
                    <div className="wpf-datagridtextcolumn.elementstyle">
                      <div className="wpf-style">
                        <div className="wpf-setter" />
                      </div>
                    </div>
                    <div className="wpf-datagridtextcolumn.header">
                      <button type="button" className="wpf-button wpf-solistsortheader" onClick={() => placeholders.noop()} />
                    </div>
                  </div>
                  <div style={{"width":"108px"}} className="wpf-datagridtextcolumn wpf-name-ColSoDate">
                    <div className="wpf-datagridtextcolumn.elementstyle">
                      <div className="wpf-style">
                        <div className="wpf-setter" />
                      </div>
                    </div>
                    <div className="wpf-datagridtextcolumn.header">
                      <button type="button" className="wpf-button wpf-solistsortheader" onClick={() => placeholders.noop()} />
                    </div>
                  </div>
                  <div className="wpf-datagridtextcolumn wpf-name-ColCustomer">
                    <div className="wpf-datagridtextcolumn.elementstyle">
                      <div className="wpf-style" />
                    </div>
                    <div className="wpf-datagridtextcolumn.header">
                      <button type="button" className="wpf-button wpf-solistsortheader" onClick={() => placeholders.noop()} />
                    </div>
                  </div>
                  <div style={{"width":"130px"}} className="wpf-datagridtextcolumn wpf-name-ColTotalTaxable">
                    <div className="wpf-datagridtextcolumn.elementstyle">
                      <div className="wpf-style" />
                    </div>
                    <div className="wpf-datagridtextcolumn.header">
                      <button type="button" className="wpf-button wpf-solistsortheader" onClick={() => placeholders.noop()} />
                    </div>
                  </div>
                  <div style={{"width":"100px"}} className="wpf-datagridtextcolumn wpf-name-ColTotalCgst">
                    <div className="wpf-datagridtextcolumn.elementstyle">
                      <div className="wpf-style" />
                    </div>
                    <div className="wpf-datagridtextcolumn.header">
                      <button type="button" className="wpf-button wpf-solistsortheader" onClick={() => placeholders.noop()} />
                    </div>
                  </div>
                  <div style={{"width":"100px"}} className="wpf-datagridtextcolumn wpf-name-ColTotalSgst">
                    <div className="wpf-datagridtextcolumn.elementstyle">
                      <div className="wpf-style" />
                    </div>
                    <div className="wpf-datagridtextcolumn.header">
                      <button type="button" className="wpf-button wpf-solistsortheader" onClick={() => placeholders.noop()} />
                    </div>
                  </div>
                  <div style={{"width":"100px"}} className="wpf-datagridtextcolumn wpf-name-ColTotalIgst">
                    <div className="wpf-datagridtextcolumn.elementstyle">
                      <div className="wpf-style" />
                    </div>
                    <div className="wpf-datagridtextcolumn.header">
                      <button type="button" className="wpf-button wpf-solistsortheader" onClick={() => placeholders.noop()} />
                    </div>
                  </div>
                  <div style={{"width":"110px"}} className="wpf-datagridtextcolumn wpf-name-ColTotalDiscount">
                    <div className="wpf-datagridtextcolumn.elementstyle">
                      <div className="wpf-style" />
                    </div>
                    <div className="wpf-datagridtextcolumn.header">
                      <button type="button" className="wpf-button wpf-solistsortheader" onClick={() => placeholders.noop()} />
                    </div>
                  </div>
                  <div style={{"width":"100px"}} className="wpf-datagridtextcolumn wpf-name-ColSalesAmt">
                    <div className="wpf-datagridtextcolumn.elementstyle">
                      <div className="wpf-style" />
                    </div>
                    <div className="wpf-datagridtextcolumn.header">
                      <button type="button" className="wpf-button wpf-solistsortheader" onClick={() => placeholders.noop()} />
                    </div>
                  </div>
                  <div style={{"width":"100px"}} className="wpf-datagridtextcolumn wpf-name-ColPaidAmt">
                    <div className="wpf-datagridtextcolumn.elementstyle">
                      <div className="wpf-style" />
                    </div>
                    <div className="wpf-datagridtextcolumn.header">
                      <button type="button" className="wpf-button wpf-solistsortheader" onClick={() => placeholders.noop()} />
                    </div>
                  </div>
                  <div style={{"width":"100px"}} className="wpf-datagridtextcolumn wpf-name-ColBalance">
                    <div className="wpf-datagridtextcolumn.elementstyle">
                      <div className="wpf-style" />
                    </div>
                    <div className="wpf-datagridtextcolumn.header">
                      <button type="button" className="wpf-button wpf-solistsortheader" onClick={() => placeholders.noop()} />
                    </div>
                  </div>
                  <div style={{"width":"100px"}} className="wpf-datagridtextcolumn wpf-name-ColStatus">
                    <div className="wpf-datagridtextcolumn.elementstyle">
                      <div className="wpf-style">
                        <div className="wpf-setter" />
                      </div>
                    </div>
                    <div className="wpf-datagridtextcolumn.header">
                      <button type="button" className="wpf-button wpf-solistsortheader" onClick={() => placeholders.noop()} />
                    </div>
                  </div>
                </div>
              </table>
              <span style={{"fontSize":"15px"}} className="wpf-textblock wpf-textsecondarybrush">{"No sales orders found."} </span>
              <div style={{"margin":"0 12 12 12"}} className="wpf-paginationbar" />
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default SalesOrderListView;
