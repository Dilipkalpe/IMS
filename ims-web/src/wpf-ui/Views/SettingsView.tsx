/* AUTO-GENERATED from WPF: Views/SettingsView.xaml — UI only; refine for pixel parity */
import './SettingsView.scss';
import { placeholders } from '../../placeholders';

export interface SettingsViewProps {
  className?: string;
}

export function SettingsView({ className }: SettingsViewProps) {
  return (
    <div className={['wpf-root', 'SettingsView', className].filter(Boolean).join(' ')} data-wpf-source="Views/SettingsView.xaml">
    <div className="wpf-usercontrol">
      <div className="wpf-scrollviewer">
        <div style={{"margin":"20 24 20 24"}} className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          </div>
          <div style={{"margin":"0 0 16 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div style={{"width":"Auto"}} className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
            </div>
            <div style={{"margin":"0 14 0 0"}} className="wpf-border wpf-pageiconhost">
              <span style={{"fontSize":"22px"}} className="wpf-textblock wpf-accentbrush wpf-icontext">{placeholders.IconGlyph} </span>
            </div>
            <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span className="wpf-textblock wpf-pagetitle">{placeholders.PageTitle} </span>
              <span className="wpf-textblock wpf-pagesubtitle">{placeholders.PageDescription} </span>
            </div>
          </div>
          <div style={{"margin":"0 0 12 0","padding":"20"}} className="wpf-border wpf-card">
            <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span className="wpf-textblock wpf-sectionheader">{"Sales order bill — print format"} </span>
              <span style={{"margin":"0 0 16 0","fontSize":"13px"}} className="wpf-textblock wpf-textsecondarybrush">
                <div className="wpf-run" />
                <div className="wpf-run" />
                <div className="wpf-run" />
              </span>
              <div style={{"margin":"0 0 12 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                <div className="wpf-grid.columndefinitions">
                  <div style={{"width":"140px"}} className="wpf-columndefinition" />
                  <div className="wpf-columndefinition" />
                </div>
                <span style={{"margin":"0"}} className="wpf-textblock wpf-formlabel">{"Paper size"} </span>
                <select className="wpf-combobox wpf-formcombo">
                  <div className="wpf-combobox.itemtemplate">
                    <div className="wpf-datatemplate">
                      <span className="wpf-textblock">{placeholders.DisplayName} </span>
                    </div>
                  </div>
                </select>
              </div>
              <span style={{"margin":"0 0 12 140","fontSize":"12px"}} className="wpf-textblock wpf-textsecondarybrush">{placeholders.Description} </span>
              <div style={{"margin":"0 0 12 0","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                <div style={{"margin":"0 0 8 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                  <div className="wpf-grid.columndefinitions">
                    <div style={{"width":"140px"}} className="wpf-columndefinition" />
                    <div style={{"width":"120px"}} className="wpf-columndefinition" />
                    <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                    <div style={{"width":"120px"}} className="wpf-columndefinition" />
                    <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                  </div>
                  <span className="wpf-textblock wpf-formlabel">{"Custom size"} </span>
                  <input type="text" className="wpf-textbox wpf-forminput" onChange={() => placeholders.noop()} />
                  <span style={{"margin":"0 16 0 8","fontSize":"12px"}} className="wpf-textblock wpf-textsecondarybrush">{"mm wide"} </span>
                  <input type="text" className="wpf-textbox wpf-forminput" onChange={() => placeholders.noop()} />
                  <span style={{"margin":"0 0 0 8","fontSize":"12px"}} className="wpf-textblock wpf-textsecondarybrush">{"mm high"} </span>
                </div>
                <span style={{"margin":"0 0 0 140","fontSize":"11px"}} className="wpf-textblock wpf-textsecondarybrush">{"Example: 80 × 200 mm for a narrow receipt, or 210 × 99 mm for a half-page bill."} </span>
              </div>
              <div style={{"margin":"0 0 12 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                <div className="wpf-grid.columndefinitions">
                  <div style={{"width":"140px"}} className="wpf-columndefinition" />
                  <div style={{"width":"120px"}} className="wpf-columndefinition" />
                  <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                </div>
                <span className="wpf-textblock wpf-formlabel">{"Page margin"} </span>
                <input type="text" className="wpf-textbox wpf-forminput" onChange={() => placeholders.noop()} />
                <span style={{"margin":"0 0 0 8","fontSize":"12px"}} className="wpf-textblock wpf-textsecondarybrush">{"mm (all sides)"} </span>
              </div>
              <div style={{"margin":"4 0 0 0"}} className="wpf-border wpf-highlightpanel">
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                  <span style={{"fontSize":"12px"}} className="wpf-textblock wpf-textprimarybrush">{"Active print layout"} </span>
                  <span style={{"margin":"6 0 0 0","fontSize":"13px"}} className="wpf-textblock wpf-accentbrush">{placeholders.PrintFormatSummary} </span>
                  <span style={{"margin":"8 0 0 0","fontSize":"11px"}} className="wpf-textblock wpf-textsecondarybrush">{"Saved automatically. Sales counter print actions use this format immediately."} </span>
                </div>
              </div>
            </div>
          </div>
          <div style={{"margin":"0 0 12 0","padding":"20"}} className="wpf-border wpf-card">
            <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span className="wpf-textblock wpf-sectionheader">{"Manage columns"} </span>
              <span style={{"margin":"0 0 12 0","fontSize":"13px"}} className="wpf-textblock wpf-textsecondarybrush">{"Show or hide line-item grid columns for sales and purchase documents. Changes apply immediately and are saved per user. Mandatory columns cannot be hidden."} </span>
              <div style={{"margin":"0 0 12 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                <div className="wpf-grid.columndefinitions">
                  <div style={{"width":"140px"}} className="wpf-columndefinition" />
                  <div className="wpf-columndefinition" />
                </div>
                <span className="wpf-textblock wpf-formlabel">{"Module"} </span>
                <select className="wpf-combobox wpf-formcombo" />
              </div>
              <div style={{"margin":"0 0 12 0"}} className="wpf-itemscontrol">
                <div className="wpf-itemscontrol.itemtemplate">
                  <div className="wpf-datatemplate">
                    <label style={{"margin":"0 0 6 0","fontSize":"13px"}} className="wpf-checkbox">
                      <div className="wpf-checkbox.style">
                        <div className="wpf-style">
                          <div className="wpf-style.triggers">
                            <div className="wpf-datatrigger">
                              <div className="wpf-setter" />
                              <div className="wpf-setter" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              <div style={{"margin":"0 0 8 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                <button type="button" style={{"margin":"0 10 0 0","padding":"8 14"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Reset to default</button>
              </div>
              <div style={{"margin":"0 0 8 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                <button type="button" style={{"margin":"0 10 0 0","padding":"8 14"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Save as organization default</button>
                <button type="button" style={{"padding":"8 14"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Reset organization default</button>
              </div>
              <span style={{"fontSize":"12px"}} className="wpf-textblock wpf-accentbrush">{placeholders.StatusMessage} </span>
            </div>
          </div>
          <div style={{"margin":"0 0 12 0","padding":"20"}} className="wpf-border wpf-card">
            <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span className="wpf-textblock wpf-sectionheader">{"Appearance"} </span>
              <span style={{"margin":"0 0 16 0","fontSize":"13px"}} className="wpf-textblock wpf-textsecondarybrush">{"Choose a color theme for the application shell, pages, and KPI accents."} </span>
              <div style={{"margin":"0 0 12 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                <div className="wpf-grid.columndefinitions">
                  <div style={{"width":"140px"}} className="wpf-columndefinition" />
                  <div className="wpf-columndefinition" />
                </div>
                <span style={{"margin":"0"}} className="wpf-textblock wpf-formlabel">{"Color theme"} </span>
                <select className="wpf-combobox wpf-formcombo" />
              </div>
              <div style={{"margin":"4 0 0 0"}} className="wpf-border wpf-highlightpanel">
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                  <span style={{"fontSize":"13px"}} className="wpf-textblock wpf-textprimarybrush">{placeholders.Description} </span>
                  <span style={{"margin":"8 0 0 0","fontSize":"12px"}} className="wpf-textblock wpf-accentbrush">{placeholders.ActiveThemeSummary} </span>
                </div>
              </div>
            </div>
          </div>
          <div style={{"margin":"0 0 12 0","padding":"20"}} className="wpf-border wpf-card">
            <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span className="wpf-textblock wpf-sectionheader">{"Database backup on exit"} </span>
              <span style={{"margin":"0 0 16 0","fontSize":"13px"}} className="wpf-textblock wpf-textsecondarybrush">{"When you close the application, IMS can create a MongoDB archive backup (mongodump) before exiting. Backups use the file name DatabaseBackup_YYYYMMDD_HHMMSS.bak."} </span>
              <div style={{"margin":"0 0 12 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                <div className="wpf-grid.columndefinitions">
                  <div style={{"width":"140px"}} className="wpf-columndefinition" />
                  <div className="wpf-columndefinition" />
                  <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                </div>
                <span className="wpf-textblock wpf-formlabel">{"Backup folder"} </span>
                <input type="text" className="wpf-textbox wpf-forminput" onChange={() => placeholders.noop()} />
                <button type="button" style={{"margin":"0 0 0 12","padding":"8 14"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Browse…</button>
              </div>
              <div style={{"margin":"0 0 12 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                <div className="wpf-grid.columndefinitions">
                  <div style={{"width":"140px"}} className="wpf-columndefinition" />
                  <div className="wpf-columndefinition" />
                </div>
                <span className="wpf-textblock wpf-formlabel">{"On close"} </span>
                <select className="wpf-combobox wpf-formcombo" />
              </div>
              <span style={{"margin":"0 0 12 140","fontSize":"12px"}} className="wpf-textblock wpf-textsecondarybrush">{placeholders.Description} </span>
              <div style={{"margin":"4 0 0 0"}} className="wpf-border wpf-highlightpanel">
                <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                  <span style={{"fontSize":"12px"}} className="wpf-textblock wpf-textprimarybrush">{"Resolved backup path"} </span>
                  <span style={{"margin":"6 0 0 0","fontSize":"13px"}} className="wpf-textblock wpf-accentbrush">{placeholders.ResolvedBackupFolder} </span>
                  <span style={{"margin":"8 0 0 0","fontSize":"11px"}} className="wpf-textblock wpf-textsecondarybrush">{"The folder is created automatically if it does not exist. Backup activity is also logged locally under %LocalAppData%\IMS\backup-logs.jsonl."} </span>
                </div>
              </div>
              <span style={{"margin":"10 0 0 0","fontSize":"12px"}} className="wpf-textblock wpf-accentbrush">{placeholders.BackupSettingsStatusMessage} </span>
            </div>
          </div>
          <div style={{"margin":"0 0 12 0","padding":"20"}} className="wpf-border wpf-card">
            <div className="wpf-salespurchaseconfigurationpanel" />
          </div>
          <div style={{"margin":"0 0 12 0","padding":"20"}} className="wpf-border wpf-card">
            <div className="wpf-communicationsettingspanel" />
          </div>
          <div style={{"margin":"0 0 12 0","padding":"20"}} className="wpf-border wpf-card">
            <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span className="wpf-textblock wpf-sectionheader">{"Edit/delete confirmation password"} </span>
              <span style={{"margin":"0 0 12 0","fontSize":"13px"}} className="wpf-textblock wpf-textsecondarybrush">{"When enabled, users must enter the confirmation password before any edit or delete on any page. When disabled, no password window is shown and actions proceed immediately. The password is stored hashed in MongoDB."} </span>
              <label style={{"margin":"0 0 12 0","fontSize":"13px"}} className="wpf-checkbox" />
              <span style={{"margin":"0 0 16 0","fontSize":"12px"}} className="wpf-textblock wpf-textprimarybrush">{placeholders.EditDeletePasswordStatus} </span>
              <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                <div style={{"margin":"0 0 8 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                  <div className="wpf-grid.columndefinitions">
                    <div style={{"width":"140px"}} className="wpf-columndefinition" />
                    <div className="wpf-columndefinition" />
                  </div>
                  <span className="wpf-textblock wpf-formlabel">{"New password"} </span>
                  <input type="password" style={{"padding":"6 10","height":"36px"}} className="wpf-passwordbox wpf-name-NewEditDeletePasswordBox" onChange={() => placeholders.noop()} />
                </div>
                <div style={{"margin":"0 0 12 0","display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                  <div className="wpf-grid.columndefinitions">
                    <div style={{"width":"140px"}} className="wpf-columndefinition" />
                    <div className="wpf-columndefinition" />
                  </div>
                  <span className="wpf-textblock wpf-formlabel">{"Confirm password"} </span>
                  <input type="password" style={{"padding":"6 10","height":"36px"}} className="wpf-passwordbox wpf-name-ConfirmEditDeletePasswordBox" onChange={() => placeholders.noop()} />
                </div>
                <button type="button" style={{"padding":"8 14"}} className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()}>Update confirmation password</button>
              </div>
              <span style={{"margin":"10 0 0 0","fontSize":"12px"}} className="wpf-textblock wpf-accentbrush">{placeholders.SecurityStatusMessage} </span>
            </div>
          </div>
          <div style={{"margin":"0 0 12 0","padding":"20"}} className="wpf-border wpf-card">
            <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span className="wpf-textblock wpf--c62828 wpf-sectionheader">{"Delete all data"} </span>
              <span style={{"margin":"0 0 12 0","fontSize":"13px"}} className="wpf-textblock wpf-textsecondarybrush">{"Permanently remove every business record from the MongoDB database used by this IMS installation. Use only for a full reset or before go-live."} </span>
              <span style={{"margin":"0 0 12 0","fontSize":"12px"}} className="wpf-textblock wpf-textprimarybrush">{placeholders.DataSummaryText} </span>
              <div style={{"margin":"0 0 8 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                <button type="button" style={{"margin":"0 10 0 0","padding":"8 14"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Refresh counts</button>
                <button type="button" style={{"padding":"8 14"}} className="wpf-button wpf-white wpf--c62828" onClick={() => placeholders.noop()}>Delete all database data…</button>
              </div>
              <span style={{"margin":"4 0 0 0","fontSize":"12px"}} className="wpf-textblock wpf-accentbrush">{placeholders.DataStatusMessage} </span>
              <span style={{"margin":"8 0 0 0","fontSize":"11px"}} className="wpf-textblock wpf-textsecondarybrush">{"After delete, run npm run seed in the api folder to load sample data again."} </span>
            </div>
          </div>
          <div style={{"margin":"0 0 12 0","padding":"20"}} className="wpf-border wpf-card">
            <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span className="wpf-textblock wpf-sectionheader">{"Theme previews"} </span>
              <div className="wpf-itemscontrol">
                <div className="wpf-itemscontrol.itemtemplate">
                  <div className="wpf-datatemplate">
                    <div style={{"margin":"0 0 8 0","padding":"12"}} className="wpf-border wpf-cardbrush">
                      <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
                        <div className="wpf-grid.columndefinitions">
                          <div style={{"width":"Auto"}} className="wpf-columndefinition" />
                          <div className="wpf-columndefinition" />
                        </div>
                        <div style={{"margin":"0 12 0 0","width":"40px","height":"40px"}} className="wpf-border wpf--binding-previewcolor-converter-hextobrushconverter" />
                        <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
                          <span className="wpf-textblock wpf-textprimarybrush">{placeholders.DisplayName} </span>
                          <span style={{"margin":"4 0 0 0","fontSize":"12px"}} className="wpf-textblock wpf-textsecondarybrush">{placeholders.Description} </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <span style={{"margin":"8 0 0 0","fontSize":"12px"}} className="wpf-textblock wpf-textsecondarybrush">{"Your selection is saved automatically and restored on next launch."} </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default SettingsView;
