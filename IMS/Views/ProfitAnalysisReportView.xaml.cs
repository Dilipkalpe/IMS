using System.Windows.Controls;

namespace IMS.Views;

public partial class ProfitAnalysisReportView : UserControl
{
    public ProfitAnalysisReportView()
    {
        InitializeComponent();
        PageViewHost.Attach(this);
    }
}
