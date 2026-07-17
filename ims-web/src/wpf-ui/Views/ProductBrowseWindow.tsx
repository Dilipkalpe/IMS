/* AUTO-GENERATED from WPF: Views/ProductBrowseWindow.xaml — UI only; refine for pixel parity */
import './ProductBrowseWindow.scss';
import { placeholders } from '../../placeholders';

export interface ProductBrowseWindowProps {
  className?: string;
}

export function ProductBrowseWindow({ className }: ProductBrowseWindowProps) {
  return (
    <div className={['wpf-root', 'ProductBrowseWindow', className].filter(Boolean).join(' ')} data-wpf-source="Views/ProductBrowseWindow.xaml">
    <div style={{"width":"940px","height":"580px"}} className="wpf-window wpf-transactionpagebackgroundbrush">
      <div style={{"margin":"16"}} className="wpf-grid">
        <div className="wpf-grid.rowdefinitions">
          <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          <div className="wpf-rowdefinition" />
          <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
        </div>
        <span style={{"margin":"0 0 8 0","fontSize":"13px"}} className="wpf-textblock wpf-textsecondarybrush">{placeholders.SelectionHelpText} </span>
        <div style={{"margin":"0 0 10 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
          <div style={{"margin":"0 16 0 0"}} className="wpf-radiobutton wpf-name-SingleSelectModeRadio" />
          <div className="wpf-radiobutton wpf-name-MultiSelectModeRadio" />
          <span style={{"margin":"0 0 0 16","fontSize":"12px"}} className="wpf-textblock wpf-textsecondarybrush">{placeholders.SelectedCount} </span>
        </div>
        <div style={{"margin":"0 0 10 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
          <div className="wpf-grid.columndefinitions">
            <div className="wpf-columndefinition" />
            <div style={{"width":"Auto"}} className="wpf-columndefinition" />
            <div style={{"width":"Auto"}} className="wpf-columndefinition" />
            <div style={{"width":"Auto"}} className="wpf-columndefinition" />
          </div>
          <input type="text" style={{"height":"32px"}} className="wpf-textbox wpf-forminput" onChange={() => placeholders.noop()} />
          <button type="button" style={{"margin":"0 0 0 8","height":"32px"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Search</button>
          <button type="button" style={{"margin":"0 0 0 8","height":"32px"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>All on page</button>
          <button type="button" style={{"margin":"0 0 0 8","height":"32px"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Clear</button>
        </div>
        <div className="wpf-border wpf-white">
          <table style={{"fontSize":"12px"}} className="wpf-datagrid wpf-name-ProductsGrid">
            <div className="wpf-datagrid.columns">
              <div style={{"width":"40px"}} className="wpf-datagridtemplatecolumn">
                <div className="wpf-datagridtemplatecolumn.celltemplate">
                  <div className="wpf-datatemplate">
                    <label className="wpf-checkbox" />
                  </div>
                </div>
              </div>
              <div style={{"width":"48px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"120px"}} className="wpf-datagridtextcolumn" />
              <div className="wpf-datagridtextcolumn" />
              <div style={{"width":"120px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"72px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"100px"}} className="wpf-datagridtextcolumn wpf-name-RateColumn" />
              <div style={{"width":"80px"}} className="wpf-datagridtextcolumn" />
            </div>
          </table>
        </div>
        <div style={{"margin":"4 0 0 0"}} className="wpf-paginationbar" />
        <div style={{"margin":"12 0 0 0"}} className="wpf-dockpanel">
          <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
            <button type="button" style={{"margin":"0 8 0 0","height":"32px"}} className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()}>&#123;Binding SelectButtonText&#125;</button>
            <button type="button" style={{"height":"32px"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Cancel</button>
          </div>
          <span className="wpf-textblock wpf-dangerbrush">{placeholders.StatusMessage} </span>
        </div>
      </div>
    </div>
    </div>
  );
}

export default ProductBrowseWindow;
