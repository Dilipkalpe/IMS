/* AUTO-GENERATED from WPF: Views/Controls/ProductScanPickerBar.xaml — UI only; refine for pixel parity */
import './ProductScanPickerBar.scss';
import { placeholders } from '../../../placeholders';

export interface ProductScanPickerBarProps {
  className?: string;
}

export function ProductScanPickerBar({ className }: ProductScanPickerBarProps) {
  return (
    <div className={['wpf-root', 'ProductScanPickerBar', className].filter(Boolean).join(' ')} data-wpf-source="Views/Controls/ProductScanPickerBar.xaml">
    <div className="wpf-usercontrol">
      <div className="wpf-border wpf-transactionscanbar">
        <div className="wpf-grid">
          <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid wpf-name-StandardLayout">
            <div className="wpf-grid.columndefinitions">
              <div style={{"width":"Auto"}} className="wpf-columndefinition" />
              <div style={{"width":"160px"}} className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
              <div style={{"width":"Auto"}} className="wpf-columndefinition" />
            </div>
            <span style={{"margin":"0 8 0 0"}} className="wpf-textblock wpf-salesfieldlabel">{"Barcode scan"} </span>
            <input type="text" style={{"height":"28px"}} className="wpf-textbox wpf-name-BarcodeProductBox wpf-salescompactinput" onChange={() => placeholders.noop()} />
            <div style={{"margin":"0 8 0 8","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <select style={{"height":"28px"}} className="wpf-combobox wpf-name-ProductComboBox wpf-subpageformcombo" />
              <span style={{"margin":"2 0 0 0","fontSize":"10px"}} className="wpf-textblock wpf-textsecondarybrush">{placeholders.ProductSearchStatus} </span>
            </div>
            <button type="button" style={{"padding":"0 12","height":"28px"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Browse…</button>
          </div>
          <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-name-CompactLayout">
            <div style={{"margin":"0 0 4 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
              <div className="wpf-grid.columndefinitions">
                <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                <div className="wpf-columndefinition" />
                <div style={{"width":"Auto"}} className="wpf-columndefinition" />
              </div>
              <span style={{"margin":"0 6 0 0","fontSize":"11px"}} className="wpf-textblock wpf-salesfieldlabel">{"Scan"} </span>
              <input type="text" style={{"height":"26px"}} className="wpf-textbox wpf-name-BarcodeProductBoxCompact wpf-salescompactinput" onChange={() => placeholders.noop()} />
              <button type="button" style={{"margin":"0 0 0 6","padding":"0 8","height":"26px"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Browse…</button>
            </div>
            <select style={{"height":"26px"}} className="wpf-combobox wpf-name-ProductComboBoxCompact wpf-subpageformcombo" />
            <span style={{"margin":"2 0 0 0","fontSize":"10px"}} className="wpf-textblock wpf-textsecondarybrush">{placeholders.ProductSearchStatus} </span>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default ProductScanPickerBar;
