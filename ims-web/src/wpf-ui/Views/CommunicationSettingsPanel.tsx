/* AUTO-GENERATED from WPF: Views/CommunicationSettingsPanel.xaml — UI only; refine for pixel parity */
import './CommunicationSettingsPanel.scss';
import { placeholders } from '../../placeholders';

export interface CommunicationSettingsPanelProps {
  className?: string;
}

export function CommunicationSettingsPanel({ className }: CommunicationSettingsPanelProps) {
  return (
    <div className={['wpf-root', 'CommunicationSettingsPanel', className].filter(Boolean).join(' ')} data-wpf-source="Views/CommunicationSettingsPanel.xaml">
    <div className="wpf-usercontrol">
      <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
        <span className="wpf-textblock wpf-sectionheader">{"Communication settings"} </span>
        <span style={{"margin":"0 0 12 0","fontSize":"13px"}} className="wpf-textblock wpf-textsecondarybrush">{"Configure WhatsApp, SMS, and email notifications for sales and purchase invoices. API keys and passwords are encrypted on this computer. Administrator access required."} </span>
        <span style={{"margin":"0 0 12 0","fontSize":"12px"}} className="wpf-textblock wpf--c62828">{"Only administrators can change these settings."} </span>
        <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
          <label style={{"margin":"0 0 10 0","fontSize":"13px"}} className="wpf-checkbox" />
          <label style={{"margin":"0 0 6 0","fontSize":"13px"}} className="wpf-checkbox" />
          <label style={{"margin":"0 0 6 0","fontSize":"13px"}} className="wpf-checkbox" />
          <label style={{"margin":"0 0 12 0","fontSize":"13px"}} className="wpf-checkbox" />
          <label style={{"margin":"0 0 6 0","fontSize":"13px"}} className="wpf-checkbox" />
          <label style={{"margin":"0 0 16 0","fontSize":"13px"}} className="wpf-checkbox" />
          <span style={{"margin":"0 0 8 0","fontSize":"13px"}} className="wpf-textblock">{"WhatsApp"} </span>
          <div style={{"margin":"0 0 8 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div style={{"width":"140px"}} className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
            </div>
            <span className="wpf-textblock wpf-formlabel">{"API URL"} </span>
            <input type="text" className="wpf-textbox wpf-forminput" onChange={() => placeholders.noop()} />
          </div>
          <div style={{"margin":"0 0 8 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div style={{"width":"140px"}} className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
            </div>
            <span className="wpf-textblock wpf-formlabel">{"API key / token"} </span>
            <input type="password" style={{"padding":"6 10","height":"36px"}} className="wpf-passwordbox wpf-name-WhatsAppApiKeyBox" onChange={() => placeholders.noop()} />
          </div>
          <div style={{"margin":"0 0 16 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div style={{"width":"140px"}} className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
            </div>
            <span className="wpf-textblock wpf-formlabel">{"Sender details"} </span>
            <input type="text" className="wpf-textbox wpf-forminput" onChange={() => placeholders.noop()} />
          </div>
          <span style={{"margin":"0 0 8 0","fontSize":"13px"}} className="wpf-textblock">{"SMS"} </span>
          <div style={{"margin":"0 0 8 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div style={{"width":"140px"}} className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
            </div>
            <span className="wpf-textblock wpf-formlabel">{"Gateway URL"} </span>
            <input type="text" className="wpf-textbox wpf-forminput" onChange={() => placeholders.noop()} />
          </div>
          <div style={{"margin":"0 0 8 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div style={{"width":"140px"}} className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
            </div>
            <span className="wpf-textblock wpf-formlabel">{"API key"} </span>
            <input type="password" style={{"padding":"6 10","height":"36px"}} className="wpf-passwordbox wpf-name-SmsApiKeyBox" onChange={() => placeholders.noop()} />
          </div>
          <div style={{"margin":"0 0 16 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div style={{"width":"140px"}} className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
            </div>
            <span className="wpf-textblock wpf-formlabel">{"Sender ID"} </span>
            <input type="text" className="wpf-textbox wpf-forminput" onChange={() => placeholders.noop()} />
          </div>
          <span style={{"margin":"0 0 8 0","fontSize":"13px"}} className="wpf-textblock">{"Email (SMTP)"} </span>
          <div style={{"margin":"0 0 8 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div style={{"width":"140px"}} className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
            </div>
            <span className="wpf-textblock wpf-formlabel">{"SMTP server"} </span>
            <input type="text" className="wpf-textbox wpf-forminput" onChange={() => placeholders.noop()} />
          </div>
          <div style={{"margin":"0 0 8 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div style={{"width":"140px"}} className="wpf-columndefinition" />
              <div style={{"width":"80px"}} className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
            </div>
            <span className="wpf-textblock wpf-formlabel">{"SMTP port"} </span>
            <input type="text" className="wpf-textbox wpf-forminput" onChange={() => placeholders.noop()} />
            <label style={{"margin":"0 0 0 16"}} className="wpf-checkbox" />
          </div>
          <div style={{"margin":"0 0 8 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div style={{"width":"140px"}} className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
            </div>
            <span className="wpf-textblock wpf-formlabel">{"Email address"} </span>
            <input type="text" className="wpf-textbox wpf-forminput" onChange={() => placeholders.noop()} />
          </div>
          <div style={{"margin":"0 0 16 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div style={{"width":"140px"}} className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
            </div>
            <span className="wpf-textblock wpf-formlabel">{"Password"} </span>
            <input type="password" style={{"padding":"6 10","height":"36px"}} className="wpf-passwordbox wpf-name-EmailPasswordBox" onChange={() => placeholders.noop()} />
          </div>
          <span style={{"margin":"0 0 8 0","fontSize":"13px"}} className="wpf-textblock">{"Message templates"} </span>
          <span style={{"margin":"0 0 8 0","fontSize":"11px"}} className="wpf-textblock wpf-textsecondarybrush">{placeholders.PlaceholderHelp} </span>
          <span style={{"margin":"0 0 4 0"}} className="wpf-textblock wpf-formlabel">{"Sales invoice template"} </span>
          <input type="text" style={{"margin":"0 0 12 0"}} className="wpf-textbox wpf-forminput" onChange={() => placeholders.noop()} />
          <span style={{"margin":"0 0 4 0"}} className="wpf-textblock wpf-formlabel">{"Purchase invoice template"} </span>
          <input type="text" style={{"margin":"0 0 12 0"}} className="wpf-textbox wpf-forminput" onChange={() => placeholders.noop()} />
          <div style={{"margin":"0 0 8 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
            <button type="button" style={{"margin":"0 10 0 0","padding":"8 14"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Set None</button>
            <button type="button" style={{"margin":"0 10 0 0","padding":"8 14"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Reset templates</button>
            <button type="button" style={{"padding":"8 14"}} className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()}>Save communication settings</button>
          </div>
          <span style={{"fontSize":"12px"}} className="wpf-textblock wpf-accentbrush">{placeholders.StatusMessage} </span>
          <span style={{"margin":"8 0 0 0","fontSize":"11px"}} className="wpf-textblock wpf-textsecondarybrush">{"Delivery logs: %LocalAppData%\IMS\communication-logs.jsonl"} </span>
        </div>
      </div>
    </div>
    </div>
  );
}

export default CommunicationSettingsPanel;
