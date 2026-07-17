/* AUTO-GENERATED from WPF: Views/SubPageView.xaml — UI only; refine for pixel parity */
import './SubPageView.scss';
import { placeholders } from '../../placeholders';

export interface SubPageViewProps {
  className?: string;
}

export function SubPageView({ className }: SubPageViewProps) {
  return (
    <div className={['wpf-root', 'SubPageView', className].filter(Boolean).join(' ')} data-wpf-source="Views/SubPageView.xaml">
    <div className="wpf-usercontrol wpf-transactionpagebackgroundbrush">
      <div className="wpf-transactionentryshell">
        <div style={{"margin":"0"}} className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div className="wpf-rowdefinition" />
          </div>
          <span style={{"margin":"0 0 10 0"}} className="wpf-textblock wpf-pagesubtitle">{placeholders.PageDescription} </span>
          <div style={{"padding":"10 12"}} className="wpf-border wpf-transactionsectionborder">
            <div className="wpf-grid">
              <div className="wpf-grid.rowdefinitions">
                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
              </div>
              <div className="wpf-itemscontrol">
                <div className="wpf-itemscontrol.itemspanel">
                  <div className="wpf-itemspaneltemplate">
                    <div className="wpf-uniformgrid" />
                  </div>
                </div>
                <div className="wpf-itemscontrol.itemtemplate">
                  <div className="wpf-datatemplate">
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-subpagefieldcell">
                      <span className="wpf-textblock wpf-subpageformlabel">{placeholders.Label} </span>
                      <input type="text" className="wpf-textbox" onChange={() => placeholders.noop()} />
                      <input type="text" className="wpf-textbox" onChange={() => placeholders.noop()} />
                      <select className="wpf-combobox">
                        <div className="wpf-combobox.style">
                          <div className="wpf-style">
                            <div className="wpf-setter" />
                            <div className="wpf-style.triggers">
                              <div className="wpf-datatrigger">
                                <div className="wpf-setter" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{"margin":"8 0 0 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                <button type="button" style={{"margin":"0 10 0 0"}} className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()} />
                <button type="button" className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()} />
              </div>
              <span className="wpf-textblock wpf-subpagefooternote">{"Save returns to the list. Required fields are marked with *."} </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default SubPageView;
