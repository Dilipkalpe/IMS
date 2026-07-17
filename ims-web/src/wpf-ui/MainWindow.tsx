/* AUTO-GENERATED from WPF: MainWindow.xaml — UI only; refine for pixel parity */
import './MainWindow.scss';
import { placeholders } from '../placeholders';

export interface MainWindowProps {
  className?: string;
}

export function MainWindow({ className }: MainWindowProps) {
  return (
    <div className={['wpf-root', 'MainWindow', className].filter(Boolean).join(' ')} data-wpf-source="MainWindow.xaml">
    <div style={{"width":"1280px","height":"780px"}} className="wpf-window wpf-transactionpagebackgroundbrush">
      <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
        <div className="wpf-grid.columndefinitions">
          <div style={{"width":"280px"}} className="wpf-columndefinition" />
          <div className="wpf-columndefinition" />
        </div>
        <div className="wpf-border wpf-sidebarbrush">
          <div className="wpf-dockpanel">
            <div style={{"margin":"24 20 16 20","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                <div style={{"width":"40px","height":"40px"}} className="wpf-border wpf-sidebarselectedbrush">
                  <span style={{"fontSize":"20px"}} className="wpf-textblock wpf-sidebartextbrush wpf-icontext">{"&amp;#xE7B8;"} </span>
                </div>
                <div style={{"margin":"0 0 0 12","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                  <span style={{"fontSize":"20px"}} className="wpf-textblock wpf-sidebartextbrush">{"IMS"} </span>
                  <span style={{"fontSize":"11px"}} className="wpf-textblock wpf-sidebartextmutedbrush">{"Inventory + Production"} </span>
                </div>
              </div>
              <span style={{"margin":"12 0 0 0","fontSize":"11px"}} className="wpf-textblock wpf-sidebartextmutedbrush">{"Inventory Management with Production (BOM)"} </span>
            </div>
            <div style={{"padding":"16"}} className="wpf-border">
              <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                <div style={{"width":"36px","height":"36px"}} className="wpf-border wpf-sidebaractivebrush">
                  <span style={{"fontSize":"16px"}} className="wpf-textblock wpf-sidebartextbrush wpf-icontext">{"&amp;#xE77B;"} </span>
                </div>
                <div style={{"margin":"0 0 0 10","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                  <span style={{"fontSize":"13px"}} className="wpf-textblock wpf-sidebartextbrush">{"services:AuthSession.DisplayName"} </span>
                  <span style={{"fontSize":"11px"}} className="wpf-textblock wpf-sidebartextmutedbrush">{"services:AuthSession.RoleLabel"} </span>
                </div>
              </div>
            </div>
            <div style={{"margin":"0 12 8 12","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span style={{"margin":"0 0 4 0","fontSize":"11px"}} className="wpf-textblock wpf-sidebartextmutedbrush">{"Search menu"} </span>
              <div style={{"margin":"0 0 8 0","padding":"2 4"}} className="wpf-border wpf-sidebaractivebrush">
                <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                  <div className="wpf-grid.columndefinitions">
                    <div style={{"width":"32px"}} className="wpf-columndefinition" />
                    <div className="wpf-columndefinition" />
                    <div style={{"width":"32px"}} className="wpf-columndefinition" />
                  </div>
                  <span style={{"fontSize":"14px"}} className="wpf-textblock wpf-sidebartextbrush wpf-icontext">{"&amp;#xE721;"} </span>
                  <input type="text" className="wpf-textbox wpf-transparent wpf-navsidebarsearchboxinner" onChange={() => placeholders.noop()} />
                  <button type="button" style={{"padding":"0","width":"28px","height":"28px"}} className="wpf-button wpf-navsidebariconbutton" onClick={() => placeholders.noop()} />
                </div>
              </div>
            </div>
            <div style={{"padding":"0 12 12 12"}} className="wpf-scrollviewer">
              <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                <div style={{"margin":"0 0 10 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                  <button type="button" className="wpf-button wpf-navsidebartoolbutton" onClick={() => placeholders.noop()} />
                  <button type="button" style={{"margin":"0 0 0 8"}} className="wpf-button wpf-navsidebartoolbutton" onClick={() => placeholders.noop()} />
                </div>
                <div className="wpf-itemscontrol">
                  <div className="wpf-itemscontrol.itemtemplate">
                    <div className="wpf-datatemplate">
                      <div style={{"margin":"0 0 4 0","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                        <button type="button" style={{"margin":"8 0 2 0"}} className="wpf-button wpf-navsectionheaderbutton" onClick={() => placeholders.noop()} />
                        <div className="wpf-itemscontrol">
                          <div className="wpf-itemscontrol.itemtemplate">
                            <div className="wpf-datatemplate">
                              <div style={{"margin":"2 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                                <div className="wpf-grid.columndefinitions">
                                  <div className="wpf-columndefinition" />
                                  <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                                </div>
                                <button type="button" className="wpf-button" onClick={() => placeholders.noop()} />
                                <button type="button" style={{"margin":"0 2 0 0"}} className="wpf-button wpf-navpinbutton" onClick={() => placeholders.noop()} />
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
            <div style={{"padding":"0 12 12 12"}} className="wpf-scrollviewer">
              <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                <span style={{"margin":"12 8","fontSize":"12px"}} className="wpf-textblock wpf-sidebartextmutedbrush">{"No matching menu items"} </span>
                <div className="wpf-itemscontrol">
                  <div className="wpf-itemscontrol.itemtemplate">
                    <div className="wpf-datatemplate">
                      <button type="button" style={{"margin":"2 0"}} className="wpf-button wpf-navbutton" onClick={() => placeholders.noop()} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div className="wpf-rowdefinition" />
          </div>
          <div style={{"padding":"14 24"}} className="wpf-border wpf-name-ContentHeader wpf-headerbarbrush">
            <div className="wpf-border.style">
              <div className="wpf-style">
                <div className="wpf-setter" />
                <div className="wpf-style.triggers">
                  <div className="wpf-datatrigger">
                    <div className="wpf-setter" />
                  </div>
                </div>
              </div>
            </div>
            <div className="wpf-grid">
              <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                <button type="button" style={{"margin":"0 8 0 0","padding":"6"}} className="wpf-button wpf-panelmutedbrush" onClick={() => placeholders.noop()} />
                <span style={{"margin":"0 8 0 0","fontSize":"14px"}} className="wpf-textblock wpf-textonlightbrush wpf-icontext">{"&amp;#xE80F;"} </span>
                <span style={{"fontSize":"13px"}} className="wpf-textblock wpf-textonlightbrush">{"IMS Desktop"} </span>
                <span className="wpf-textblock wpf-borderbrush">{"  /  "} </span>
                <span style={{"fontSize":"13px"}} className="wpf-textblock wpf-textonlightbrush">{placeholders.HeaderTitle} </span>
                <span className="wpf-textblock wpf-borderbrush">{"  /  "} </span>
                <span style={{"fontSize":"13px"}} className="wpf-textblock wpf-textonlightbrush">{placeholders.SubPageTitle} </span>
              </div>
              <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                <div style={{"margin":"0 8 0 0"}} className="wpf-border wpf-toolbarbadge">
                  <span style={{"fontSize":"11px"}} className="wpf-textblock wpf-accentbrush">{placeholders.ThemeBadgeText} </span>
                </div>
                <button type="button" style={{"padding":"8"}} className="wpf-button wpf-panelmutedbrush wpf-navbutton" onClick={() => placeholders.noop()} />
              </div>
            </div>
          </div>
          <div style={{"padding":"0"}} className="wpf-border wpf-name-ContentHost">
            <div className="wpf-contentcontrol" />
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default MainWindow;
