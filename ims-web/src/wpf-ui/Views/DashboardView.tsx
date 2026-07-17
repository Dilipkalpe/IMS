/* AUTO-GENERATED from WPF: Views/DashboardView.xaml — UI only; refine for pixel parity */
import './DashboardView.scss';
import { placeholders } from '../../placeholders';

export interface DashboardViewProps {
  className?: string;
}

export function DashboardView({ className }: DashboardViewProps) {
  return (
    <div className={['wpf-root', 'DashboardView', className].filter(Boolean).join(' ')} data-wpf-source="Views/DashboardView.xaml">
    <div className="wpf-usercontrol wpf-transactionpagebackgroundbrush">
      <div className="wpf-transactionentryshell">
        <div className="wpf-transactionentryshell.titlerightheader">
          <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
            <span style={{"margin":"0 6 0 0","fontSize":"10px"}} className="wpf-textblock wpf-textsecondarybrush">{placeholders.LastRefreshed} </span>
            <button type="button" style={{"padding":"3 8","fontSize":"11px"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Refresh</button>
          </div>
        </div>
        <div className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div className="wpf-rowdefinition" />
          </div>
          <div className="wpf-border wpf-transactionpagebackgroundbrush">
            <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span style={{"fontSize":"16px"}} className="wpf-textblock wpf-textprimarybrush">{"Loading dashboard…"} </span>
              <span style={{"margin":"4 0 0 0","fontSize":"12px"}} className="wpf-textblock wpf-textsecondarybrush">{"Fetching live figures from the API"} </span>
            </div>
          </div>
          <div style={{"margin":"0 0 4 0","padding":"8 10"}} className="wpf-border wpf-dangerlightbrush">
            <span style={{"fontSize":"12px"}} className="wpf-textblock">{placeholders.ApiStatusMessage} </span>
          </div>
          <div style={{"margin":"2 0 6 0"}} className="wpf-itemscontrol">
            <div className="wpf-itemscontrol.itemspanel">
              <div className="wpf-itemspaneltemplate">
                <div className="wpf-uniformgrid" />
              </div>
            </div>
            <div className="wpf-itemscontrol.itemcontainerstyle">
              <div className="wpf-style">
                <div className="wpf-setter" />
                <div className="wpf-setter" />
                <div className="wpf-setter" />
              </div>
            </div>
            <div className="wpf-itemscontrol.itemtemplate">
              <div className="wpf-datatemplate">
                <div className="wpf-statcountercard" />
              </div>
            </div>
          </div>
          <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
            </div>
            <div style={{"margin":"0 6 0 0"}} className="wpf-border wpf-dashboardpanelcard">
              <div className="wpf-dockpanel">
                <div className="wpf-border wpf-dashboardsectionheader">
                  <span className="wpf-textblock wpf-dashboardsectiontitle">{"Accounting Overview"} </span>
                </div>
                <div style={{"margin":"0 0 8 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                  <div className="wpf-grid.columndefinitions">
                    <div className="wpf-columndefinition" />
                    <div className="wpf-columndefinition" />
                  </div>
                  <div className="wpf-grid.rowdefinitions">
                    <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                    <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  </div>
                  <div style={{"margin":"0 6 6 0"}} className="wpf-border wpf-dashboardinnercard">
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                      <span className="wpf-textblock wpf-dashboardmetriclabel">{placeholders.Col1} </span>
                      <span className="wpf-textblock wpf-dashboardmetricvalue">{placeholders.Col2} </span>
                    </div>
                  </div>
                  <div style={{"margin":"0 0 6 6"}} className="wpf-border wpf-dashboardinnercard">
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                      <span className="wpf-textblock wpf-dashboardmetriclabel">{placeholders.Col1} </span>
                      <span className="wpf-textblock wpf-dashboardmetricvalue">{placeholders.Col2} </span>
                    </div>
                  </div>
                  <div style={{"margin":"6 6 0 0"}} className="wpf-border wpf-dashboardinnercard">
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                      <span className="wpf-textblock wpf-dashboardmetriclabel">{placeholders.Col1} </span>
                      <span className="wpf-textblock wpf-dashboardmetricvalue">{placeholders.Col2} </span>
                    </div>
                  </div>
                  <div style={{"margin":"6 0 0 6"}} className="wpf-border wpf-dashboardinnercard">
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                      <span className="wpf-textblock wpf-dashboardmetriclabel">{placeholders.Col1} </span>
                      <span className="wpf-textblock wpf-dashboardmetricvalue">{placeholders.Col2} </span>
                    </div>
                  </div>
                </div>
                <div style={{"margin":"8 0 0 0"}} className="wpf-uniformgrid">
                  <button type="button" style={{"margin":"0 4 0 0","padding":"6 8"}} className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()} />
                  <button type="button" style={{"margin":"0 2","padding":"6 8"}} className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()} />
                  <button type="button" style={{"margin":"0 0 0 4","padding":"6 8"}} className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()} />
                </div>
                <div style={{"margin":"4 0 0 0"}} className="wpf-dashboardbarchart" />
              </div>
            </div>
            <div style={{"margin":"0 3"}} className="wpf-border wpf-dashboardpanelcard">
              <div className="wpf-dockpanel">
                <div className="wpf-border wpf-dashboardsectionheader">
                  <span className="wpf-textblock wpf-dashboardsectiontitle">{"Inventory Management"} </span>
                </div>
                <div style={{"margin":"0 0 8 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                  <div className="wpf-grid.columndefinitions">
                    <div className="wpf-columndefinition" />
                    <div className="wpf-columndefinition" />
                  </div>
                  <div className="wpf-grid.rowdefinitions">
                    <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                    <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  </div>
                  <div style={{"margin":"0 6 6 0"}} className="wpf-border wpf-dashboardinnercard">
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                      <span className="wpf-textblock wpf-dashboardmetriclabel">{placeholders.Label} </span>
                      <span className="wpf-textblock wpf-dashboardmetricvalue">{placeholders.Value} </span>
                    </div>
                  </div>
                  <div style={{"margin":"0 0 6 6"}} className="wpf-border wpf-dashboardinnercard">
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                      <span className="wpf-textblock wpf-dashboardmetriclabel">{placeholders.Label} </span>
                      <span className="wpf-textblock wpf-dashboardmetricvalue">{placeholders.Value} </span>
                    </div>
                  </div>
                  <div style={{"margin":"6 6 0 0"}} className="wpf-border wpf-dashboardinnercard">
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                      <span className="wpf-textblock wpf-dashboardmetriclabel">{placeholders.Label} </span>
                      <span className="wpf-textblock wpf-dashboardmetricvalue">{placeholders.Value} </span>
                    </div>
                  </div>
                  <div style={{"margin":"6 0 0 6"}} className="wpf-border wpf-dashboardinnercard">
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                      <span className="wpf-textblock wpf-dashboardmetriclabel">{placeholders.Label} </span>
                      <span className="wpf-textblock wpf-dashboardmetricvalue">{placeholders.Value} </span>
                    </div>
                  </div>
                </div>
                <div style={{"margin":"8 0 0 0"}} className="wpf-uniformgrid">
                  <button type="button" style={{"margin":"0 4 0 0","padding":"6 8"}} className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()} />
                  <button type="button" style={{"margin":"0 2","padding":"6 8"}} className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()} />
                  <button type="button" style={{"margin":"0 0 0 4","padding":"6 8"}} className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()} />
                </div>
                <div style={{"margin":"4 0 0 0"}} className="wpf-dashboardlinechart" />
              </div>
            </div>
            <div style={{"margin":"0 0 0 6"}} className="wpf-border wpf-dashboardpanelcard">
              <div className="wpf-dockpanel">
                <div className="wpf-border wpf-dashboardsectionheader">
                  <span className="wpf-textblock wpf-dashboardsectiontitle">{"Production Status"} </span>
                </div>
                <div style={{"margin":"0 0 8 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                  <div className="wpf-grid.columndefinitions">
                    <div className="wpf-columndefinition" />
                    <div className="wpf-columndefinition" />
                  </div>
                  <div className="wpf-grid.rowdefinitions">
                    <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                    <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                  </div>
                  <div style={{"margin":"0 6 6 0"}} className="wpf-border wpf-dashboardinnercard">
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                      <span className="wpf-textblock wpf-dashboardmetriclabel">{placeholders.Title} </span>
                      <span className="wpf-textblock wpf-dashboardmetricvalue">{placeholders.Detail} </span>
                    </div>
                  </div>
                  <div style={{"margin":"0 0 6 6"}} className="wpf-border wpf-dashboardinnercard">
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                      <span className="wpf-textblock wpf-dashboardmetriclabel">{placeholders.Title} </span>
                      <span className="wpf-textblock wpf-dashboardmetricvalue">{placeholders.Detail} </span>
                    </div>
                  </div>
                  <div style={{"margin":"6 6 0 0"}} className="wpf-border wpf-dashboardinnercard">
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                      <span className="wpf-textblock wpf-dashboardmetriclabel">{placeholders.Title} </span>
                      <span className="wpf-textblock wpf-dashboardmetricvalue">{placeholders.Detail} </span>
                    </div>
                  </div>
                  <div style={{"margin":"6 0 0 6"}} className="wpf-border wpf-dashboardinnercard">
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                      <span className="wpf-textblock wpf-dashboardmetriclabel">{placeholders.Title} </span>
                      <span className="wpf-textblock wpf-dashboardmetricvalue">{placeholders.Detail} </span>
                    </div>
                  </div>
                </div>
                <div style={{"margin":"8 0 0 0"}} className="wpf-uniformgrid">
                  <button type="button" style={{"margin":"0 4 0 0","padding":"6 8"}} className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()} />
                  <button type="button" style={{"margin":"0 2","padding":"6 8"}} className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()} />
                  <button type="button" style={{"margin":"0 0 0 4","padding":"6 8"}} className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()} />
                </div>
                <div style={{"margin":"4 0 0 0"}} className="wpf-dashboarddonutchart" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default DashboardView;
