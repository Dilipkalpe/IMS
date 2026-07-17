/* AUTO-GENERATED from WPF: Views/FinancialYearManagementView.xaml — UI only; refine for pixel parity */
import './FinancialYearManagementView.scss';
import { placeholders } from '../../placeholders';

export interface FinancialYearManagementViewProps {
  className?: string;
}

export function FinancialYearManagementView({ className }: FinancialYearManagementViewProps) {
  return (
    <div className={['wpf-root', 'FinancialYearManagementView', className].filter(Boolean).join(' ')} data-wpf-source="Views/FinancialYearManagementView.xaml">
    <div className="wpf-usercontrol wpf-transactionpagebackgroundbrush">
      <div className="wpf-transactionentryshell">
        <div className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          </div>
          <span style={{"margin":"0 0 10 0"}} className="wpf-textblock wpf-pagesubtitle">{placeholders.Description} </span>
          <div style={{"margin":"0 0 10 0"}} className="wpf-wrappanel">
            <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Refresh</button>
            <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Create year</button>
            <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Run year-end</button>
            <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Delete year</button>
          </div>
          <div style={{"padding":"10 12"}} className="wpf-border wpf-transactionsectionborder">
            <table className="wpf-datagrid">
              <div className="wpf-datagrid.columns">
                <div className="wpf-datagridtextcolumn" />
                <div style={{"width":"140px"}} className="wpf-datagridtextcolumn" />
                <div style={{"width":"140px"}} className="wpf-datagridtextcolumn" />
                <div style={{"width":"160px"}} className="wpf-datagridtextcolumn" />
                <div style={{"width":"90px"}} className="wpf-datagridcheckboxcolumn" />
                <div style={{"width":"90px"}} className="wpf-datagridcheckboxcolumn" />
              </div>
            </table>
          </div>
          <span style={{"margin":"10 0 0 0"}} className="wpf-textblock wpf-textsecondarybrush">{placeholders.StatusMessage} </span>
        </div>
      </div>
    </div>
    </div>
  );
}

export default FinancialYearManagementView;
