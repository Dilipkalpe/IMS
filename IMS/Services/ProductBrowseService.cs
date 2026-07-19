using System.Windows;
using IMS.ViewModels;
using IMS.Views;

namespace IMS.Services;

public static class ProductBrowseService
{
    public static IReadOnlyList<SalesProductInfo>? PickProducts(bool forPurchase, Window? owner = null)
    {
        try
        {
            var vm = new ProductBrowseViewModel(forPurchase);
            var window = new ProductBrowseWindow(vm)
            {
                Owner = owner ?? Application.Current?.MainWindow
            };

            return window.ShowDialog() == true ? vm.Results : null;
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                $"Could not open product browser: {ex.Message}",
                "Browse Products",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
            return null;
        }
    }

    public static SalesProductInfo? PickProduct(bool forPurchase, Window? owner = null)
    {
        var products = PickProducts(forPurchase, owner);
        return products is { Count: > 0 } ? products[0] : null;
    }
}
