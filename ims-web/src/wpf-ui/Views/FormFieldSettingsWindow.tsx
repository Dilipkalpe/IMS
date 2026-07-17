/* AUTO-GENERATED from WPF: Views/FormFieldSettingsWindow.xaml — UI only; refine for pixel parity */
import './FormFieldSettingsWindow.scss';
import { placeholders } from '../../placeholders';

export interface FormFieldSettingsWindowProps {
  className?: string;
}

export function FormFieldSettingsWindow({ className }: FormFieldSettingsWindowProps) {
  return (
    <div className={['wpf-root', 'FormFieldSettingsWindow', className].filter(Boolean).join(' ')} data-wpf-source="Views/FormFieldSettingsWindow.xaml">
    <div className="wpf-window">
      <div style={{"padding":"20"}} className="wpf-border wpf-transactionpagebackgroundbrush">
        <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
          <span style={{"margin":"0 0 8 0","fontSize":"16px"}} className="wpf-textblock wpf-textprimarybrush">{"Show / hide fields"} </span>
          <span style={{"margin":"0 0 12 0","fontSize":"11px"}} className="wpf-textblock wpf-textsecondarybrush">{"Changes apply immediately. Required fields cannot be hidden."} </span>
          <div style={{"margin":"0 0 12 0"}} className="wpf-wrappanel">
            <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Show all</button>
            <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Hide optional</button>
            <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Reset default</button>
            <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Save layout</button>
          </div>
          <div className="wpf-scrollviewer">
            <div className="wpf-itemscontrol wpf-name-FieldList">
              <div className="wpf-itemscontrol.itemtemplate">
                <div className="wpf-datatemplate">
                  <label style={{"margin":"4 0"}} className="wpf-checkbox" />
                </div>
              </div>
            </div>
          </div>
          <div style={{"margin":"16 0 0 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
            <button type="button" style={{"margin":"0 8 0 0"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Close</button>
            <button type="button" className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Apply &amp;amp; save</button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default FormFieldSettingsWindow;
