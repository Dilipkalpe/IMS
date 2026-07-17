/* AUTO-GENERATED from WPF: Views/Controls/TransactionSalesGstHeaderRow.xaml — UI only; refine for pixel parity */
import './TransactionSalesGstHeaderRow.scss';
import { placeholders } from '../../../placeholders';

export interface TransactionSalesGstHeaderRowProps {
  className?: string;
}

export function TransactionSalesGstHeaderRow({ className }: TransactionSalesGstHeaderRowProps) {
  return (
    <div className={['wpf-root', 'TransactionSalesGstHeaderRow', className].filter(Boolean).join(' ')} data-wpf-source="Views/Controls/TransactionSalesGstHeaderRow.xaml">
    <div className="wpf-usercontrol">
      <div style={{"margin":"6 0 0 0"}} className="wpf-uniformgrid">
        <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
          <span className="wpf-textblock wpf-subpageformlabel">{"Seller GSTIN"} </span>
          <input type="text" className="wpf-textbox wpf-panelmutedbrush wpf-subpageforminput" onChange={() => placeholders.noop()} />
        </div>
        <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
          <span className="wpf-textblock wpf-subpageformlabel">{"Customer GSTIN"} </span>
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

export default TransactionSalesGstHeaderRow;
