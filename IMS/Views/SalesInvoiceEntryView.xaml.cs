using System.Windows.Controls;

namespace IMS.Views;

public partial class SalesInvoiceEntryView : UserControl
{
    public SalesInvoiceEntryView()
    {
        InitializeComponent();
        Loaded += (_, _) => SalesEntryPrefixHelper.WirePrefixBox(DocPrefixBox);
        DataContextChanged += (_, _) => SalesEntryPrefixHelper.WirePrefixBox(DocPrefixBox);
    }
}
