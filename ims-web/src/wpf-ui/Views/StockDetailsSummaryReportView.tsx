/* AUTO-GENERATED from WPF: Views/StockDetailsSummaryReportView.xaml — UI only; refine for pixel parity */
import './StockDetailsSummaryReportView.scss';
import { placeholders } from '../../placeholders';

export interface StockDetailsSummaryReportViewProps {
  className?: string;
}

export function StockDetailsSummaryReportView({ className }: StockDetailsSummaryReportViewProps) {
  return (
    <div className={['wpf-root', 'StockDetailsSummaryReportView', className].filter(Boolean).join(' ')} data-wpf-source="Views/StockDetailsSummaryReportView.xaml">
    <div className="wpf-usercontrol wpf-contentbackgroundbrush">
      <div className="wpf-standardreportview">
        <div className="wpf-standardreportview.filtercontent">
          <div style={{"display":"grid","gridTemplateColumns":"1fr"}} className="wpf-grid">
            <div className="wpf-grid.columndefinitions">
              <div className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
              <div className="wpf-columndefinition" />
              <div style={{"width":"Auto"}} className="wpf-columndefinition" />
            </div>
            <div className="wpf-grid.rowdefinitions">
              <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
              <div style={{"height":"Auto"}} className="wpf-rowdefinition" />
            </div>
            <div style={{"margin":"0 12 10 0","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span className="wpf-textblock wpf-solistreportfieldlabel">{"Product Code"} </span>
              <input type="text" style={{"padding":"6 8","fontSize":"13px"}} className="wpf-textbox" onChange={() => placeholders.noop()} />
            </div>
            <div style={{"margin":"0 12 10 0","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span className="wpf-textblock wpf-solistreportfieldlabel">{"Product Name"} </span>
              <input type="text" style={{"padding":"6 8","fontSize":"13px"}} className="wpf-textbox" onChange={() => placeholders.noop()} />
            </div>
            <div style={{"margin":"0 12 10 0","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span className="wpf-textblock wpf-solistreportfieldlabel">{"Main Group"} </span>
              <select style={{"padding":"6 8","fontSize":"13px"}} className="wpf-combobox wpf-formcombo" />
            </div>
            <div style={{"margin":"0 12 10 0","display":"flex","flexDirection":"column"}} className="wpf-stackpanel">
              <span className="wpf-textblock wpf-solistreportfieldlabel">{"Product Type"} </span>
              <select style={{"padding":"6 8","fontSize":"13px"}} className="wpf-combobox wpf-formcombo" />
            </div>
            <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
              <label style={{"margin":"0 8 0 0"}} className="wpf-checkbox" />
              <span className="wpf-textblock">{"Include zero stock items"} </span>
            </div>
            <div style={{"display":"flex","flexDirection":"row"}} className="wpf-stackpanel">
              <button type="button" className="wpf-button wpf-solistreportshowbutton" onClick={() => placeholders.noop()} />
            </div>
          </div>
        </div>
        <div className="wpf-standardreportview.gridcontent">
          <table className="wpf-datagrid wpf-solistordersgrid">
            <div className="wpf-datagrid.columns">
              <div style={{"width":"52px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"120px"}} className="wpf-datagridtextcolumn" />
              <div className="wpf-datagridtextcolumn" />
              <div style={{"width":"140px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"130px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"70px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"100px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"100px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"110px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"100px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"100px"}} className="wpf-datagridtextcolumn" />
              <div style={{"width":"130px"}} className="wpf-datagridtextcolumn" />
            </div>
          </table>
        </div>
      </div>
    </div>
    </div>
  );
}

export default StockDetailsSummaryReportView;
