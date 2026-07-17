/* AUTO-GENERATED from WPF: Views/BarcodeLabelPrintDialog.xaml — UI only; refine for pixel parity */
import './BarcodeLabelPrintDialog.scss';
import { placeholders } from '../../placeholders';

export interface BarcodeLabelPrintDialogProps {
  className?: string;
}

export function BarcodeLabelPrintDialog({ className }: BarcodeLabelPrintDialogProps) {
  return (
    <div className={['wpf-root', 'BarcodeLabelPrintDialog', className].filter(Boolean).join(' ')} data-wpf-source="Views/BarcodeLabelPrintDialog.xaml">
    <div style={{"width":"460px","height":"480px"}} className="wpf-window">
      <div style={{"padding":"24"}} className="wpf-border wpf-cardbrush">
        <div className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          </div>
          <span style={{"margin":"0 0 4 0","fontSize":"16px"}} className="wpf-textblock wpf-textprimarybrush">{"Generate barcode labels"} </span>
          <span style={{"margin":"0 0 16 0","fontSize":"13px"}} className="wpf-textblock wpf-name-InvoiceCaption wpf-textsecondarybrush" />
          <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
            <span style={{"margin":"0 0 6 0"}} className="wpf-textblock wpf-formlabel">{"Label format *"} </span>
            <select style={{"margin":"0 0 12 0"}} className="wpf-combobox wpf-name-FormatCombo wpf-formcombo" />
            <span style={{"margin":"0 0 14 0","fontSize":"11px"}} className="wpf-textblock wpf-name-FormatDescription wpf-textsecondarybrush" />
            <span style={{"margin":"0 0 6 0"}} className="wpf-textblock wpf-formlabel">{"Number of copies (optional)"} </span>
            <input type="text" style={{"margin":"0 0 14 0"}} className="wpf-textbox wpf-name-CopiesBox wpf-forminput" onChange={() => placeholders.noop()} />
            <span style={{"margin":"0 0 8 0"}} className="wpf-textblock wpf-formlabel">{"Print quantity source"} </span>
            <div style={{"margin":"0 0 6 0","fontSize":"13px"}} className="wpf-radiobutton wpf-name-PurchaseQtyRadio" />
            <div style={{"margin":"0 0 8 0","fontSize":"13px"}} className="wpf-radiobutton wpf-name-CustomQtyRadio" />
            <div style={{"margin":"0 0 0 20","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid wpf-name-CustomQtyPanel">
              <div className="wpf-grid.columndefinitions">
                <div style={{"width":"140px"}} className="wpf-columndefinition" />
                <div className="wpf-columndefinition" />
              </div>
              <span className="wpf-textblock wpf-formlabel">{"Custom quantity"} </span>
              <input type="text" className="wpf-textbox wpf-name-CustomQtyBox wpf-forminput" onChange={() => placeholders.noop()} />
            </div>
          </div>
          <div style={{"margin":"16 0 0 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
            <button type="button" style={{"margin":"0 8 0 0"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Cancel</button>
            <button type="button" className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()}>Generate Labels</button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default BarcodeLabelPrintDialog;
