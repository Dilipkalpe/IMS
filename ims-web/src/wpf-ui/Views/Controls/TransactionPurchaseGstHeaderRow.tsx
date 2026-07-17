/* AUTO-GENERATED from WPF: Views/Controls/TransactionPurchaseGstHeaderRow.xaml — UI only; refine for pixel parity */
import './TransactionPurchaseGstHeaderRow.scss';
import { placeholders } from '../../../placeholders';

export interface TransactionPurchaseGstHeaderRowProps {
  className?: string;
}

export function TransactionPurchaseGstHeaderRow({ className }: TransactionPurchaseGstHeaderRowProps) {
  return (
    <div className={['wpf-root', 'TransactionPurchaseGstHeaderRow', className].filter(Boolean).join(' ')} data-wpf-source="Views/Controls/TransactionPurchaseGstHeaderRow.xaml">
    <div className="wpf-usercontrol">
      <div style={{"margin":"6 0 0 0"}} className="wpf-uniformgrid">
        <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
          <span className="wpf-textblock wpf-subpageformlabel">{"Seller GSTIN"} </span>
          <input type="text" className="wpf-textbox wpf-panelmutedbrush wpf-subpageforminput" onChange={() => placeholders.noop()} />
        </div>
        <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
          <span className="wpf-textblock wpf-subpageformlabel">{"Supplier GSTIN"} </span>
          <input type="text" className="wpf-textbox wpf-subpageforminput" onChange={() => placeholders.noop()} />
        </div>
        <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
          <span className="wpf-textblock wpf-subpageformlabel">{"Place of Supply"} </span>
          <select className="wpf-combobox wpf-subpageformcombo" />
        </div>
        <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
          <span className="wpf-textblock wpf-subpageformlabel">{"Payment Type"} </span>
          <select className="wpf-combobox wpf-subpageformcombo" />
        </div>
        <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
          <span className="wpf-textblock wpf-subpageformlabel">{"Payment Mode"} </span>
          <select className="wpf-combobox wpf-subpageformcombo" />
        </div>
      </div>
    </div>
    </div>
  );
}

export default TransactionPurchaseGstHeaderRow;
