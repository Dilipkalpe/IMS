/* AUTO-GENERATED from WPF: Views/YearEndClosingWindow.xaml — UI only; refine for pixel parity */
import './YearEndClosingWindow.scss';
import { placeholders } from '../../placeholders';

export interface YearEndClosingWindowProps {
  className?: string;
}

export function YearEndClosingWindow({ className }: YearEndClosingWindowProps) {
  return (
    <div className={['wpf-root', 'YearEndClosingWindow', className].filter(Boolean).join(' ')} data-wpf-source="Views/YearEndClosingWindow.xaml">
    <div style={{"width":"560px","height":"400px"}} className="wpf-window wpf-transactionpagebackgroundbrush">
      <div style={{"margin":"16","padding":"16"}} className="wpf-border wpf-transactionsectionborder">
        <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          </div>
          <div className="wpf-grid.columndefinitions">
            <div style={{"width":"170px"}} className="wpf-columndefinition" />
            <div className="wpf-columndefinition" />
          </div>
          <span style={{"margin":"0 0 12 0","fontSize":"18px"}} className="wpf-textblock wpf-textprimarybrush">{"Year-End Closing Wizard"} </span>
          <span style={{"margin":"0 0 12 0"}} className="wpf-textblock wpf-textsecondarybrush">{placeholders.FromYearLabel} </span>
          <span className="wpf-textblock">{"New Financial Year"} </span>
          <input type="text" style={{"margin":"4 0 4 0","height":"34px"}} className="wpf-textbox wpf-name-ToNameBox" onChange={() => placeholders.noop()} />
          <span className="wpf-textblock">{"Start Date"} </span>
          <input type="date" style={{"margin":"4 0 4 0"}} className="wpf-datepicker wpf-name-ToStartPicker" onChange={() => placeholders.noop()} />
          <span className="wpf-textblock">{"End Date"} </span>
          <input type="date" style={{"margin":"4 0 4 0"}} className="wpf-datepicker wpf-name-ToEndPicker" onChange={() => placeholders.noop()} />
          <div style={{"margin":"18 0 0 0","display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
            <button type="button" style={{"margin":"0 10 0 0"}} className="wpf-button wpf-secondarybutton" onClick={() => placeholders.noop()} />
            <button type="button" className="wpf-button wpf-primarybutton" onClick={() => placeholders.noop()} />
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default YearEndClosingWindow;
