/* AUTO-GENERATED from WPF: Views/CreateFinancialYearWindow.xaml — UI only; refine for pixel parity */
import './CreateFinancialYearWindow.scss';
import { placeholders } from '../../placeholders';

export interface CreateFinancialYearWindowProps {
  className?: string;
}

export function CreateFinancialYearWindow({ className }: CreateFinancialYearWindowProps) {
  return (
    <div className={['wpf-root', 'CreateFinancialYearWindow', className].filter(Boolean).join(' ')} data-wpf-source="Views/CreateFinancialYearWindow.xaml">
    <div style={{"width":"520px","height":"340px"}} className="wpf-window wpf-transactionpagebackgroundbrush">
      <div style={{"margin":"16","padding":"16"}} className="wpf-border wpf-transactionsectionborder">
        <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
          <div className="wpf-grid.rowdefinitions">
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
          </div>
          <div className="wpf-grid.columndefinitions">
            <div style={{"width":"160px"}} className="wpf-columndefinition" />
            <div className="wpf-columndefinition" />
          </div>
          <span style={{"margin":"0 0 14 0","fontSize":"18px"}} className="wpf-textblock wpf-textprimarybrush">{"Create a new Financial Year"} </span>
          <span className="wpf-textblock">{"Financial Year"} </span>
          <input type="text" style={{"margin":"4 0 4 0","height":"34px"}} className="wpf-textbox wpf-name-NameBox" onChange={() => placeholders.noop()} />
          <span className="wpf-textblock">{"Start Date"} </span>
          <input type="date" style={{"margin":"4 0 4 0"}} className="wpf-datepicker wpf-name-StartPicker" onChange={() => placeholders.noop()} />
          <span className="wpf-textblock">{"End Date"} </span>
          <input type="date" style={{"margin":"4 0 4 0"}} className="wpf-datepicker wpf-name-EndPicker" onChange={() => placeholders.noop()} />
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

export default CreateFinancialYearWindow;
