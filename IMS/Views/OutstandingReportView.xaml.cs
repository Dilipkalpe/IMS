using System.Windows.Controls;

namespace IMS.Views;

public partial class OutstandingReportView : UserControl
{
    public OutstandingReportView()
    {
        InitializeComponent();
        PageViewHost.Attach(this);
    }
}
