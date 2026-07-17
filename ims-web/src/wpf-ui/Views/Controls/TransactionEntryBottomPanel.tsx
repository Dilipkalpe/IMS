/* AUTO-GENERATED from WPF: Views/Controls/TransactionEntryBottomPanel.xaml — UI only; refine for pixel parity */
import './TransactionEntryBottomPanel.scss';
import { placeholders } from '../../../placeholders';

export interface TransactionEntryBottomPanelProps {
  className?: string;
}

export function TransactionEntryBottomPanel({ className }: TransactionEntryBottomPanelProps) {
  return (
    <div className={['wpf-root', 'TransactionEntryBottomPanel', className].filter(Boolean).join(' ')} data-wpf-source="Views/Controls/TransactionEntryBottomPanel.xaml">
    <div className="wpf-usercontrol">
      <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
        <div className="wpf-grid.columndefinitions">
          <div className="wpf-columndefinition" />
          <div style={{"width":"Auto"}} className="wpf-columndefinition" />
        </div>
        <div style={{"margin":"0 12 0 0","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
          <span className="wpf-textblock wpf-salesfieldlabel">{"Narration"} </span>
          <input type="text" style={{"margin":"4 0 0 0","height":"26px"}} className="wpf-textbox wpf-salescompactinput" onChange={() => placeholders.noop()} />
        </div>
        <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
          <span style={{"margin":"0 0 8 0","fontSize":"12px"}} className="wpf-textblock wpf-sectionheader">{"Actions"} </span>
          <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
            <button type="button" style={{"margin":"0 6 0 0","padding":"0","width":"44px","height":"44px"}} className="wpf-button wpf-salessidebutton" onClick={() => placeholders.noop()} />
            <button type="button" style={{"margin":"0 6 0 0","padding":"0","width":"44px","height":"44px"}} className="wpf-button wpf-salessidebutton" onClick={() => placeholders.noop()} />
            <button type="button" style={{"margin":"0 6 0 0","padding":"0","width":"44px","height":"44px"}} className="wpf-button wpf-salessidebuttonsecondary" onClick={() => placeholders.noop()} />
            <button type="button" style={{"margin":"0 6 0 0","padding":"0","width":"44px","height":"44px"}} className="wpf-button wpf-salessidebutton" onClick={() => placeholders.noop()} />
            <button type="button" style={{"margin":"0 6 0 0","padding":"0","width":"44px","height":"44px"}} className="wpf-button wpf-salessidebutton" onClick={() => placeholders.noop()} />
            <button type="button" style={{"margin":"0 6 0 0","padding":"0","width":"44px","height":"44px"}} className="wpf-button wpf-salessidebutton" onClick={() => placeholders.noop()} />
            <button type="button" style={{"margin":"0 6 0 0","padding":"0","width":"44px","height":"44px"}} className="wpf-button wpf-salessidebuttonsecondary" onClick={() => placeholders.noop()} />
            <button type="button" style={{"margin":"0 0 0 0","padding":"0","width":"44px","height":"44px"}} className="wpf-button wpf-salessidebuttonsecondary" onClick={() => placeholders.noop()} />
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default TransactionEntryBottomPanel;
