/* AUTO-GENERATED from WPF: Reporting/Designer/Views/ReportFormatDesignerView.xaml — UI only; refine for pixel parity */
import './ReportFormatDesignerView.scss';
import { placeholders } from '../../../../placeholders';

export interface ReportFormatDesignerViewProps {
  className?: string;
}

export function ReportFormatDesignerView({ className }: ReportFormatDesignerViewProps) {
  return (
    <div className={['wpf-root', 'ReportFormatDesignerView', className].filter(Boolean).join(' ')} data-wpf-source="Reporting/Designer/Views/ReportFormatDesignerView.xaml">
    <div className="wpf-usercontrol wpf--dce4ec">
      <div className="wpf-transactionentryshell">
        <div style={{"margin":"8"}} className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div className="wpf-rowdefinition" />
          </div>
          <div style={{"margin":"0 0 8 0","padding":"6 8"}} className="wpf-border wpf--2c3e50">
            <div className="wpf-wrappanel">
              <button type="button" style={{"margin":"0 6 4 0","padding":"4 12"}} className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()}>Save</button>
              <button type="button" style={{"margin":"0 12 4 0","padding":"4 12"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Close</button>
              <button type="button" style={{"margin":"0 4 4 0","padding":"4 8"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>+ Text</button>
              <button type="button" style={{"margin":"0 4 4 0","padding":"4 8"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>+ Dynamic</button>
              <button type="button" style={{"margin":"0 4 4 0","padding":"4 8"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>+ Table</button>
              <button type="button" style={{"margin":"0 4 4 0","padding":"4 8"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Undo</button>
              <button type="button" style={{"margin":"0 4 4 0","padding":"4 8"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Redo</button>
              <button type="button" style={{"margin":"0 4 4 0","padding":"4 8"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Delete</button>
              <button type="button" style={{"margin":"0 12 4 0","padding":"4 8"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()}>Tax invoice layout</button>
              <span style={{"margin":"0 6 4 0"}} className="wpf-textblock wpf--e2e8f0">{"Zoom"} </span>
              <div style={{"margin":"0 8 4 0","width":"120px"}} className="wpf-slider" />
              <span style={{"margin":"0 12 4 0"}} className="wpf-textblock wpf--cbd5e1">{placeholders.FormatName} </span>
              <span style={{"margin":"0 0 4 0","fontSize":"11px"}} className="wpf-textblock wpf--94a3b8">{placeholders.StatusMessage} </span>
            </div>
          </div>
          <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div style={{"width":"220px"}} className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
              <div style={{"width":"200px"}} className="wpf-columndefinition" />
            </div>
            <div style={{"margin":"0 8 0 0","padding":"8"}} className="wpf-border wpf-white">
              <div className="wpf-dockpanel">
                <div style={{"margin":"0 0 12 0","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                  <span style={{"margin":"0 0 6 0"}} className="wpf-textblock">{"Paper size (optional)"} </span>
                  <span style={{"fontSize":"11px"}} className="wpf-textblock wpf--64748b">{"Preset"} </span>
                  <select style={{"margin":"2 0 6 0"}} className="wpf-combobox wpf-subpageformcombo" />
                  <label style={{"margin":"0 0 6 0"}} className="wpf-checkbox" />
                  <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                    <span style={{"fontSize":"11px"}} className="wpf-textblock">{"Width (mm)"} </span>
                    <input type="text" style={{"margin":"2 0 4 0"}} className="wpf-textbox" onChange={() => placeholders.noop()} />
                    <span style={{"fontSize":"11px"}} className="wpf-textblock">{"Height (mm)"} </span>
                    <input type="text" style={{"margin":"2 0 4 0"}} className="wpf-textbox" onChange={() => placeholders.noop()} />
                    <span style={{"margin":"4 0 2 0","fontSize":"11px"}} className="wpf-textblock">{"Margins (mm)"} </span>
                    <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                      <div className="wpf-grid.columndefinitions">
                        <div className="wpf-columndefinition" />
                        <div style={{"width":"4px"}} className="wpf-columndefinition" />
                        <div className="wpf-columndefinition" />
                      </div>
                      <div className="wpf-grid.rowdefinitions">
                        <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                        <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
                      </div>
                      <input type="text" className="wpf-textbox" onChange={() => placeholders.noop()} />
                      <input type="text" className="wpf-textbox" onChange={() => placeholders.noop()} />
                      <input type="text" style={{"margin":"4 0 0 0"}} className="wpf-textbox" onChange={() => placeholders.noop()} />
                      <input type="text" style={{"margin":"4 0 0 0"}} className="wpf-textbox" onChange={() => placeholders.noop()} />
                    </div>
                  </div>
                  <span style={{"margin":"6 0 0 0","fontSize":"11px"}} className="wpf-textblock wpf--475569">{placeholders.PageSizeLabel} </span>
                </div>
                <span style={{"margin":"0 0 8 0"}} className="wpf-textblock">{"Field explorer"} </span>
                <div className="wpf-listbox wpf-name-FieldList" />
              </div>
            </div>
            <div style={{"padding":"16"}} className="wpf-scrollviewer wpf--94a3b8">
              <div className="wpf-viewbox wpf-name-ZoomHost">
                <div style={{"width":"{Binding DesignCanvasWidth}","height":"{Binding DesignCanvasHeight}"}} className="wpf-canvas wpf-name-DesignCanvas wpf-white" />
              </div>
            </div>
            <div style={{"margin":"0 0 0 8","padding":"8"}} className="wpf-border wpf-white">
              <div className="wpf-dockpanel">
                <span style={{"margin":"0 0 8 0"}} className="wpf-textblock">{"Properties"} </span>
                <span style={{"margin":"0 0 8 0","fontSize":"11px"}} className="wpf-textblock wpf--64748b">{"Select an element on the canvas."} </span>
                <div className="wpf-scrollviewer">
                  <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                    <span style={{"margin":"0 0 2 0","fontSize":"11px"}} className="wpf-textblock">{placeholders.Name} </span>
                    <span style={{"margin":"0 0 10 0","fontSize":"10px"}} className="wpf-textblock wpf--64748b">{placeholders.Type} </span>
                    <span style={{"margin":"0 0 4 0","fontSize":"11px"}} className="wpf-textblock">{"Position &amp;amp; size"} </span>
                    <span style={{"fontSize":"11px"}} className="wpf-textblock">{"X (mm)"} </span>
                    <input type="text" style={{"margin":"2 0 6 0"}} className="wpf-textbox" onChange={() => placeholders.noop()} />
                    <span style={{"fontSize":"11px"}} className="wpf-textblock">{"Y (mm)"} </span>
                    <input type="text" style={{"margin":"2 0 6 0"}} className="wpf-textbox" onChange={() => placeholders.noop()} />
                    <span style={{"fontSize":"11px"}} className="wpf-textblock">{"Width (mm)"} </span>
                    <input type="text" style={{"margin":"2 0 6 0"}} className="wpf-textbox" onChange={() => placeholders.noop()} />
                    <span style={{"fontSize":"11px"}} className="wpf-textblock">{"Height (mm)"} </span>
                    <input type="text" style={{"margin":"2 0 10 0"}} className="wpf-textbox" onChange={() => placeholders.noop()} />
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                      <span style={{"margin":"0 0 4 0","fontSize":"11px"}} className="wpf-textblock">{"Colors"} </span>
                      <span style={{"fontSize":"11px"}} className="wpf-textblock wpf--64748b">{"Text color (hex)"} </span>
                      <div style={{"margin":"2 0 6 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                        <div className="wpf-grid.columndefinitions">
                          <div className="wpf-columndefinition" />
                          <div style={{"width":"28px"}} className="wpf-columndefinition" />
                        </div>
                        <input type="text" className="wpf-textbox" onChange={() => placeholders.noop()} />
                        <div style={{"margin":"0 0 0 4","width":"24px","height":"20px"}} className="wpf-border wpf--binding-textcolor-converter-hextobrush" />
                      </div>
                      <span style={{"fontSize":"11px"}} className="wpf-textblock wpf--64748b">{"Background (hex)"} </span>
                      <div style={{"margin":"2 0 6 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                        <div className="wpf-grid.columndefinitions">
                          <div className="wpf-columndefinition" />
                          <div style={{"width":"28px"}} className="wpf-columndefinition" />
                        </div>
                        <input type="text" className="wpf-textbox" onChange={() => placeholders.noop()} />
                        <div style={{"margin":"0 0 0 4","width":"24px","height":"20px"}} className="wpf-border wpf--binding-backgroundcolor-converter-hextobrush" />
                      </div>
                      <span style={{"fontSize":"11px"}} className="wpf-textblock">{"Font size (pt)"} </span>
                      <input type="text" style={{"margin":"2 0 6 0"}} className="wpf-textbox" onChange={() => placeholders.noop()} />
                      <span style={{"fontSize":"11px"}} className="wpf-textblock">{"Text align"} </span>
                      <select style={{"margin":"2 0 10 0"}} className="wpf-combobox">
                        <div className="wpf-comboboxitem" />
                        <div className="wpf-comboboxitem" />
                        <div className="wpf-comboboxitem" />
                      </select>
                    </div>
                    <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                      <span style={{"margin":"0 0 4 0","fontSize":"11px"}} className="wpf-textblock">{"Table header colors"} </span>
                      <span style={{"fontSize":"11px"}} className="wpf-textblock wpf--64748b">{"Header background"} </span>
                      <div style={{"margin":"2 0 6 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                        <div className="wpf-grid.columndefinitions">
                          <div className="wpf-columndefinition" />
                          <div style={{"width":"28px"}} className="wpf-columndefinition" />
                        </div>
                        <input type="text" className="wpf-textbox" onChange={() => placeholders.noop()} />
                        <div style={{"margin":"0 0 0 4","width":"24px","height":"20px"}} className="wpf-border wpf--binding-headerbackgroundcolor-converter-hextobrush" />
                      </div>
                      <span style={{"fontSize":"11px"}} className="wpf-textblock wpf--64748b">{"Header text"} </span>
                      <div style={{"margin":"2 0 6 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                        <div className="wpf-grid.columndefinitions">
                          <div className="wpf-columndefinition" />
                          <div style={{"width":"28px"}} className="wpf-columndefinition" />
                        </div>
                        <input type="text" className="wpf-textbox" onChange={() => placeholders.noop()} />
                        <div style={{"margin":"0 0 0 4","width":"24px","height":"20px"}} className="wpf-border wpf--binding-headertextcolor-converter-hextobrush" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default ReportFormatDesignerView;
