/* AUTO-GENERATED from WPF: ConfirmationPasswordWindow.xaml — UI only; refine for pixel parity */
import './ConfirmationPasswordWindow.scss';
import { placeholders } from '../placeholders';

export interface ConfirmationPasswordWindowProps {
  className?: string;
}

export function ConfirmationPasswordWindow({ className }: ConfirmationPasswordWindowProps) {
  return (
    <div className={['wpf-root', 'ConfirmationPasswordWindow', className].filter(Boolean).join(' ')} data-wpf-source="ConfirmationPasswordWindow.xaml">
    <div style={{"width":"480px","height":"320px"}} className="wpf-window">
      <div style={{"margin":"24"}} className="wpf-grid">
        <div className="wpf-grid.rowdefinitions">
          <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          <div className="wpf-rowdefinition" />
          <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
        </div>
        <span style={{"margin":"0 0 8 0","fontSize":"20px"}} className="wpf-textblock">{placeholders.ActionTitle} </span>
        <span style={{"margin":"0 0 16 0","fontSize":"14px"}} className="wpf-textblock wpf--475569">{placeholders.ActionDescription} </span>
        <span style={{"margin":"0 0 8 0","fontSize":"12px"}} className="wpf-textblock wpf--64748b">{"Confirmation password"} </span>
        <input type="password" style={{"padding":"8 12","height":"44px","fontSize":"16px"}} className="wpf-passwordbox wpf-name-PasswordBox" onChange={() => placeholders.noop()} />
        <div style={{"margin":"18 0 0 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
          <button type="button" style={{"margin":"0 10 0 0","width":"100px","height":"38px"}} className="wpf-button" onClick={() => placeholders.noop()}>Cancel</button>
          <button type="button" style={{"width":"110px","height":"38px"}} className="wpf-button" onClick={() => placeholders.noop()}>Confirm</button>
        </div>
      </div>
    </div>
    </div>
  );
}

export default ConfirmationPasswordWindow;
