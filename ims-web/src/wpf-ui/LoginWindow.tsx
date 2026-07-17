/* AUTO-GENERATED from WPF: LoginWindow.xaml — UI only; refine for pixel parity */
import './LoginWindow.scss';
import { placeholders } from '../placeholders';

export interface LoginWindowProps {
  className?: string;
}

export function LoginWindow({ className }: LoginWindowProps) {
  return (
    <div className={['wpf-root', 'LoginWindow', className].filter(Boolean).join(' ')} data-wpf-source="LoginWindow.xaml">
    <div style={{"width":"1100px","height":"780px"}} className="wpf-window">
      <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid wpf-name-RootGrid wpf-loginpagebackground">
        <div className="wpf-grid.columndefinitions">
          <div className="wpf-columndefinition" />
          <div className="wpf-columndefinition" />
        </div>
        <div className="wpf-grid">
          <div style={{"margin":"-80 0 0 -120","width":"420px","height":"420px"}} className="wpf-ellipse">
            <div className="wpf-ellipse.fill">
              <div className="wpf-radialgradientbrush">
                <div className="wpf-gradientstop" />
                <div className="wpf-gradientstop" />
              </div>
            </div>
            <div className="wpf-ellipse.effect">
              <div className="wpf-blureffect" />
            </div>
          </div>
        </div>
        <div style={{"padding":"44 48"}} className="wpf-border wpf-loginherogradient">
          <div className="wpf-grid">
            <div className="wpf-grid.rowdefinitions">
              <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
              <div className="wpf-rowdefinition" />
              <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            </div>
            <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <div style={{"margin":"0 0 22 0","width":"68px","height":"68px"}} className="wpf-border">
                <div className="wpf-border.background">
                  <div className="wpf-lineargradientbrush">
                    <div className="wpf-gradientstop" />
                    <div className="wpf-gradientstop" />
                  </div>
                </div>
                <span style={{"fontSize":"20px"}} className="wpf-textblock wpf-white">{"IMS"} </span>
              </div>
              <span className="wpf-textblock wpf-logineyebrow">{"INVENTORY &amp;amp; BILLING ERP"} </span>
              <span className="wpf-textblock wpf-loginherotitle">{"Run your entire"} </span>
              <span style={{"margin":"-4 0 0 0"}} className="wpf-textblock wpf-loginheroaccent">{"operations from one place"} </span>
              <span style={{"margin":"14 0 0 0","fontSize":"15px"}} className="wpf-textblock wpf--94a3b8">{placeholders.CompanyTagline} </span>
            </div>
            <div style={{"margin":"20 0 0 0","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <div className="wpf-wrappanel">
                <div className="wpf-border wpf-loginmodulepill">
                  <span className="wpf-textblock wpf-loginmodulepilltext">{"◈  Inventory"} </span>
                </div>
                <div className="wpf-border wpf-loginmodulepill">
                  <span className="wpf-textblock wpf-loginmodulepilltext">{"◎  Billing"} </span>
                </div>
                <div className="wpf-border wpf-loginmodulepill">
                  <span className="wpf-textblock wpf-loginmodulepilltext">{"⬡  Production"} </span>
                </div>
                <div className="wpf-border wpf-loginmodulepill">
                  <span className="wpf-textblock wpf-loginmodulepilltext">{"◇  Finance"} </span>
                </div>
              </div>
              <div style={{"margin":"32 0 0 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                <div className="wpf-grid.columndefinitions">
                  <div className="wpf-columndefinition" />
                  <div className="wpf-columndefinition" />
                  <div className="wpf-columndefinition" />
                </div>
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                  <span style={{"fontSize":"22px"}} className="wpf-textblock wpf-white">{"24/7"} </span>
                  <span style={{"margin":"4 0 0 0","fontSize":"10px"}} className="wpf-textblock wpf--64748b">{"LIVE STOCK SYNC"} </span>
                </div>
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                  <span style={{"fontSize":"22px"}} className="wpf-textblock wpf-white">{"GST"} </span>
                  <span style={{"margin":"4 0 0 0","fontSize":"10px"}} className="wpf-textblock wpf--64748b">{"READY INVOICING"} </span>
                </div>
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                  <span style={{"fontSize":"22px"}} className="wpf-textblock wpf-white">{"Multi"} </span>
                  <span style={{"margin":"4 0 0 0","fontSize":"10px"}} className="wpf-textblock wpf--64748b">{"WAREHOUSE"} </span>
                </div>
              </div>
            </div>
            <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <div style={{"margin":"0 0 6 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                <div style={{"margin":"0 8 0 0","width":"8px","height":"8px"}} className="wpf-ellipse" />
                <span style={{"fontSize":"12px"}} className="wpf-textblock wpf--818cf8">{"Enterprise-grade · Secure sign-in"} </span>
              </div>
              <div style={{"margin":"8 0 0 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                <div className="wpf-grid.columndefinitions">
                  <div style={{"width":"72px"}} className="wpf-columndefinition" />
                  <div className="wpf-columndefinition" />
                </div>
                <div className="wpf-grid.rowdefinitions">
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                </div>
                <span style={{"fontSize":"11px"}} className="wpf-textblock wpf--64748b">{"API Link"} </span>
                <span style={{"fontSize":"11px"}} className="wpf-textblock wpf--94a3b8">{placeholders.ApiLinkDisplay} </span>
                <span style={{"margin":"6 0 0 0","fontSize":"11px"}} className="wpf-textblock wpf--64748b">{"Db Name"} </span>
                <span style={{"margin":"6 0 0 0","fontSize":"11px"}} className="wpf-textblock wpf--94a3b8">{placeholders.DbNameDisplay} </span>
              </div>
            </div>
          </div>
        </div>
        <div style={{"margin":"24 28"}} className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div className="wpf-rowdefinition" />
          </div>
          <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
            <button type="button" className="wpf-button wpf-loginghostbutton" onClick={() => placeholders.noop()} />
            <button type="button" style={{"margin":"0 0 0 10"}} className="wpf-button wpf-loginclosebutton" onClick={() => placeholders.noop()} />
          </div>
          <div style={{"width":"460px"}} className="wpf-border wpf-loginglasscard">
            <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span style={{"fontSize":"32px"}} className="wpf-textblock wpf-logintextbrush">{"Sign in"} </span>
              <span style={{"margin":"8 0 28 0","fontSize":"16px"}} className="wpf-textblock wpf-logintextmutedbrush">{placeholders.CompanyName} </span>
              <div style={{"margin":"0 0 12 0","padding":"6 10"}} className="wpf-border">
                <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                  <div style={{"margin":"0 8 0 0","width":"8px","height":"8px"}} className="wpf-ellipse">
                    <div className="wpf-ellipse.style">
                      <div className="wpf-style">
                        <div className="wpf-setter" />
                        <div className="wpf-style.triggers">
                          <div className="wpf-datatrigger">
                            <div className="wpf-setter" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span style={{"fontSize":"12px"}} className="wpf-textblock wpf-logintextmutedbrush">{placeholders.ApiStatusText} </span>
                </div>
              </div>
              <div style={{"margin":"0 0 16 0","padding":"10 12"}} className="wpf-border wpf-loginerrorbgbrush">
                <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                  <span style={{"margin":"0 8 0 0","fontSize":"14px"}} className="wpf-textblock wpf-loginerrorbrush wpf-icontext">{"&amp;#xE783;"} </span>
                  <span style={{"fontSize":"13px"}} className="wpf-textblock wpf-loginerrorbrush">{placeholders.ErrorMessage} </span>
                </div>
              </div>
              <span className="wpf-textblock wpf-loginfieldlabel">{"FINANCIAL YEAR"} </span>
              <div style={{"margin":"0 0 12 0","height":"54px"}} className="wpf-border">
                <select style={{"padding":"0 12","fontSize":"16px"}} className="wpf-combobox wpf-transparent wpf--x-null" />
              </div>
              <span className="wpf-textblock wpf-loginfieldlabel">{"EMPLOYEE ID OR EMAIL"} </span>
              <div style={{"height":"54px"}} className="wpf-border wpf-name-LoginIdBorder">
                <input type="text" style={{"padding":"0 16","fontSize":"16px"}} className="wpf-textbox wpf-name-LoginIdBox wpf-transparent wpf--x-null" onChange={() => placeholders.noop()} />
              </div>
              <span style={{"margin":"20 0 0 0"}} className="wpf-textblock wpf-loginfieldlabel">{"PASSWORD"} </span>
              <div style={{"margin":"0 0 4 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                <div className="wpf-grid.columndefinitions">
                  <div className="wpf-columndefinition" />
                  <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                </div>
                <div style={{"height":"54px"}} className="wpf-border wpf-name-PasswordBorder">
                  <input type="password" style={{"padding":"0 16","fontSize":"16px"}} className="wpf-passwordbox wpf-name-PasswordBox wpf-transparent wpf--x-null" onChange={() => placeholders.noop()} />
                </div>
                <div style={{"height":"54px"}} className="wpf-border wpf-name-PasswordTextBorder">
                  <input type="text" style={{"padding":"0 16","fontSize":"16px"}} className="wpf-textbox wpf-name-PasswordTextBox wpf-transparent wpf--x-null" onChange={() => placeholders.noop()} />
                </div>
                <button type="button" style={{"margin":"0 0 0 10"}} className="wpf-button wpf-loginiconbutton" onClick={() => placeholders.noop()} />
              </div>
              <div style={{"margin":"22 0 26 0"}} className="wpf-grid">
                <label style={{"fontSize":"15px"}} className="wpf-checkbox wpf-logintextbrush" />
              </div>
              <button type="button" style={{"height":"56px"}} className="wpf-button wpf-name-SignInButton wpf-loginprimarybutton" onClick={() => placeholders.noop()} />
              <span style={{"margin":"22 0 0 0","fontSize":"11px"}} className="wpf-textblock wpf-logintextmutedbrush">{"Protected workspace. Contact your administrator for access."} </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default LoginWindow;
