using System.Windows.Controls;

namespace IMS.Views;

public partial class OpeningStockReportView : UserControl
{
    public OpeningStockReportView()
    {
        InitializeComponent();
        PageViewHost.Attach(this);
    }
}
