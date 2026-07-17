/* AUTO-GENERATED from WPF: Views/StandardReportView.xaml — UI only; refine for pixel parity */
import './StandardReportView.scss';
import { placeholders } from '../../placeholders';

export interface StandardReportViewProps {
  className?: string;
}

export function StandardReportView({ className }: StandardReportViewProps) {
  return (
    <div className={['wpf-root', 'StandardReportView', className].filter(Boolean).join(' ')} data-wpf-source="Views/StandardReportView.xaml">
    <div className="wpf-usercontrol wpf-name-ReportRoot wpf-contentbackgroundbrush">
      <div className="wpf-transactionentryshell">
        <div className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          </div>
          <div style={{"margin":"0 0 6 0","padding":"8 10"}} className="wpf-border wpf-solistsectionborder">
            <div className="wpf-contentpresenter" />
          </div>
          <span style={{"margin":"0 0 6 0","fontSize":"12px"}} className="wpf-textblock wpf-textsecondarybrush">{placeholders.SummaryText} </span>
          <div style={{"margin":"0 0 6 0"}} className="wpf-wrappanel">
            <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-name-ManageColumnsButton wpf-actionbutton" onClick={() => placeholders.noop()}>Manage Columns</button>
            <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-name-ExportDataButton wpf-actionbutton" onClick={() => placeholders.noop()} />
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
              <div className="wpf-contentpresenter wpf-name-GridHost" />
              <div className="wpf-border wpf-listbusyloadinghost">
                <div className="wpf-listloadingoverlay" />
              </div>
            </div>
          </div>
          <div style={{"margin":"8 0 0 0"}} className="wpf-contentpresenter" />
        </div>
      </div>
    </div>
    </div>
  );
}

export default StandardReportView;
