using System.Windows.Controls;

namespace IMS.Views;

public partial class LedgerReportView : UserControl
{
    public LedgerReportView()
    {
        InitializeComponent();
        PageViewHost.Attach(this);
    }
}
