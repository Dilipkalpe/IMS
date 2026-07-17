/* AUTO-GENERATED from WPF: Views/DeliveryChallanWorkspaceView.xaml — UI only; refine for pixel parity */
import './DeliveryChallanWorkspaceView.scss';
import { placeholders } from '../../placeholders';

export interface DeliveryChallanWorkspaceViewProps {
  className?: string;
}

export function DeliveryChallanWorkspaceView({ className }: DeliveryChallanWorkspaceViewProps) {
  return (
    <div className={['wpf-root', 'DeliveryChallanWorkspaceView', className].filter(Boolean).join(' ')} data-wpf-source="Views/DeliveryChallanWorkspaceView.xaml">
    <div className="wpf-usercontrol wpf-transactionpagebackgroundbrush">
      <div className="wpf-grid">
        <div className="wpf-grid.rowdefinitions">
          <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          <div className="wpf-rowdefinition" />
        </div>
        <div className="wpf-border wpf-transactionworkspacetabbar">
          <div className="wpf-grid">
            <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
              <div className="wpf-itemscontrol">
                <div className="wpf-itemscontrol.itemspanel">
                  <div className="wpf-itemspaneltemplate">
                    <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel" />
                  </div>
                </div>
                <div className="wpf-itemscontrol.itemtemplate">
                  <div className="wpf-datatemplate">
                    <div style={{"margin":"0 4 0 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
                      <button type="button" className="wpf-button" onClick={() => placeholders.noop()} />
                      <button type="button" style={{"padding":"0","width":"22px","height":"28px","fontSize":"10px"}} className="wpf-button wpf-salessidebuttonsecondary" onClick={() => placeholders.noop()}>&amp;#xE711;</button>
                    </div>
                  </div>
                </div>
              </div>
              <button type="button" style={{"margin":"0 0 0 8","padding":"6 12","fontSize":"12px"}} className="wpf-button wpf-actionbutton" onClick={() => placeholders.noop()} />
            </div>
            <span style={{"fontSize":"12px"}} className="wpf-textblock wpf-textsecondarybrush">{placeholders.OpenTabCountLabel} </span>
          </div>
        </div>
        <div className="wpf-contentcontrol" />
      </div>
    </div>
    </div>
  );
}

export default DeliveryChallanWorkspaceView;
