using System.Windows.Controls;

namespace IMS.Views;

public partial class PurchaseOrderEntryView : UserControl
{
    public PurchaseOrderEntryView()
    {
        InitializeComponent();
        Loaded += (_, _) => PurchaseEntryPrefixHelper.WirePrefixBox(DocPrefixBox);
        DataContextChanged += (_, _) => PurchaseEntryPrefixHelper.WirePrefixBox(DocPrefixBox);
    }
}
