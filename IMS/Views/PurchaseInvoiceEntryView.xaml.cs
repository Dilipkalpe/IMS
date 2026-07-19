using System.Windows.Controls;

namespace IMS.Views;

public partial class PurchaseInvoiceEntryView : UserControl
{
    public PurchaseInvoiceEntryView()
    {
        InitializeComponent();
        Loaded += (_, _) => PurchaseEntryPrefixHelper.WirePrefixBox(DocPrefixBox);
        DataContextChanged += (_, _) => PurchaseEntryPrefixHelper.WirePrefixBox(DocPrefixBox);
    }
}
