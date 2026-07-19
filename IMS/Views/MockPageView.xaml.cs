using System.Windows.Controls;

namespace IMS.Views;

public partial class MockPageView : UserControl
{
    public MockPageView()
    {
        InitializeComponent();
        PageViewHost.Attach(this);
    }
}
