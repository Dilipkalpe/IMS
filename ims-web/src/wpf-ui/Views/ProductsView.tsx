/* AUTO-GENERATED from WPF: Views/ProductsView.xaml — UI only; refine for pixel parity */
import './ProductsView.scss';
import { placeholders } from '../../placeholders';

export interface ProductsViewProps {
  className?: string;
}

export function ProductsView({ className }: ProductsViewProps) {
  return (
    <div className={['wpf-root', 'ProductsView', className].filter(Boolean).join(' ')} data-wpf-source="Views/ProductsView.xaml">
    <div className="wpf-usercontrol wpf-transactionpagebackgroundbrush">
      <div className="wpf-transactionentryshell">
        <div style={{"margin":"0"}} className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div className="wpf-rowdefinition" />
          </div>
          <span style={{"margin":"0 0 10 0"}} className="wpf-textblock wpf-pagesubtitle">{placeholders.PageDescription} </span>
          <div style={{"margin":"0 0 10 0"}} className="wpf-itemscontrol">
            <div className="wpf-itemscontrol.itemspanel">
              <div className="wpf-itemspaneltemplate">
                <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel" />
              </div>
            </div>
            <div className="wpf-itemscontrol.itemtemplate">
              <div className="wpf-datatemplate">
                <button type="button" style={{"margin":"0 10 0 0"}} className="wpf-button" onClick={() => placeholders.noop()} />
              </div>
            </div>
          </div>
          <div style={{"margin":"0 0 12 0"}} className="wpf-itemscontrol">
            <div className="wpf-itemscontrol.itemspanel">
              <div className="wpf-itemspaneltemplate">
                <div className="wpf-uniformgrid" />
              </div>
            </div>
            <div className="wpf-itemscontrol.itemtemplate">
              <div className="wpf-datatemplate">
                <div style={{"margin":"0 10 0 0","padding":"12"}} className="wpf-border wpf-transactionsectionborder">
                  <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                    <div className="wpf-grid.columndefinitions">
                      <div className="wpf-columndefinition" />
                      <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                    </div>
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                      <span style={{"fontSize":"12px"}} className="wpf-textblock wpf-textsecondarybrush">{placeholders.Label} </span>
                      <span style={{"margin":"2 0 0 0","fontSize":"20px"}} className="wpf-textblock wpf-textprimarybrush">{placeholders.Value} </span>
                    </div>
                    <div className="wpf-border wpf-staticonhost">
                      <span style={{"fontSize":"16px"}} className="wpf-textblock wpf--binding-accentcolor-converter-hextobrushconverter wpf-icontext">{placeholders.IconGlyph} </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={{"padding":"16"}} className="wpf-border wpf-transactionsectionborder">
            <div className="wpf-grid">
              <div className="wpf-grid.rowdefinitions">
                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                <div className="wpf-rowdefinition" />
                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
              </div>
              <div style={{"margin":"0 0 8 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                <div className="wpf-grid.columndefinitions">
                  <div style={{"width":"48px"}} className="wpf-columndefinition" />
                  <div className="wpf-columndefinition" />
                  <div className="wpf-columndefinition" />
                  <div className="wpf-columndefinition" />
                  <div className="wpf-columndefinition" />
                  <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                  <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                  <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                </div>
                <span className="wpf-textblock wpf-gridheader">{"Sr."} </span>
                <span className="wpf-textblock wpf-gridheader">{placeholders.Col1Header} </span>
                <span className="wpf-textblock wpf-gridheader">{placeholders.Col2Header} </span>
                <span className="wpf-textblock wpf-gridheader">{placeholders.Col3Header} </span>
                <span className="wpf-textblock wpf-gridheader">{placeholders.Col4Header} </span>
                <span className="wpf-textblock wpf-gridheader">{placeholders.Col5Header} </span>
                <span className="wpf-textblock wpf-gridheader">{"Status"} </span>
                <span style={{"margin":"0 0 0 16"}} className="wpf-textblock wpf-gridheader">{"Actions"} </span>
              </div>
              <div className="wpf-listbox wpf-transparent">
                <div className="wpf-listbox.itemcontainerstyle">
                  <div className="wpf-style">
                    <div className="wpf-setter" />
                    <div className="wpf-setter" />
                    <div className="wpf-setter" />
                    <div className="wpf-setter" />
                    <div className="wpf-setter">
                      <div className="wpf-setter.value">
                        <div className="wpf-controltemplate">
                          <div style={{"padding":"0"}} className="wpf-border wpf--templatebinding-background">
                            <div className="wpf-contentpresenter" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="wpf-style.triggers">
                      <div className="wpf-trigger">
                        <div className="wpf-setter" />
                      </div>
                      <div className="wpf-trigger">
                        <div className="wpf-setter" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="wpf-listbox.itemtemplate">
                  <div className="wpf-datatemplate">
                    <div style={{"padding":"8 0"}} className="wpf-border">
                      <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                        <div className="wpf-grid.columndefinitions">
                          <div style={{"width":"48px"}} className="wpf-columndefinition" />
                          <div className="wpf-columndefinition" />
                          <div className="wpf-columndefinition" />
                          <div className="wpf-columndefinition" />
                          <div className="wpf-columndefinition" />
                          <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                          <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                          <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                        </div>
                        <span className="wpf-textblock wpf-textsecondarybrush">{placeholders.RowNumber} </span>
                        <span className="wpf-textblock wpf-textprimarybrush">{placeholders.Col1} </span>
                        <span className="wpf-textblock wpf-textprimarybrush">{placeholders.Col2} </span>
                        <span className="wpf-textblock wpf-textsecondarybrush">{placeholders.Col3} </span>
                        <span className="wpf-textblock wpf-textsecondarybrush">{placeholders.Col4} </span>
                        <span className="wpf-textblock wpf-textsecondarybrush">{placeholders.Col5} </span>
                        <div className="wpf-border wpf--binding-status-converter-statustobrushconverter wpf-mockbadge">
                          <span style={{"fontSize":"12px"}} className="wpf-textblock wpf--binding-status-converter-statustoforegroundconverter">{placeholders.Status} </span>
                        </div>
                        <div style={{"margin":"0 0 0 12","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                          <button type="button" style={{"padding":"2 4"}} className="wpf-button" onClick={() => placeholders.noop()} />
                          <button type="button" style={{"margin":"0 0 0 6","padding":"2 4"}} className="wpf-button" onClick={() => placeholders.noop()} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="wpf-paginationbar" />
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default ProductsView;
