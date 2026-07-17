/* AUTO-GENERATED from WPF: Views/BillFormatDesignerView.xaml — UI only; refine for pixel parity */
import './BillFormatDesignerView.scss';
import { placeholders } from '../../placeholders';

export interface BillFormatDesignerViewProps {
  className?: string;
}

export function BillFormatDesignerView({ className }: BillFormatDesignerViewProps) {
  return (
    <div className={['wpf-root', 'BillFormatDesignerView', className].filter(Boolean).join(' ')} data-wpf-source="Views/BillFormatDesignerView.xaml">
    <div className="wpf-usercontrol wpf--dce4ec">
      <div className="wpf-transactionentryshell">
        <div className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          </div>
          <div style={{"padding":"4 6"}} className="wpf-border wpf--2c3e50">
            <div className="wpf-dockpanel">
              <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                <button type="button" style={{"margin":"0 6 0 0","padding":"4 10"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Print Preview</button>
                <button type="button" style={{"margin":"0 6 0 0","padding":"4 10"}} className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()} />
                <button type="button" style={{"margin":"0 12 0 0","padding":"4 10"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()} />
                <span style={{"margin":"0 6 0 0","fontSize":"11px"}} className="wpf-textblock wpf--e2e8f0">{"Paper:"} </span>
                <select style={{"width":"140px"}} className="wpf-combobox wpf-subpageformcombo" />
                <span style={{"margin":"0 6 0 12","fontSize":"11px"}} className="wpf-textblock wpf--e2e8f0">{"Zoom:"} </span>
                <select style={{"width":"72px"}} className="wpf-combobox wpf-subpageformcombo" />
              </div>
              <span style={{"fontSize":"11px"}} className="wpf-textblock wpf--cbd5e1">{placeholders.FormatSummary} </span>
            </div>
          </div>
          <span style={{"margin":"4 8","fontSize":"11px"}} className="wpf-textblock wpf--475569">{placeholders.FormatContextLine} </span>
          <div style={{"margin":"4","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div style={{"width":"240px"}} className="wpf-columndefinition" />
              <div style={{"width":"4px"}} className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
              <div style={{"width":"4px"}} className="wpf-columndefinition" />
              <div style={{"width":"272px"}} className="wpf-columndefinition" />
            </div>
            <div className="wpf-border wpf--f1f5f9">
              <div className="wpf-dockpanel">
                <div style={{"padding":"5 8"}} className="wpf-border wpf--475569">
                  <span style={{"fontSize":"12px"}} className="wpf-textblock wpf-white">{"Field Explorer"} </span>
                </div>
                <div style={{"padding":"6"}} className="wpf-scrollviewer">
                  <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                    <div style={{"margin":"0 0 8 0"}} className="wpf-treeview wpf-name-ExplorerTree wpf-transparent" />
                    <button type="button" style={{"margin":"0 0 8 0","padding":"4 8","fontSize":"11px"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Add item details to layout</button>
                    <span style={{"margin":"0 0 6 0","fontSize":"10px"}} className="wpf-textblock wpf--64748b">{"Detail columns — loaded from Settings → Manage columns (gridcolumnglobaldefaults, same module as transaction type)"} </span>
                    <span style={{"margin":"4 0 4 0","fontSize":"11px"}} className="wpf-textblock">{"Detail columns (check to show on print)"} </span>
                    <span style={{"margin":"0 0 6 0","fontSize":"10px"}} className="wpf-textblock wpf--64748b">{"No columns loaded — open format again or click Add item details."} </span>
                    <div className="wpf-itemscontrol">
                      <div className="wpf-itemscontrol.itemtemplate">
                        <div className="wpf-datatemplate">
                          <label style={{"margin":"2 0","fontSize":"11px"}} className="wpf-checkbox" />
                        </div>
                      </div>
                    </div>
                    <span style={{"margin":"10 0 4 0","fontSize":"11px"}} className="wpf-textblock">{"Bill options"} </span>
                    <label style={{"margin":"2 0","fontSize":"11px"}} className="wpf-checkbox" />
                    <label style={{"margin":"2 0","fontSize":"11px"}} className="wpf-checkbox" />
                    <label style={{"margin":"2 0","fontSize":"11px"}} className="wpf-checkbox" />
                    <label style={{"margin":"2 0","fontSize":"11px"}} className="wpf-checkbox" />
                    <label style={{"margin":"2 0","fontSize":"11px"}} className="wpf-checkbox" />
                  </div>
                </div>
              </div>
            </div>
            <div style={{"width":"4px"}} className="wpf-gridsplitter wpf--94a3b8" />
            <div className="wpf-border wpf--64748b">
              <div className="wpf-dockpanel">
                <div style={{"padding":"5 8"}} className="wpf-border wpf--1e293b">
                  <span style={{"fontSize":"12px"}} className="wpf-textblock wpf--e2e8f0">{"Design — drag fields to position; click to select"} </span>
                </div>
                <div style={{"padding":"16"}} className="wpf-scrollviewer wpf--94a3b8">
                  <div style={{"width":"{Binding DesignPageWidth}","height":"{Binding DesignPageHeight}"}} className="wpf-border wpf-white">
                    <div className="wpf-itemscontrol">
                      <div className="wpf-itemscontrol.itemspanel">
                        <div className="wpf-itemspaneltemplate">
                          <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel" />
                        </div>
                      </div>
                      <div className="wpf-itemscontrol.itemtemplate">
                        <div className="wpf-datatemplate">
                          <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                            <div className="wpf-border wpf--binding-headercolor wpf-crystalbandheader">
                              <span style={{"fontSize":"11px"}} className="wpf-textblock wpf-white">{placeholders.Title} </span>
                            </div>
                            <div className="wpf-border wpf--fafafa">
                              <div className="wpf-canvas wpf-name-BandCanvas wpf-transparent">
                                <div className="wpf-itemscontrol">
                                  <div className="wpf-itemscontrol.itemspanel">
                                    <div className="wpf-itemspaneltemplate">
                                      <div className="wpf-canvas" />
                                    </div>
                                  </div>
                                  <div className="wpf-itemscontrol.itemtemplate">
                                    <div className="wpf-datatemplate">
                                      <div className="wpf-border wpf-crystalfieldbox">
                                        <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                                          <span style={{"fontSize":"11px"}} className="wpf-textblock">{placeholders.Label} </span>
                                          <span style={{"fontSize":"9px"}} className="wpf-textblock wpf--64748b">{placeholders.Text} </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{"width":"4px"}} className="wpf-gridsplitter wpf--94a3b8" />
            <div className="wpf-border wpf--f8fafc">
              <div className="wpf-dockpanel">
                <div style={{"padding":"5 8"}} className="wpf-border wpf--475569">
                  <span style={{"fontSize":"12px"}} className="wpf-textblock wpf-white">{"Properties"} </span>
                </div>
                <div style={{"padding":"10"}} className="wpf-scrollviewer">
                  <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                    <span className="wpf-textblock wpf-subpageformlabel">{"Object"} </span>
                    <input type="text" style={{"margin":"0 0 8 0"}} className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                    <span className="wpf-textblock wpf-subpageformlabel">{"Text / formula"} </span>
                    <input type="text" style={{"margin":"0 0 8 0","height":"48px"}} className="wpf-textbox wpf-subpageformmultiline" onChange={() => placeholders.noop()} />
                    <div style={{"margin":"0 0 8 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                      <div className="wpf-grid.columndefinitions">
                        <div className="wpf-columndefinition" />
                        <div style={{"width":"8px"}} className="wpf-columndefinition" />
                        <div className="wpf-columndefinition" />
                      </div>
                      <div className="wpf-grid.rowdefinitions">
                        <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                        <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                        <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                        <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                      </div>
                      <span className="wpf-textblock wpf-subpageformlabel">{"Left %"} </span>
                      <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                      <span className="wpf-textblock wpf-subpageformlabel">{"Top %"} </span>
                      <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                      <span style={{"margin":"6 0 0 0"}} className="wpf-textblock wpf-subpageformlabel">{"Width %"} </span>
                      <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                      <span style={{"margin":"6 0 0 0"}} className="wpf-textblock wpf-subpageformlabel">{"Height %"} </span>
                      <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                    </div>
                    <span className="wpf-textblock wpf-subpageformlabel">{"Font size (pt)"} </span>
                    <input type="text" style={{"margin":"0 0 8 0"}} className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                    <span className="wpf-textblock wpf-subpageformlabel">{"Alignment"} </span>
                    <select style={{"margin":"0 0 8 0"}} className="wpf-combobox wpf-subpageformcombo" />
                    <label style={{"margin":"0 0 8 0"}} className="wpf-checkbox" />
                    <label className="wpf-checkbox" />
                    <button type="button" style={{"margin":"12 0 0 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Remove object</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={{"margin":"4 4 0 4","padding":"4 8"}} className="wpf-border wpf--e2e8f0">
            <div className="wpf-dockpanel">
              <span style={{"fontSize":"11px"}} className="wpf-textblock wpf--334155">{placeholders.StatusMessage} </span>
              <span style={{"fontSize":"11px"}} className="wpf-textblock wpf--64748b">{placeholders.PageSizeLabel} </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default BillFormatDesignerView;
