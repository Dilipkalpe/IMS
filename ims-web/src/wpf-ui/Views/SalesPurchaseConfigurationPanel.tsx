/* AUTO-GENERATED from WPF: Views/SalesPurchaseConfigurationPanel.xaml — UI only; refine for pixel parity */
import './SalesPurchaseConfigurationPanel.scss';
import { placeholders } from '../../placeholders';

export interface SalesPurchaseConfigurationPanelProps {
  className?: string;
}

export function SalesPurchaseConfigurationPanel({ className }: SalesPurchaseConfigurationPanelProps) {
  return (
    <div className={['wpf-root', 'SalesPurchaseConfigurationPanel', className].filter(Boolean).join(' ')} data-wpf-source="Views/SalesPurchaseConfigurationPanel.xaml">
    <div className="wpf-usercontrol">
      <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
        <span className="wpf-textblock wpf-sectionheader">{"Sales / Purchase configuration"} </span>
        <span style={{"margin":"0 0 12 0","fontSize":"13px"}} className="wpf-textblock wpf-textsecondarybrush">{"Choose where the sales invoice line rate comes from when you add a product. Saved invoices keep their existing rates until you add or change lines."} </span>
        <span style={{"margin":"0 0 12 0","fontSize":"12px"}} className="wpf-textblock wpf--c62828">{"Only administrators can change this setting."} </span>
        <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
          <span style={{"margin":"0 0 8 0"}} className="wpf-textblock wpf-formlabel">{"Sales rate source"} </span>
          <div style={{"margin":"0 0 8 0","padding":"8 10"}} className="wpf-border wpf-cardbrush">
            <div className="wpf-radiobutton">
              <div style={{"margin":"0 0 0 4","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                <span style={{"fontSize":"13px"}} className="wpf-textblock">{"Product Master"} </span>
                <span style={{"margin":"4 0 0 0","fontSize":"12px"}} className="wpf-textblock wpf-textsecondarybrush">{"Use the sale price from the product master when adding lines to a sales invoice."} </span>
              </div>
            </div>
          </div>
          <div style={{"margin":"0 0 12 0","padding":"8 10"}} className="wpf-border wpf-cardbrush">
            <div className="wpf-radiobutton">
              <div style={{"margin":"0 0 0 4","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                <span style={{"fontSize":"13px"}} className="wpf-textblock">{"Purchase Invoice"} </span>
                <span style={{"margin":"4 0 0 0","fontSize":"12px"}} className="wpf-textblock wpf-textsecondarybrush">{"Use the sale rate from the most recent purchase invoice line for that product."} </span>
              </div>
            </div>
          </div>
          <div style={{"margin":"0 0 8 0"}} className="wpf-border wpf-highlightpanel">
            <span style={{"fontSize":"12px"}} className="wpf-textblock wpf-accentbrush">{placeholders.ActiveSourceSummary} </span>
          </div>
          <span style={{"fontSize":"12px"}} className="wpf-textblock wpf-accentbrush">{placeholders.StatusMessage} </span>
        </div>
      </div>
    </div>
    </div>
  );
}

export default SalesPurchaseConfigurationPanel;
