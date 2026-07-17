/* AUTO-GENERATED from WPF: Views/ListColumnSettingsWindow.xaml — UI only; refine for pixel parity */
import './ListColumnSettingsWindow.scss';
import { placeholders } from '../../placeholders';

export interface ListColumnSettingsWindowProps {
  className?: string;
}

export function ListColumnSettingsWindow({ className }: ListColumnSettingsWindowProps) {
  return (
    <div className={['wpf-root', 'ListColumnSettingsWindow', className].filter(Boolean).join(' ')} data-wpf-source="Views/ListColumnSettingsWindow.xaml">
    <div className="wpf-window">
      <div style={{"padding":"20"}} className="wpf-border wpf-transactionpagebackgroundbrush">
        <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
          <span style={{"margin":"0 0 12 0","fontSize":"16px"}} className="wpf-textblock wpf-textprimarybrush">{"Show / hide columns"} </span>
          <div className="wpf-itemscontrol wpf-name-ColumnList">
            <div className="wpf-itemscontrol.itemtemplate">
              <div className="wpf-datatemplate">
                <label style={{"margin":"4 0"}} className="wpf-checkbox" />
              </div>
            </div>
          </div>
          <div style={{"margin":"16 0 0 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
            <button type="button" style={{"margin":"0 8 0 0"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Reset</button>
            <button type="button" style={{"margin":"0 8 0 0"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Cancel</button>
            <button type="button" className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Apply</button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default ListColumnSettingsWindow;
