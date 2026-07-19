using System.Windows.Controls;

namespace IMS.Views;

public partial class PurchaseReturnEntryView : UserControl
{
    public PurchaseReturnEntryView()
    {
        InitializeComponent();
        Loaded += (_, _) => PurchaseEntryPrefixHelper.WirePrefixBox(DocPrefixBox);
        DataContextChanged += (_, _) => PurchaseEntryPrefixHelper.WirePrefixBox(DocPrefixBox);
    }
}
