using System.Windows.Controls;

namespace IMS.Views;

public partial class PurchaseAnalysisReportView : UserControl
{
    public PurchaseAnalysisReportView()
    {
        InitializeComponent();
        PageViewHost.Attach(this);
    }
}
