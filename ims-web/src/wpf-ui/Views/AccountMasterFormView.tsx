/* AUTO-GENERATED from WPF: Views/AccountMasterFormView.xaml — UI only; refine for pixel parity */
import './AccountMasterFormView.scss';
import { placeholders } from '../../placeholders';

export interface AccountMasterFormViewProps {
  className?: string;
}

export function AccountMasterFormView({ className }: AccountMasterFormViewProps) {
  return (
    <div className={['wpf-root', 'AccountMasterFormView', className].filter(Boolean).join(' ')} data-wpf-source="Views/AccountMasterFormView.xaml">
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
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                </div>
                <span className="wpf-textblock wpf-subpagesectionheader">{"Account &amp;amp; contact"} </span>
                <div className="wpf-itemscontrol">
                  <div className="wpf-itemscontrol.itemspanel">
                    <div className="wpf-itemspaneltemplate">
                      <div style={{"margin":"6 0 0 0"}} className="wpf-uniformgrid" />
                    </div>
                  </div>
                </div>
                <span style={{"margin":"10 0 4 0"}} className="wpf-textblock wpf-subpagesectionheader">{"Communication"} </span>
                <div className="wpf-itemscontrol">
                  <div className="wpf-itemscontrol.itemspanel">
                    <div className="wpf-itemspaneltemplate">
                      <div style={{"margin":"6 0 0 0"}} className="wpf-uniformgrid" />
                    </div>
                  </div>
                </div>
                <span style={{"margin":"10 0 4 0"}} className="wpf-textblock wpf-subpagesectionheader">{"Tax &amp;amp; registration"} </span>
                <div className="wpf-itemscontrol">
                  <div className="wpf-itemscontrol.itemspanel">
                    <div className="wpf-itemspaneltemplate">
                      <div style={{"margin":"6 0 0 0"}} className="wpf-uniformgrid" />
                    </div>
                  </div>
                </div>
                <div style={{"margin":"8 0 0 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
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
                <span style={{"margin":"10 0 4 0"}} className="wpf-textblock wpf-subpagesectionheader">{"Address &amp;amp; location"} </span>
                <div style={{"margin":"6 0 0 0"}} className="wpf-grid">
                  <div className="wpf-grid.rowdefinitions">
                    <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                    <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  </div>
                  <div style={{"margin":"0 0 8 0"}} className="wpf-contentcontrol">
                    <div className="wpf-contentcontrol.contenttemplate">
                      <div className="wpf-datatemplate">
                        <div className="wpf-border wpf-productmasterfieldcell">
                          <div className="wpf-grid">
                            <div className="wpf-grid.rowdefinitions">
                              <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                              <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                            </div>
                            <span className="wpf-textblock wpf-productmasterfieldlabel">{placeholders.DisplayLabel} </span>
                            <input type="text" className="wpf-textbox wpf-subpageformmultiline" onChange={() => placeholders.noop()} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="wpf-itemscontrol">
                    <div className="wpf-itemscontrol.itemspanel">
                      <div className="wpf-itemspaneltemplate">
                        <div className="wpf-uniformgrid" />
                      </div>
                    </div>
                  </div>
                </div>
                <span style={{"margin":"10 0 4 0"}} className="wpf-textblock wpf-subpagesectionheader">{"Credit &amp;amp; turnover"} </span>
                <div className="wpf-itemscontrol">
                  <div className="wpf-itemscontrol.itemspanel">
                    <div className="wpf-itemspaneltemplate">
                      <div style={{"margin":"6 0 0 0"}} className="wpf-uniformgrid" />
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

export default AccountMasterFormView;
