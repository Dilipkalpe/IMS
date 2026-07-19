using System.Windows.Controls;

namespace IMS.Views;

public partial class DueDayReportView : UserControl
{
    public DueDayReportView()
    {
        InitializeComponent();
        PageViewHost.Attach(this);
    }
}
