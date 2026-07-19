using System.Windows.Controls;

namespace IMS.Views;

public partial class GrnEntryView : UserControl
{
    public GrnEntryView()
    {
        InitializeComponent();
        Loaded += (_, _) => PurchaseEntryPrefixHelper.WirePrefixBox(DocPrefixBox);
        DataContextChanged += (_, _) => PurchaseEntryPrefixHelper.WirePrefixBox(DocPrefixBox);
    }
}
