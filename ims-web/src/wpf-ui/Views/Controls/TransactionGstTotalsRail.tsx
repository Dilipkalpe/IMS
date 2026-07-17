/* AUTO-GENERATED from WPF: Views/Controls/TransactionGstTotalsRail.xaml — UI only; refine for pixel parity */
import './TransactionGstTotalsRail.scss';
import { placeholders } from '../../../placeholders';

export interface TransactionGstTotalsRailProps {
  className?: string;
}

export function TransactionGstTotalsRail({ className }: TransactionGstTotalsRailProps) {
  return (
    <div className={['wpf-root', 'TransactionGstTotalsRail', className].filter(Boolean).join(' ')} data-wpf-source="Views/Controls/TransactionGstTotalsRail.xaml">
    <div className="wpf-usercontrol">
      <div className="wpf-scrollviewer">
        <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
          <span style={{"margin":"0 0 6 0","fontSize":"11px"}} className="wpf-textblock wpf-sectionheader">{"Totals + Payment"} </span>
          <span style={{"fontSize":"11px"}} className="wpf-textblock wpf-salesfieldlabel">{"Total Taxable Value"} </span>
          <input type="text" style={{"margin":"2 0 6 0"}} className="wpf-textbox wpf-panelmutedbrush wpf-salescompactinput" onChange={() => placeholders.noop()} />
          <span style={{"fontSize":"11px"}} className="wpf-textblock wpf-salesfieldlabel">{"Total CGST"} </span>
          <input type="text" style={{"margin":"2 0 6 0"}} className="wpf-textbox wpf-panelmutedbrush wpf-salescompactinput" onChange={() => placeholders.noop()} />
          <span style={{"fontSize":"11px"}} className="wpf-textblock wpf-salesfieldlabel">{"Total SGST"} </span>
          <input type="text" style={{"margin":"2 0 6 0"}} className="wpf-textbox wpf-panelmutedbrush wpf-salescompactinput" onChange={() => placeholders.noop()} />
          <span style={{"fontSize":"11px"}} className="wpf-textblock wpf-salesfieldlabel">{"Total IGST"} </span>
          <input type="text" style={{"margin":"2 0 6 0"}} className="wpf-textbox wpf-panelmutedbrush wpf-salescompactinput" onChange={() => placeholders.noop()} />
          <span style={{"fontSize":"11px"}} className="wpf-textblock wpf-salesfieldlabel">{"Total Discount"} </span>
          <input type="text" style={{"margin":"2 0 6 0"}} className="wpf-textbox wpf-panelmutedbrush wpf-salescompactinput" onChange={() => placeholders.noop()} />
          <span style={{"fontSize":"11px"}} className="wpf-textblock wpf-salesfieldlabel">{placeholders.DocumentTotalLabel} </span>
          <input type="text" style={{"margin":"2 0 6 0"}} className="wpf-textbox wpf-accentlightbrush wpf-salescompactinput" onChange={() => placeholders.noop()} />
          <span style={{"fontSize":"11px"}} className="wpf-textblock wpf-salesfieldlabel">{"Paid"} </span>
          <input type="text" style={{"margin":"2 0 6 0"}} className="wpf-textbox wpf-panelmutedbrush wpf-salescompactinput" onChange={() => placeholders.noop()} />
          <span style={{"fontSize":"11px"}} className="wpf-textblock wpf-salesfieldlabel">{"Balance"} </span>
          <input type="text" style={{"margin":"2 0 6 0"}} className="wpf-textbox wpf-accentlightbrush wpf-salescompactinput" onChange={() => placeholders.noop()} />
          <span style={{"fontSize":"11px"}} className="wpf-textblock wpf-salesfieldlabel">{"Round Off"} </span>
          <input type="text" style={{"margin":"2 0 0 0"}} className="wpf-textbox wpf-panelmutedbrush wpf-salescompactinput" onChange={() => placeholders.noop()} />
        </div>
      </div>
    </div>
    </div>
  );
}

export default TransactionGstTotalsRail;
