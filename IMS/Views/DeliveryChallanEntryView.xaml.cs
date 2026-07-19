using System.Windows.Controls;
using IMS.Views.Controls;

namespace IMS.Views;

public partial class DeliveryChallanEntryView : UserControl
{
    public DeliveryChallanEntryView()
    {
        InitializeComponent();
        Loaded += (_, _) =>
        {
            Focus();
            SalesEntryPrefixHelper.WirePrefixBox(DocPrefixBox);
        };
        DataContextChanged += (_, _) => SalesEntryPrefixHelper.WirePrefixBox(DocPrefixBox);
    }

    public void FocusScanBox()
    {
        if (FindLineItemsPanel() is { } panel)
            panel.FocusScanBox();
    }

    private EntryLineItemsPanel? FindLineItemsPanel() =>
        FindChild<EntryLineItemsPanel>(this);

    private static T? FindChild<T>(System.Windows.DependencyObject parent) where T : class
    {
        var count = System.Windows.Media.VisualTreeHelper.GetChildrenCount(parent);
        for (var i = 0; i < count; i++)
        {
            var child = System.Windows.Media.VisualTreeHelper.GetChild(parent, i);
            if (child is T match)
                return match;
            var nested = FindChild<T>(child);
            if (nested is not null)
                return nested;
        }

        return null;
    }
}
