using System.Windows.Controls;

namespace IMS.Views;

public partial class SalesAnalysisReportView : UserControl
{
    public SalesAnalysisReportView()
    {
        InitializeComponent();
        PageViewHost.Attach(this);
    }
}
