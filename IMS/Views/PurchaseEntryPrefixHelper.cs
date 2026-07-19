using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using IMS.ViewModels.SubPages;

namespace IMS.Views;

internal static class PurchaseEntryPrefixHelper
{
    private static readonly DependencyProperty WiredProperty =
        DependencyProperty.RegisterAttached(
            "PrefixWired",
            typeof(bool),
            typeof(PurchaseEntryPrefixHelper),
            new PropertyMetadata(false));

    private static readonly DependencyProperty CommittingProperty =
        DependencyProperty.RegisterAttached(
            "PrefixCommitting",
            typeof(bool),
            typeof(PurchaseEntryPrefixHelper),
            new PropertyMetadata(false));

    public static void WirePrefixBox(TextBox box)
    {
        if (box.GetValue(WiredProperty) is true)
            return;

        box.SetValue(WiredProperty, true);
        box.PreviewKeyDown += OnPrefixPreviewKeyDown;
        box.LostFocus += OnPrefixLostFocus;
        box.DataContextChanged += OnDataContextChanged;
    }

    private static void OnDataContextChanged(object sender, DependencyPropertyChangedEventArgs e) =>
        TryCommitIfReady(sender as TextBox);

    private static async void OnPrefixPreviewKeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key is not (Key.Tab or Key.Enter))
            return;

        if (sender is not TextBox box)
            return;

        try
        {
            box.GetBindingExpression(TextBox.TextProperty)?.UpdateSource();
            await CommitAsync(box);
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Prefix commit failed: {ex.Message}");
        }
    }

    private static async void OnPrefixLostFocus(object sender, RoutedEventArgs e)
    {
        if (sender is not TextBox box)
            return;

        try
        {
            box.GetBindingExpression(TextBox.TextProperty)?.UpdateSource();
            await CommitAsync(box);
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Prefix commit failed: {ex.Message}");
        }
    }

    internal static Task TryCommitPrefixOnNavigateAsync(TextBox box) => CommitAsync(box);

    private static async Task CommitAsync(TextBox box)
    {
        if (box.GetValue(CommittingProperty) is true)
            return;

        if (FindPrefixSupport(box) is not { IsPrefixReadOnly: false } support)
            return;

        try
        {
            box.SetValue(CommittingProperty, true);
            await support.CommitPrefixAsync();
        }
        finally
        {
            box.SetValue(CommittingProperty, false);
        }
    }

    private static void TryCommitIfReady(TextBox? box)
    {
        if (box is null || FindPrefixSupport(box) is null)
            return;

        box.GetBindingExpression(TextBox.TextProperty)?.UpdateSource();
    }

    private static IPurchaseEntryPrefixSupport? FindPrefixSupport(DependencyObject? start)
    {
        if (start is FrameworkElement { DataContext: IPurchaseEntryPrefixSupport direct })
            return direct;

        var current = System.Windows.Media.VisualTreeHelper.GetParent(start);
        while (current is not null)
        {
            if (current is FrameworkElement { DataContext: IPurchaseEntryPrefixSupport support })
                return support;

            current = System.Windows.Media.VisualTreeHelper.GetParent(current);
        }

        return null;
    }
}
