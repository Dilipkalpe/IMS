/* AUTO-GENERATED from WPF: Views/ProductMasterFormView.xaml — UI only; refine for pixel parity */
import './ProductMasterFormView.scss';
import { placeholders } from '../../placeholders';

export interface ProductMasterFormViewProps {
  className?: string;
}

export function ProductMasterFormView({ className }: ProductMasterFormViewProps) {
  return (
    <div className={['wpf-root', 'ProductMasterFormView', className].filter(Boolean).join(' ')} data-wpf-source="Views/ProductMasterFormView.xaml">
    <div className="wpf-usercontrol wpf-transactionpagebackgroundbrush">
      <div className="wpf-transactionentryshell">
        <div style={{"margin":"0"}} className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div className="wpf-rowdefinition" />
          </div>
          <span style={{"margin":"0 0 10 0"}} className="wpf-textblock wpf-pagesubtitle">{placeholders.PageDescription} </span>
          <div style={{"margin":"0 0 10 0"}} className="wpf-wrappanel">
            <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Manage fields</button>
            <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Show all</button>
            <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Hide optional</button>
            <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Reset layout</button>
            <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Save layout</button>
          </div>
          <div style={{"padding":"10 12"}} className="wpf-border wpf-transactionsectionborder">
            <div className="wpf-scrollviewer">
              <div className="wpf-grid">
                <div className="wpf-grid.rowdefinitions">
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                </div>
                <span className="wpf-textblock wpf-subpagesectionheader">{"Basic information"} </span>
                <div className="wpf-itemscontrol">
                  <div className="wpf-itemscontrol.itemspanel">
                    <div className="wpf-itemspaneltemplate">
                      <div style={{"margin":"6 0 0 0"}} className="wpf-uniformgrid" />
                    </div>
                  </div>
                </div>
                <span style={{"margin":"10 0 4 0"}} className="wpf-textblock wpf-subpagesectionheader">{"Pricing, quantity &amp;amp; tax"} </span>
                <div className="wpf-itemscontrol">
                  <div className="wpf-itemscontrol.itemspanel">
                    <div className="wpf-itemspaneltemplate">
                      <div style={{"margin":"6 0 0 0"}} className="wpf-uniformgrid" />
                    </div>
                  </div>
                </div>
                <span style={{"margin":"10 0 4 0"}} className="wpf-textblock wpf-subpagesectionheader">{"Classification &amp;amp; UOM + image &amp;amp; options"} </span>
                <div style={{"margin":"6 0 0 0"}} className="wpf-grid">
                  <div className="wpf-grid.rowdefinitions">
                    <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                    <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                    <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  </div>
                  <span style={{"margin":"0 0 6 0","fontSize":"12px"}} className="wpf-textblock wpf-textsecondarybrush">{"Classification &amp;amp; UOM"} </span>
                  <div className="wpf-itemscontrol">
                    <div className="wpf-itemscontrol.itemspanel">
                      <div className="wpf-itemspaneltemplate">
                        <div style={{"margin":"0 0 6 0"}} className="wpf-uniformgrid" />
                      </div>
                    </div>
                  </div>
                  <div style={{"margin":"6 0 0 0"}} className="wpf-grid">
                    <div className="wpf-grid.rowdefinitions">
                      <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                      <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                    </div>
                    <span style={{"margin":"0 0 6 0","fontSize":"12px"}} className="wpf-textblock wpf-textsecondarybrush">{"Image &amp;amp; options"} </span>
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                      <span style={{"margin":"0 0 4 0"}} className="wpf-textblock wpf-subpageformlabel">{"Product image path"} </span>
                      <div style={{"margin":"0 0 8 0"}} className="wpf-contentcontrol">
                        <div className="wpf-contentcontrol.contenttemplate">
                          <div className="wpf-datatemplate">
                            <div className="wpf-grid">
                              <div className="wpf-grid.rowdefinitions">
                                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                              </div>
                              <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                              <button type="button" style={{"margin":"6 0 0 0","height":"30px"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Browse image</button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                        <div style={{"margin":"0 24 0 0"}} className="wpf-contentcontrol">
                          <div className="wpf-contentcontrol.contenttemplate">
                            <div className="wpf-datatemplate">
                              <label style={{"fontSize":"11px"}} className="wpf-checkbox" />
                            </div>
                          </div>
                        </div>
                        <div style={{"margin":"0 24 0 0"}} className="wpf-contentcontrol">
                          <div className="wpf-contentcontrol.contenttemplate">
                            <div className="wpf-datatemplate">
                              <label style={{"fontSize":"11px"}} className="wpf-checkbox" />
                            </div>
                          </div>
                        </div>
                        <div className="wpf-contentcontrol">
                          <div className="wpf-contentcontrol.contenttemplate">
                            <div className="wpf-datatemplate">
                              <label style={{"fontSize":"11px"}} className="wpf-checkbox" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{"margin":"16 0 0 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                  <button type="button" style={{"margin":"0 10 0 0"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()} />
                  <button type="button" className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default ProductMasterFormView;
