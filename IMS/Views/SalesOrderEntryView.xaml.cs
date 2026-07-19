using System.Windows.Controls;
using IMS.Views.Controls;

namespace IMS.Views;

public partial class SalesOrderEntryView : UserControl
{
    public SalesOrderEntryView()
    {
        InitializeComponent();
        Loaded += OnLoaded;
        DataContextChanged += (_, _) => SalesEntryPrefixHelper.WirePrefixBox(DocPrefixBox);
    }

    private void OnLoaded(object sender, System.Windows.RoutedEventArgs e)
    {
        Focus();
        SalesEntryPrefixHelper.WirePrefixBox(DocPrefixBox);
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
