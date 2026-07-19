using System.Windows;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.ViewModels;
using IMS.Views;

namespace IMS.Services;

public static class SalesOrderPickService
{
    public static async Task<IReadOnlyList<SalesOrderReferenceDto>?> PickMultipleForDeliveryAsync(
        string customer,
        Window? owner = null)
    {
        if (string.IsNullOrWhiteSpace(customer))
            return null;

        if (!await ImsApiClient.CheckHealthAsync())
        {
            MessageBox.Show(
                owner ?? Application.Current?.MainWindow,
                "API is not available to load sales orders.",
                "Sales Orders",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return null;
        }

        PendingSalesOrdersResponseDto? pending = null;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            pending = await ImsApiClient.GetPendingSalesOrdersForDeliveryAsync(customer);
        }, "Sales Orders");

        if (pending?.Items is null || pending.Items.Count == 0)
        {
            MessageBox.Show(
                owner ?? Application.Current?.MainWindow,
                $"No open or partially delivered sales orders with pending quantity for customer \"{customer}\".",
                "Sales Orders",
                MessageBoxButton.OK,
                MessageBoxImage.Information);
            return null;
        }

        var vm = new SalesOrderMultiPickViewModel(customer, pending.Items);
        var window = new SalesOrderMultiPickWindow(vm)
        {
            Owner = owner ?? Application.Current?.MainWindow
        };

        return window.ShowDialog() == true ? vm.Result : null;
    }

    public static async Task<IReadOnlyList<SalesOrderLineDto>?> LoadPendingLinesAsync(
        string customer,
        IReadOnlyList<SalesOrderReferenceDto> orders)
    {
        PendingDeliveryLinesResponseDto? response = null;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            response = await ImsApiClient.GetPendingDeliveryLinesAsync(new PendingDeliveryLinesRequestDto
            {
                Customer = customer,
                SalesOrders = orders.ToList()
            });
        }, "Load Lines");

        return response?.Lines;
    }
}
