/* AUTO-GENERATED from WPF: Views/BackupProgressWindow.xaml — UI only; refine for pixel parity */
import './BackupProgressWindow.scss';
import { placeholders } from '../../placeholders';

export interface BackupProgressWindowProps {
  className?: string;
}

export function BackupProgressWindow({ className }: BackupProgressWindowProps) {
  return (
    <div className={['wpf-root', 'BackupProgressWindow', className].filter(Boolean).join(' ')} data-wpf-source="Views/BackupProgressWindow.xaml">
    <div style={{"width":"420px","height":"160px"}} className="wpf-window">
      <div style={{"padding":"24"}} className="wpf-border wpf-cardbrush">
        <div style={{"display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
          <span style={{"margin":"0 0 16 0","fontSize":"14px"}} className="wpf-textblock wpf-name-StatusText wpf-textprimarybrush">{"Creating database backup…"} </span>
          <progress style={{"height":"8px"}} className="wpf-progressbar" />
        </div>
      </div>
    </div>
    </div>
  );
}

export default BackupProgressWindow;
