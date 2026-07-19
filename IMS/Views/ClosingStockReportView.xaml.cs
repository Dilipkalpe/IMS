using System.Windows.Controls;

namespace IMS.Views;

public partial class ClosingStockReportView : UserControl
{
    public ClosingStockReportView()
    {
        InitializeComponent();
        PageViewHost.Attach(this);
    }
}
