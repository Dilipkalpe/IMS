using System.Windows.Controls;

namespace IMS.Views;

public partial class ProductsView : UserControl
{
    public ProductsView()
    {
        InitializeComponent();
        PageViewHost.Attach(this);
    }
}
