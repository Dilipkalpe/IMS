/* AUTO-GENERATED from WPF: Views/DynamicFormView.xaml — UI only; refine for pixel parity */
import './DynamicFormView.scss';
import { placeholders } from '../../placeholders';

export interface DynamicFormViewProps {
  className?: string;
}

export function DynamicFormView({ className }: DynamicFormViewProps) {
  return (
    <div className={['wpf-root', 'DynamicFormView', className].filter(Boolean).join(' ')} data-wpf-source="Views/DynamicFormView.xaml">
    <div className="wpf-usercontrol wpf-transactionpagebackgroundbrush">
      <div className="wpf-transactionentryshell">
        <div style={{"margin":"0"}} className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div className="wpf-rowdefinition" />
          </div>
          <span style={{"margin":"0 0 8 0"}} className="wpf-textblock wpf-pagesubtitle">{placeholders.PageDescription} </span>
          <div style={{"margin":"0 0 10 0"}} className="wpf-wrappanel">
            <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Manage fields</button>
            <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Show all</button>
            <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Hide optional</button>
            <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Reset layout</button>
            <button type="button" style={{"margin":"0 8 8 0"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Save layout</button>
          </div>
          <div style={{"padding":"10 12"}} className="wpf-border wpf-transactionsectionborder">
            <div className="wpf-scrollviewer">
              <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                <div className="wpf-itemscontrol">
                  <div className="wpf-itemscontrol.itemtemplate">
                    <div className="wpf-datatemplate">
                      <div style={{"margin":"0 0 10 0","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                        <span className="wpf-textblock wpf-subpagesectionheader">{placeholders.Title} </span>
                        <div className="wpf-itemscontrol">
                          <div className="wpf-itemscontrol.itemspanel">
                            <div className="wpf-itemspaneltemplate">
                              <div className="wpf-wrappanel" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{"margin":"8 0 0 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                  <button type="button" style={{"margin":"0 10 0 0"}} className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()} />
                  <button type="button" className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()} />
                </div>
                <span style={{"margin":"6 0 0 0"}} className="wpf-textblock wpf-subpagefooternote">{"Required fields are marked with *. Use Manage fields to customize visibility; layout is saved per user."} </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default DynamicFormView;
