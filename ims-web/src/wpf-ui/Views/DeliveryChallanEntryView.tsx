/* AUTO-GENERATED from WPF: Views/DeliveryChallanEntryView.xaml — UI only; refine for pixel parity */
import './DeliveryChallanEntryView.scss';
import { placeholders } from '../../placeholders';

export interface DeliveryChallanEntryViewProps {
  className?: string;
}

export function DeliveryChallanEntryView({ className }: DeliveryChallanEntryViewProps) {
  return (
    <div className={['wpf-root', 'DeliveryChallanEntryView', className].filter(Boolean).join(' ')} data-wpf-source="Views/DeliveryChallanEntryView.xaml">
    <div className="wpf-usercontrol wpf-transactionpagebackgroundbrush">
      <div className="wpf-usercontrol.inputbindings">
        <div className="wpf-keybinding" />
        <div className="wpf-keybinding" />
        <div className="wpf-keybinding" />
      </div>
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
                  <span className="wpf-textblock wpf-subpageformlabel">{"DC No"} </span>
                  <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                </div>
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                  <span className="wpf-textblock wpf-subpageformlabel">{"Customer Name"} </span>
                  <select className="wpf-combobox wpf-subpageformcombo" />
                </div>
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                  <span className="wpf-textblock wpf-subpageformlabel">{"DC Date"} </span>
                  <input type="date" style={{"height":"28px"}} className="wpf-datepicker" onChange={() => placeholders.noop()} />
                </div>
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                  <span className="wpf-textblock wpf-subpageformlabel">{"SO Reference"} </span>
                  <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                </div>
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                  <span className="wpf-textblock wpf-subpageformlabel">{"Warehouse"} </span>
                  <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                </div>
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                  <span className="wpf-textblock wpf-subpageformlabel">{"Vehicle No"} </span>
                  <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                </div>
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                  <span className="wpf-textblock wpf-subpageformlabel">{"Transporter"} </span>
                  <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                </div>
              </div>
              <div className="wpf-transactionsalesgstheaderrow" />
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

export default DeliveryChallanEntryView;
