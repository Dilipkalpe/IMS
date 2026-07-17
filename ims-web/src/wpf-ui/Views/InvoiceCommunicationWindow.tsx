/* AUTO-GENERATED from WPF: Views/InvoiceCommunicationWindow.xaml — UI only; refine for pixel parity */
import './InvoiceCommunicationWindow.scss';
import { placeholders } from '../../placeholders';

export interface InvoiceCommunicationWindowProps {
  className?: string;
}

export function InvoiceCommunicationWindow({ className }: InvoiceCommunicationWindowProps) {
  return (
    <div className={['wpf-root', 'InvoiceCommunicationWindow', className].filter(Boolean).join(' ')} data-wpf-source="Views/InvoiceCommunicationWindow.xaml">
    <div style={{"width":"440px","height":"340px"}} className="wpf-window">
      <div style={{"padding":"24"}} className="wpf-border wpf-cardbrush">
        <div className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          </div>
          <span style={{"margin":"0 0 8 0","fontSize":"16px"}} className="wpf-textblock wpf-textprimarybrush">{"Send notification after save?"} </span>
          <span style={{"margin":"0 0 16 0","fontSize":"13px"}} className="wpf-textblock wpf-textsecondarybrush">{"Choose which channels to use. Only services enabled in Settings are listed."} </span>
          <div style={{"margin":"0 0 16 0","display":"flex","flexDirection":"column"}} className="wpf-stackpanel wpf-name-ChannelPanel" />
          <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
            <button type="button" style={{"margin":"0 8 0 0"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()}>Skip</button>
            <button type="button" className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()}>Send Now</button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default InvoiceCommunicationWindow;
