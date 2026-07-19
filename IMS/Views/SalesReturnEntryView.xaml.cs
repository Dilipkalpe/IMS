using System.Windows.Controls;

namespace IMS.Views;

public partial class SalesReturnEntryView : UserControl
{
    public SalesReturnEntryView()
    {
        InitializeComponent();
        Loaded += (_, _) => SalesEntryPrefixHelper.WirePrefixBox(DocPrefixBox);
        DataContextChanged += (_, _) => SalesEntryPrefixHelper.WirePrefixBox(DocPrefixBox);
    }
}
