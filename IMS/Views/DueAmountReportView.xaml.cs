using System.Windows.Controls;

namespace IMS.Views;

public partial class DueAmountReportView : UserControl
{
    public DueAmountReportView()
    {
        InitializeComponent();
        PageViewHost.Attach(this);
    }
}
