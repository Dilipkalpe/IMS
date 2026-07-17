/* AUTO-GENERATED from WPF: Views/Controls/SalesInvoiceLineItemsPanel.xaml — UI only; refine for pixel parity */
import './SalesInvoiceLineItemsPanel.scss';
import { placeholders } from '../../../placeholders';

export interface SalesInvoiceLineItemsPanelProps {
  className?: string;
}

export function SalesInvoiceLineItemsPanel({ className }: SalesInvoiceLineItemsPanelProps) {
  return (
    <div className={['wpf-root', 'SalesInvoiceLineItemsPanel', className].filter(Boolean).join(' ')} data-wpf-source="Views/Controls/SalesInvoiceLineItemsPanel.xaml">
    <div className="wpf-usercontrol">
      <div className="wpf-grid">
        <div className="wpf-grid.rowdefinitions">
          <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          <div className="wpf-rowdefinition" />
        </div>
        <div style={{"margin":"0 0 6 0"}} className="wpf-border wpf-transactionscanbar">
          <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div style={{"width":"Auto"}} className="wpf-columndefinition" />
              <div style={{"width":"180px"}} className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
              <div style={{"width":"Auto"}} className="wpf-columndefinition" />
            </div>
            <span style={{"margin":"0 8 0 0"}} className="wpf-textblock wpf-salesfieldlabel">{"Barcode scan"} </span>
            <input type="text" style={{"height":"28px"}} className="wpf-textbox wpf-name-BarcodeProductBox wpf-salescompactinput" onChange={() => placeholders.noop()} />
            <select style={{"margin":"0 8 0 8","height":"28px"}} className="wpf-combobox wpf-name-ProductComboBox wpf-subpageformcombo" />
            <button type="button" style={{"padding":"0 12","height":"28px"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Browse…</button>
          </div>
        </div>
        <div className="wpf-border wpf-white">
          <table className="wpf-datagrid wpf-name-LineItemsGrid wpf-transactionlinegrid">
            <div className="wpf-datagrid.columnheaderstyle">
              <div className="wpf-style" />
            </div>
            <div className="wpf-datagrid.columns">
              <div style={{"width":"40px"}} className="wpf-datagridtemplatecolumn">
                <div className="wpf-datagridtemplatecolumn.celltemplate">
                  <div className="wpf-datatemplate">
                    <button type="button" style={{"margin":"0 2","padding":"0","width":"28px","height":"24px"}} className="wpf-button wpf-dangerlightbrush" onClick={() => placeholders.noop()} />
                  </div>
                </div>
              </div>
              <div style={{"width":"40px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"90px"}} className="wpf-datagridtextcolumn" />
              <div className="wpf-datagridtextcolumn" />
              <div style={{"width":"60px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"80px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"80px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"80px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"95px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"70px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"85px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"70px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"85px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"70px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"85px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"90px"}} className="wpf-datagridtextcolumn" />
            </div>
          </table>
        </div>
      </div>
    </div>
    </div>
  );
}

export default SalesInvoiceLineItemsPanel;
