/* AUTO-GENERATED from WPF: Views/PaginationBar.xaml — UI only; refine for pixel parity */
import './PaginationBar.scss';
import { placeholders } from '../../placeholders';

export interface PaginationBarProps {
  className?: string;
}

export function PaginationBar({ className }: PaginationBarProps) {
  return (
    <div className={['wpf-root', 'PaginationBar', className].filter(Boolean).join(' ')} data-wpf-source="Views/PaginationBar.xaml">
    <div className="wpf-usercontrol">
      <div style={{"margin":"8 0 0 0","padding":"12 0 0 0"}} className="wpf-border">
        <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
          <div className="wpf-grid.columndefinitions">
            <div className="wpf-columndefinition" />
            <div style={{"width":"Auto"}} className="wpf-columndefinition" />
            <div style={{"width":"Auto"}} className="wpf-columndefinition" />
          </div>
          <span style={{"fontSize":"13px"}} className="wpf-textblock wpf-textsecondarybrush">{placeholders.PageInfo} </span>
          <div style={{"margin":"0 16 0 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
            <span style={{"margin":"0 8 0 0","fontSize":"12px"}} className="wpf-textblock wpf-textsecondarybrush">{"Rows per page"} </span>
            <select className="wpf-combobox wpf-formcombo" />
          </div>
          <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
            <button type="button" className="wpf-button wpf-pagingbutton" onClick={() => placeholders.noop()} />
            <button type="button" className="wpf-button wpf-pagingbutton" onClick={() => placeholders.noop()} />
            <div style={{"margin":"0 4","padding":"6 12"}} className="wpf-border wpf-panelmutedbrush">
              <span style={{"fontSize":"13px"}} className="wpf-textblock wpf-textprimarybrush">
                <div className="wpf-run" />
                <div className="wpf-run" />
                <div className="wpf-run" />
              </span>
            </div>
            <button type="button" className="wpf-button wpf-pagingbutton" onClick={() => placeholders.noop()} />
            <button type="button" className="wpf-button wpf-pagingbutton" onClick={() => placeholders.noop()} />
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default PaginationBar;
