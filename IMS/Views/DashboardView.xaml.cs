using System.Windows.Controls;

namespace IMS.Views;

public partial class DashboardView : UserControl
{
    public DashboardView()
    {
        InitializeComponent();
        PageViewHost.Attach(this);
    }
}
