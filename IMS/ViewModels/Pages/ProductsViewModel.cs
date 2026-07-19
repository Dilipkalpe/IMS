using System.Windows;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class ProductsViewModel : MockPageViewModel
{
    private readonly MainViewModel _host;

    public ProductsViewModel(MainViewModel host) : base(
        "Product / Item Master",
        "Product master — raw materials, components, and finished goods.",
        "\uE7B8",
        "SKU", "Name", "Category", "Unit",
        [
            new("Active Products", "0", "\uE7B8", ThemeColors.Primary),
            new("Raw Materials", "0", "\uE7C4", ThemeColors.Slate),
            new("Components", "0", "\uE8F1", ThemeColors.Purple),
            new("Finished Goods", "0", "\uE7BF", ThemeColors.Success)
        ],
        [],
        enableDelete: true,
        expandRows: false)
    {
        _host = host;
        EditRowCommand = CreateEditRowCommand(EditRow);
        BomRowCommand = CreateBomRowCommand(OpenBom);
        SubPageActions =
        [
            SubPageActionsFactory.Add(host, "Add Product", "\uE710", () => new AddProductViewModel(host))
        ];
    }

    protected override void TryLoadFromApi() => ApiListLoader.RefreshProducts(this);

    private void EditRow(MockRow row)
    {
        _host.NavigateToSubPage(new AddProductViewModel(_host, row.Col1));
    }

    private void OpenBom(MockRow row) => _ = OpenBomAsync(row);

    private async Task OpenBomAsync(MockRow row)
    {
        var product = row.Source as ProductDto;
        if (product is null && await ImsApiClient.CheckHealthAsync())
            product = await ImsApiClient.GetProductByCodeAsync(row.Col1);

        product ??= new ProductDto
        {
            Code = row.Col1,
            Name = row.Col2,
            Category = row.Col3,
            Unit = row.Col4
        };

        var vm = await SubPages.BomViewModel.CreateForProductAsync(_host, product);
        _host.NavigateToSubPage(vm);
    }

    protected override void OnRowDeleted(MockRow row)
    {
        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            await ImsApiClient.DeleteProductByCodeAsync(row.Col1);
            ApiListLoader.RefreshProducts(this);
        });
        MessageBox.Show(
            $"Product \"{row.Col2}\" ({row.Col1}) was deleted.",
            "Product Deleted",
            MessageBoxButton.OK,
            MessageBoxImage.Information);
    }

    public void RefreshStats()
    {
        var active = AllRows.Count(r => string.Equals(r.Status, "Active", StringComparison.OrdinalIgnoreCase));
        var raw = AllRows.Count(r => ContainsCategory(r, "raw"));
        var component = AllRows.Count(r => ContainsCategory(r, "component"));
        var finished = AllRows.Count(r => ContainsCategory(r, "finished"));

        ReplaceStats([
            new MockStat("Active Products", active.ToString("N0"), "\uE7B8", ThemeColors.Primary),
            new MockStat("Raw Materials", raw.ToString("N0"), "\uE7C4", ThemeColors.Slate),
            new MockStat("Components", component.ToString("N0"), "\uE8F1", ThemeColors.Purple),
            new MockStat("Finished Goods", finished.ToString("N0"), "\uE7BF", ThemeColors.Success)
        ]);
    }

    private static bool ContainsCategory(MockRow row, string keyword) =>
        row.Col3.Contains(keyword, StringComparison.OrdinalIgnoreCase);
}
