/* AUTO-GENERATED from WPF: Views/MasterPickWindow.xaml — UI only; refine for pixel parity */
import './MasterPickWindow.scss';
import { placeholders } from '../../placeholders';

export interface MasterPickWindowProps {
  className?: string;
}

export function MasterPickWindow({ className }: MasterPickWindowProps) {
  return (
    <div className={['wpf-root', 'MasterPickWindow', className].filter(Boolean).join(' ')} data-wpf-source="Views/MasterPickWindow.xaml">
    <div style={{"width":"820px","height":"520px"}} className="wpf-window wpf-transactionpagebackgroundbrush">
      <div style={{"margin":"16"}} className="wpf-grid">
        <div className="wpf-grid.rowdefinitions">
          <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          <div className="wpf-rowdefinition" />
          <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
        </div>
        <span style={{"margin":"0 0 8 0","fontSize":"13px"}} className="wpf-textblock wpf-textsecondarybrush">{placeholders.HelpText} </span>
        <div style={{"margin":"0 0 10 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
          <div className="wpf-grid.columndefinitions">
            <div className="wpf-columndefinition" />
            <div style={{"width":"Auto"}} className="wpf-columndefinition" />
          </div>
          <input type="text" style={{"height":"32px"}} className="wpf-textbox wpf-forminput" onChange={() => placeholders.noop()} />
          <button type="button" style={{"margin":"0 0 0 8","height":"32px"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Search</button>
        </div>
        <div className="wpf-border wpf-white">
          <table style={{"fontSize":"12px"}} className="wpf-datagrid wpf-name-PickGrid">
            <div className="wpf-datagrid.columns">
              <div style={{"width":"48px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"140px"}} className="wpf-datagridtextcolumn wpf-name-CodeColumn" />
              <div className="wpf-datagridtextcolumn" />
              <div style={{"width":"180px"}} className="wpf-datagridtextcolumn" />
            </div>
          </table>
        </div>
        <div style={{"margin":"4 0 0 0"}} className="wpf-paginationbar" />
        <div style={{"margin":"12 0 0 0"}} className="wpf-dockpanel">
          <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
            <button type="button" style={{"margin":"0 8 0 0","height":"32px"}} className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()}>Select</button>
            <button type="button" style={{"height":"32px"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Cancel</button>
          </div>
          <span className="wpf-textblock wpf-dangerbrush">{placeholders.StatusMessage} </span>
        </div>
      </div>
    </div>
    </div>
  );
}

export default MasterPickWindow;
