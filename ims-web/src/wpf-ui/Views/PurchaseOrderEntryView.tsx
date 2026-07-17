/* AUTO-GENERATED from WPF: Views/PurchaseOrderEntryView.xaml — UI only; refine for pixel parity */
import './PurchaseOrderEntryView.scss';
import { placeholders } from '../../placeholders';

export interface PurchaseOrderEntryViewProps {
  className?: string;
}

export function PurchaseOrderEntryView({ className }: PurchaseOrderEntryViewProps) {
  return (
    <div className={['wpf-root', 'PurchaseOrderEntryView', className].filter(Boolean).join(' ')} data-wpf-source="Views/PurchaseOrderEntryView.xaml">
    <div className="wpf-usercontrol wpf-transactionpagebackgroundbrush">
      <div className="wpf-transactionentryshell">
        <div style={{"margin":"0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
          <div className="wpf-grid.columndefinitions">
            <div className="wpf-columndefinition" />
            <div style={{"width":"200px"}} className="wpf-columndefinition" />
          </div>
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          </div>
          <div style={{"margin":"0 6 6 0","padding":"10"}} className="wpf-border wpf-transactionsectionborder">
            <div className="wpf-grid">
              <div className="wpf-grid.rowdefinitions">
                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
              </div>
              <div className="wpf-uniformgrid">
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                  <span className="wpf-textblock wpf-subpageformlabel">{placeholders.PrefixFieldLabel} </span>
                  <input type="text" className="wpf-textbox wpf-name-DocPrefixBox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                </div>
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                  <span className="wpf-textblock wpf-subpageformlabel">{"PO No"} </span>
                  <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                </div>
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                  <span className="wpf-textblock wpf-subpageformlabel">{"PO Date"} </span>
                  <input type="date" style={{"height":"28px"}} className="wpf-datepicker" onChange={() => placeholders.noop()} />
                </div>
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                  <span className="wpf-textblock wpf-subpageformlabel">{"Buyer"} </span>
                  <select className="wpf-combobox wpf-subpageformcombo" />
                </div>
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                  <span className="wpf-textblock wpf-subpageformlabel">{"Supplier Name"} </span>
                  <select className="wpf-combobox wpf-subpageformcombo" />
                </div>
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                  <span className="wpf-textblock wpf-subpageformlabel">{"Payment Terms"} </span>
                  <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                </div>
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                  <span className="wpf-textblock wpf-subpageformlabel">{"Delivery Priority"} </span>
                  <select className="wpf-combobox wpf-subpageformcombo" />
                </div>
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                  <span className="wpf-textblock wpf-subpageformlabel">{"Billing Address"} </span>
                  <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                </div>
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                  <span className="wpf-textblock wpf-subpageformlabel">{"Ship To Address"} </span>
                  <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                </div>
              </div>
              <div className="wpf-transactionpurchasegstheaderrow" />
            </div>
          </div>
          <div style={{"margin":"0 6 6 0"}} className="wpf-salesinvoicelineitemspanel" />
          <div style={{"margin":"0 6 0 0","padding":"10"}} className="wpf-border wpf-transactionsectionborder">
            <div className="wpf-transactionentrybottompanel" />
          </div>
          <div style={{"padding":"8 10"}} className="wpf-border wpf-transactionsectionborder">
            <div className="wpf-transactiongsttotalsrail" />
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default PurchaseOrderEntryView;
