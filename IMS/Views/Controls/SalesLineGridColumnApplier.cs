using System.Windows;
using System.Windows.Controls;
using IMS.Services;

namespace IMS.Views.Controls;

internal static class SalesLineGridColumnApplier
{
    private static readonly string[] ColumnKeys =
    [
        "actions", "sr", "code", "itemDescription", "balStk", "qty", "rate", "salesRate", "discPercent", "taxableValue",
        "cgstPercent", "cgstAmount", "sgstPercent", "sgstAmount", "igstPercent", "igstAmount", "lineTotal"
    ];

    private static readonly HashSet<string> IntraStateOnly = new(StringComparer.Ordinal)
    {
        "cgstPercent", "cgstAmount", "sgstPercent", "sgstAmount"
    };

    private static readonly HashSet<string> InterStateOnly = new(StringComparer.Ordinal)
    {
        "igstPercent", "igstAmount"
    };

    public static void Apply(DataGrid grid, LineGridColumnContext? context)
    {
        if (grid.Columns.Count == 0)
            return;

        var moduleKey = context?.ModuleKey ?? "sales_order";
        var visible = GridColumnPreferenceService.GetCachedVisibleKeys(moduleKey)
            .ToHashSet(StringComparer.Ordinal);
        var interState = context?.IsInterStateTax == true;
        var isPurchaseInvoice = string.Equals(moduleKey, "purchase_invoice", StringComparison.Ordinal);
        var isPurchaseModule = moduleKey is "purchase_order" or "grn" or "purchase_invoice" or "purchase_return";

        for (var i = 0; i < grid.Columns.Count && i < ColumnKeys.Length; i++)
        {
            var key = ColumnKeys[i];
            var column = grid.Columns[i];

            if (key == "salesRate" && !isPurchaseInvoice)
            {
                column.Visibility = Visibility.Collapsed;
                continue;
            }

            if (key == "balStk" && !isPurchaseModule)
            {
                column.Visibility = Visibility.Collapsed;
                continue;
            }

            var userVisible = visible.Contains(key);
            if (IntraStateOnly.Contains(key))
                column.Visibility = userVisible && !interState ? Visibility.Visible : Visibility.Collapsed;
            else if (InterStateOnly.Contains(key))
                column.Visibility = userVisible && interState ? Visibility.Visible : Visibility.Collapsed;
            else
                column.Visibility = userVisible ? Visibility.Visible : Visibility.Collapsed;
        }
    }

    public static void Wire(DataGrid grid, Func<LineGridColumnContext?> getContext)
    {
        async void OnGridReady()
        {
            try
            {
                var context = getContext();
                if (context is not null)
                    await GridColumnPreferenceService.LoadVisibleKeysAsync(context.ModuleKey);

                Apply(grid, getContext());
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Column preference load failed: {ex.Message}");
                Apply(grid, getContext());
            }
        }

        grid.Loaded += (_, _) => OnGridReady();

        GridColumnPreferenceService.PreferencesChanged += (_, changedModule) =>
        {
            var context = getContext();
            if (context is null)
                return;

            if (!string.IsNullOrEmpty(changedModule)
                && !string.Equals(changedModule, context.ModuleKey, StringComparison.Ordinal))
                return;

            if (grid.Dispatcher.CheckAccess())
                Apply(grid, context);
            else
                grid.Dispatcher.Invoke(() => Apply(grid, context));
        };

        grid.DataContextChanged += (_, _) =>
        {
            var context = getContext();
            if (context is not null)
            {
                if (grid.DataContext is System.ComponentModel.INotifyPropertyChanged notify)
                {
                    notify.PropertyChanged += (_, e) =>
                    {
                        if (e.PropertyName is "IsInterStateTax")
                        {
                            var current = getContext();
                            if (grid.Dispatcher.CheckAccess())
                                Apply(grid, current);
                            else
                                grid.Dispatcher.Invoke(() => Apply(grid, current));
                        }
                    };
                }

                _ = GridColumnPreferenceService.LoadVisibleKeysAsync(context.ModuleKey);
            }

            Apply(grid, getContext());
        };
    }
}
