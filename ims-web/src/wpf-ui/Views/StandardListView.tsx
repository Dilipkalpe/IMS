/* AUTO-GENERATED from WPF: Views/StandardListView.xaml — UI only; refine for pixel parity */
import './StandardListView.scss';
import { placeholders } from '../../placeholders';

export interface StandardListViewProps {
  className?: string;
}

export function StandardListView({ className }: StandardListViewProps) {
  return (
    <div className={['wpf-root', 'StandardListView', className].filter(Boolean).join(' ')} data-wpf-source="Views/StandardListView.xaml">
    <div className="wpf-usercontrol wpf-name-Root wpf-contentbackgroundbrush">
      <div className="wpf-transactionentryshell">
        <div className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div className="wpf-rowdefinition" />
          </div>
          <div className="wpf-border wpf-transactionpagebackgroundbrush">
            <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span style={{"fontSize":"16px"}} className="wpf-textblock wpf-textprimarybrush">{"Loading…"} </span>
              <span style={{"margin":"6 0 0 0","fontSize":"12px"}} className="wpf-textblock wpf-textsecondarybrush">{placeholders.LoadingSubtitle} </span>
            </div>
          </div>
          <div style={{"margin":"0 0 6 0"}} className="wpf-itemscontrol">
            <div className="wpf-itemscontrol.itemspanel">
              <div className="wpf-itemspaneltemplate">
                <div className="wpf-uniformgrid" />
              </div>
            </div>
            <div className="wpf-itemscontrol.itemtemplate">
              <div className="wpf-datatemplate">
                <div className="wpf-statcountercard" />
              </div>
            </div>
          </div>
          <div style={{"margin":"0 0 4 0","padding":"6 8"}} className="wpf-border wpf-solistsectionborder">
            <div className="wpf-grid">
              <div className="wpf-grid.rowdefinitions">
                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
              </div>
              <div style={{"margin":"0 0 4 0"}} className="wpf-wrappanel">
                <div style={{"margin":"0 8 8 0"}} className="wpf-itemscontrol">
                  <div className="wpf-itemscontrol.itemspanel">
                    <div className="wpf-itemspaneltemplate">
                      <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel" />
                    </div>
                  </div>
                  <div className="wpf-itemscontrol.itemtemplate">
                    <div className="wpf-datatemplate">
                      <button type="button" style={{"margin":"0 8 0 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()} />
                    </div>
                  </div>
                </div>
                <input type="text" style={{"margin":"0 8 8 0","padding":"6 8","width":"220px","fontSize":"13px"}} className="wpf-textbox" onChange={() => placeholders.noop()} />
                <select style={{"margin":"0 8 8 0","width":"140px"}} className="wpf-combobox wpf-formcombo" />
                <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Refresh</button>
                <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Manage Columns</button>
                <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-name-ExportDataButton wpf-actionbutton" onClick={() => placeholders.noop()} />
              </div>
              <span style={{"fontSize":"12px"}} className="wpf-textblock wpf-textsecondarybrush">{placeholders.StatusMessage} </span>
            </div>
          </div>
          <div className="wpf-popup wpf-name-ExportDataPopup">
            <div style={{"padding":"4"}} className="wpf-border wpf-name-ExportDataMenuHost wpf-cardbrush">
              <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                <button type="button" style={{"margin":"0 0 2 0","padding":"6 12"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Excel</button>
                <button type="button" style={{"margin":"0 0 2 0","padding":"6 12"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>PDF</button>
                <button type="button" style={{"padding":"6 12"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Print</button>
              </div>
            </div>
          </div>
          <div style={{"padding":"1"}} className="wpf-border wpf-solistsectionborder">
            <div className="wpf-grid">
              <div className="wpf-grid.rowdefinitions">
                <div className="wpf-rowdefinition" />
                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
              </div>
              <table className="wpf-datagrid wpf-name-ListGrid wpf-solistordersgrid" />
              <span style={{"fontSize":"15px"}} className="wpf-textblock wpf-textsecondarybrush">{placeholders.EmptyStateMessage} </span>
              <div style={{"margin":"0 12 12 12"}} className="wpf-paginationbar" />
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default StandardListView;
