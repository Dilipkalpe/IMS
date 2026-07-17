/* AUTO-GENERATED from WPF: Views/DebitNoteEntryView.xaml — UI only; refine for pixel parity */
import './DebitNoteEntryView.scss';
import { placeholders } from '../../placeholders';

export interface DebitNoteEntryViewProps {
  className?: string;
}

export function DebitNoteEntryView({ className }: DebitNoteEntryViewProps) {
  return (
    <div className={['wpf-root', 'DebitNoteEntryView', className].filter(Boolean).join(' ')} data-wpf-source="Views/DebitNoteEntryView.xaml">
    <div className="wpf-usercontrol wpf-transactionpagebackgroundbrush">
      <div className="wpf-transactionentryshell">
        <div className="wpf-transactionentryshell.titlerightheader">
          <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
            <span style={{"margin":"0 8 0 0"}} className="wpf-textblock wpf-transactioninlinefieldlabel">{"Voucher type"} </span>
            <div style={{"padding":"4 10"}} className="wpf-border wpf-mockbadge">
              <span style={{"fontSize":"12px"}} className="wpf-textblock wpf-dangerbrush">{placeholders.VoucherTypeLabel} </span>
            </div>
          </div>
        </div>
        <div style={{"margin":"0"}} className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div className="wpf-rowdefinition" />
          </div>
          <span style={{"margin":"0 0 10 0"}} className="wpf-textblock wpf-pagesubtitle">{placeholders.PageDescription} </span>
          <div style={{"padding":"10 12"}} className="wpf-border wpf-transactionsectionborder">
            <div className="wpf-grid">
              <div className="wpf-grid.rowdefinitions">
                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
              </div>
              <div className="wpf-scrollviewer">
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                  <span className="wpf-textblock wpf-subpagesectionheader">{"Voucher details"} </span>
                  <div style={{"margin":"0 0 6 0"}} className="wpf-uniformgrid">
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                      <span className="wpf-textblock wpf-subpageformlabel">{"Voucher No *"} </span>
                      <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                    </div>
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                      <span className="wpf-textblock wpf-subpageformlabel">{"Ref. No"} </span>
                      <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                    </div>
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                      <span className="wpf-textblock wpf-subpageformlabel">{"Date *"} </span>
                      <input type="date" style={{"height":"28px"}} className="wpf-datepicker" onChange={() => placeholders.noop()} />
                    </div>
                  </div>
                  <span className="wpf-textblock wpf-subpagesectionheader">{"Account"} </span>
                  <div style={{"margin":"0 8 6 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                    <div className="wpf-grid.columndefinitions">
                      <div className="wpf-columndefinition" />
                      <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                      <div className="wpf-columndefinition" />
                    </div>
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                      <span className="wpf-textblock wpf-subpageformlabel">{"Account code"} </span>
                      <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                    </div>
                    <button type="button" style={{"margin":"0 8 6 0","height":"28px"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Look up</button>
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                      <span className="wpf-textblock wpf-subpageformlabel">{"Account name"} </span>
                      <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                    </div>
                  </div>
                  <span className="wpf-textblock wpf-subpagesectionheader">{"Amount &amp;amp; tax"} </span>
                  <div style={{"margin":"0 0 6 0"}} className="wpf-uniformgrid">
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                      <span className="wpf-textblock wpf-subpageformlabel">{"Amount *"} </span>
                      <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                    </div>
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                      <span className="wpf-textblock wpf-subpageformlabel">{"GST Rate %"} </span>
                      <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                    </div>
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                      <span className="wpf-textblock wpf-subpageformlabel">{"Total amount"} </span>
                      <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
                    </div>
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                      <label style={{"margin":"20 0 0 0"}} className="wpf-checkbox wpf-textprimarybrush" />
                    </div>
                  </div>
                  <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                    <span className="wpf-textblock wpf-subpageformlabel">{"Narration"} </span>
                    <input type="text" style={{"height":"56px"}} className="wpf-textbox wpf-subpageformmultiline" onChange={() => placeholders.noop()} />
                  </div>
                  <label style={{"margin":"4 0 0 0"}} className="wpf-checkbox wpf-textsecondarybrush" />
                </div>
              </div>
              <div style={{"margin":"8 0 0 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                <button type="button" style={{"margin":"0 10 0 0"}} className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()} />
                <button type="button" className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()} />
              </div>
              <span className="wpf-textblock wpf-subpagefooternote">{"Total amount = Amount + GST. Save posts to MongoDB unless “Clear form after save” is checked."} </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default DebitNoteEntryView;
