/* AUTO-GENERATED from WPF: Views/ImportPageView.xaml — UI only; refine for pixel parity */
import './ImportPageView.scss';
import { placeholders } from '../../placeholders';

export interface ImportPageViewProps {
  className?: string;
}

export function ImportPageView({ className }: ImportPageViewProps) {
  return (
    <div className={['wpf-root', 'ImportPageView', className].filter(Boolean).join(' ')} data-wpf-source="Views/ImportPageView.xaml">
    <div className="wpf-usercontrol wpf-transactionpagebackgroundbrush">
      <div className="wpf-transactionentryshell">
        <div style={{"margin":"4 0 0 0"}} className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div className="wpf-rowdefinition" />
          </div>
          <span style={{"margin":"0 0 12 0"}} className="wpf-textblock wpf-pagesubtitle">{placeholders.PageDescription} </span>
          <div style={{"margin":"0 0 10 0"}} className="wpf-border wpf-dashboardpanelcard">
            <div className="wpf-grid">
              <div className="wpf-grid.rowdefinitions">
                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
              </div>
              <span style={{"margin":"0 0 12 0","fontSize":"12px"}} className="wpf-textblock wpf-textsecondarybrush">{placeholders.StatusMessage} </span>
              <div style={{"margin":"0 0 10 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                <button type="button" style={{"margin":"0 10 0 0","padding":"8 16"}} className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()}>Download Excel Format</button>
                <button type="button" style={{"margin":"0 10 0 0","padding":"8 16"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Browse File…</button>
                <button type="button" style={{"padding":"8 16"}} className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()}>Import Data</button>
              </div>
              <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                <div className="wpf-grid.columndefinitions">
                  <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                  <div className="wpf-columndefinition" />
                  <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                </div>
                <span style={{"margin":"0 8 0 0","fontSize":"12px"}} className="wpf-textblock">{"Selected file:"} </span>
                <input type="text" style={{"margin":"0 10 0 0"}} className="wpf-textbox wpf-forminput" onChange={() => placeholders.noop()} />
                <button type="button" style={{"padding":"8 14"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>&#123;Binding TargetSectionTitle, StringFormat=Open &#123;0&#125;&#125;</button>
              </div>
            </div>
          </div>
          <span style={{"margin":"0 0 8 0","fontSize":"13px"}} className="wpf-textblock wpf-accentbrush">{placeholders.SummaryText} </span>
          <div className="wpf-border wpf-dashboardpanelcard">
            <div className="wpf-dockpanel">
              <span style={{"margin":"0 0 8 0"}} className="wpf-textblock wpf-dashboardpaneltitle">{"Import log"} </span>
              <div className="wpf-scrollviewer">
                <div className="wpf-itemscontrol">
                  <div className="wpf-itemscontrol.itemtemplate">
                    <div className="wpf-datatemplate">
                      <span style={{"margin":"0 0 6 0","fontSize":"12px"}} className="wpf-textblock wpf-textprimarybrush">{"&#123;Binding&#125;"} </span>
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
  );
}

export default ImportPageView;
