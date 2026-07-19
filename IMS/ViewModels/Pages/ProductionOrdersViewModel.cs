using System.Globalization;
using System.Windows;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class ProductionOrdersViewModel : MockPageViewModel
{
    private readonly MainViewModel _host;

    public ProductionOrdersViewModel(MainViewModel host) : base(
        "Job Work",
        "Job work entries — materials from BOM, stage tracking, stock issue and finished goods receipt.",
        "\uE912",
        "Job Work No", "Manufacturing Item", "Final Qty", "Status",
        [
            new("Active", "0", "\uE912", ThemeColors.Purple),
            new("Scheduled", "0", "\uE823", ThemeColors.Primary),
            new("In Progress", "0", "\uE768", ThemeColors.Warning),
            new("Completed (Week)", "0", "\uE73E", ThemeColors.Success)
        ],
        [],
        enableDelete: true,
        expandRows: false)
    {
        _host = host;
        EditRowCommand = CreateEditRowCommand(EditRow);
        SubPageActions =
        [
            SubPageActionsFactory.Add(host, "Add Job Work", "\uE710", () => new WorkOrderViewModel(host))
        ];
    }

    protected override void TryLoadFromApi() => ApiListLoader.RefreshProductionOrders(this);

    protected override async Task<bool> DeleteRowCoreAsync(MockRow row)
    {
        if (!int.TryParse(row.Col1, NumberStyles.Integer, CultureInfo.InvariantCulture, out var productionNo))
            return false;

        var isCompleted = string.Equals(row.Status, "Completed", StringComparison.OrdinalIgnoreCase)
            || string.Equals(row.Col4, "Completed", StringComparison.OrdinalIgnoreCase);
        var prompt = isCompleted
            ? $"Job Work #{productionNo} is completed (stock was already posted).\n\nDelete this record?\n\nStock transfers are NOT reversed automatically."
            : $"Delete Job Work #{productionNo}?";

        if (MessageBox.Show(
                prompt,
                "Confirm Delete",
                MessageBoxButton.YesNo,
                isCompleted ? MessageBoxImage.Warning : MessageBoxImage.Question) != MessageBoxResult.Yes)
            return false;

        var deleted = false;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            await ImsApiClient.DeleteProductionOrderByNoAsync(productionNo);
            deleted = true;
        }, "Delete Job Work");

        if (!deleted)
            return false;

        ApiListLoader.RefreshProductionOrders(this);
        return true;
    }

    protected override void OnRowDeleted(MockRow row)
    {
        if (!int.TryParse(row.Col1, NumberStyles.Integer, CultureInfo.InvariantCulture, out var productionNo))
            return;

        MessageBox.Show(
            $"Job Work #{productionNo} was deleted.",
            "Job Work Deleted",
            MessageBoxButton.OK,
            MessageBoxImage.Information);
    }

    private void EditRow(MockRow row)
    {
        if (!int.TryParse(row.Col1, NumberStyles.Integer, CultureInfo.InvariantCulture, out var productionNo))
            return;

        _host.NavigateToSubPage(new WorkOrderViewModel(_host, productionNo));
    }

    public void RefreshStats(ProductionOrderStatsDto? stats, IReadOnlyList<ProductionOrderDto> items)
    {
        if (StatsList.Count < 4)
            return;

        var open = stats?.Open ?? items.Count(i => i.Status is "Open");
        var scheduled = items.Count(i => string.Equals(i.Status, "Open", StringComparison.OrdinalIgnoreCase));
        var inProgress = stats?.InProgress ?? items.Count(i =>
            string.Equals(i.Status, "In Progress", StringComparison.OrdinalIgnoreCase));
        var completedWeek = stats?.CompletedWeek ?? items.Count(i =>
            string.Equals(i.Status, "Completed", StringComparison.OrdinalIgnoreCase));

        StatsList[0] = new MockStat("Open", open.ToString("N0"), "\uE912", ThemeColors.Purple);
        StatsList[1] = new MockStat("Scheduled", scheduled.ToString("N0"), "\uE823", ThemeColors.Primary);
        StatsList[2] = new MockStat("In Progress", inProgress.ToString("N0"), "\uE768", ThemeColors.Warning);
        StatsList[3] = new MockStat("Completed (Week)", completedWeek.ToString("N0"), "\uE73E", ThemeColors.Success);
        OnPropertyChanged(nameof(Stats));
    }
}
