/* AUTO-GENERATED from WPF: Views/Controls/EntryLineItemsPanel.xaml — UI only; refine for pixel parity */
import './EntryLineItemsPanel.scss';
import { placeholders } from '../../../placeholders';

export interface EntryLineItemsPanelProps {
  className?: string;
}

export function EntryLineItemsPanel({ className }: EntryLineItemsPanelProps) {
  return (
    <div className={['wpf-root', 'EntryLineItemsPanel', className].filter(Boolean).join(' ')} data-wpf-source="Views/Controls/EntryLineItemsPanel.xaml">
    <div className="wpf-usercontrol">
      <div className="wpf-grid">
        <div className="wpf-grid.rowdefinitions">
          <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          <div className="wpf-rowdefinition" />
        </div>
        <div style={{"margin":"0 0 4 0"}} className="wpf-productscanpickerbar wpf-name-ProductScanPicker" />
        <div style={{"padding":"0"}} className="wpf-border wpf-white">
          <table className="wpf-datagrid wpf-name-LineItemsGrid wpf-transactionlinegrid">
            <div className="wpf-datagrid.columnheaderstyle">
              <div className="wpf-style" />
            </div>
            <div className="wpf-datagrid.cellstyle">
              <div className="wpf-style" />
            </div>
            <div className="wpf-datagrid.rowstyle">
              <div className="wpf-style" />
            </div>
            <div className="wpf-datagrid.columns">
              <div style={{"width":"40px"}} className="wpf-datagridtemplatecolumn">
                <div className="wpf-datagridtemplatecolumn.celltemplate">
                  <div className="wpf-datatemplate">
                    <button type="button" style={{"margin":"0 2","padding":"0","width":"28px","height":"24px"}} className="wpf-button wpf-dangerlightbrush" onClick={() => placeholders.noop()} />
                  </div>
                </div>
              </div>
              <div style={{"width":"36px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"90px"}} className="wpf-datagridtextcolumn" />
              <div className="wpf-datagridtextcolumn" />
              <div style={{"width":"52px"}} className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.editingelementstyle">
                  <div className="wpf-style">
                    <div className="wpf-setter" />
                    <div className="wpf-setter" />
                    <div className="wpf-setter" />
                    <div className="wpf-setter" />
                  </div>
                </div>
              </div>
              <div style={{"width":"72px"}} className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.editingelementstyle">
                  <div className="wpf-style">
                    <div className="wpf-setter" />
                    <div className="wpf-setter" />
                    <div className="wpf-setter" />
                    <div className="wpf-setter" />
                  </div>
                </div>
              </div>
              <div style={{"width":"56px"}} className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.editingelementstyle">
                  <div className="wpf-style">
                    <div className="wpf-setter" />
                    <div className="wpf-setter" />
                    <div className="wpf-setter" />
                    <div className="wpf-setter" />
                  </div>
                </div>
              </div>
              <div style={{"width":"64px"}} className="wpf-datagridtextcolumn">
                <div className="wpf-datagridtextcolumn.editingelementstyle">
                  <div className="wpf-style">
                    <div className="wpf-setter" />
                    <div className="wpf-setter" />
                    <div className="wpf-setter" />
                    <div className="wpf-setter" />
                  </div>
                </div>
              </div>
              <div style={{"width":"72px"}} className="wpf-datagridcomboboxcolumn">
                <div className="wpf-datagridcomboboxcolumn.elementstyle">
                  <div className="wpf-style">
                    <div className="wpf-setter" />
                    <div className="wpf-setter" />
                  </div>
                </div>
                <div className="wpf-datagridcomboboxcolumn.editingelementstyle">
                  <div className="wpf-style">
                    <div className="wpf-setter" />
                    <div className="wpf-setter" />
                  </div>
                </div>
              </div>
              <div style={{"width":"56px"}} className="wpf-datagridcomboboxcolumn">
                <div className="wpf-datagridcomboboxcolumn.elementstyle">
                  <div className="wpf-style">
                    <div className="wpf-setter" />
                    <div className="wpf-setter" />
                  </div>
                </div>
                <div className="wpf-datagridcomboboxcolumn.editingelementstyle">
                  <div className="wpf-style">
                    <div className="wpf-setter" />
                    <div className="wpf-setter" />
                  </div>
                </div>
              </div>
              <div style={{"width":"72px"}} className="wpf-datagridtextcolumn" />
            </div>
          </table>
        </div>
      </div>
    </div>
    </div>
  );
}

export default EntryLineItemsPanel;
