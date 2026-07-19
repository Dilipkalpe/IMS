using System.Windows.Controls;

namespace IMS.Views;

public partial class ReorderLevelReportView : UserControl
{
    public ReorderLevelReportView()
    {
        InitializeComponent();
        PageViewHost.Attach(this);
    }
}
