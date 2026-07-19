using System.Windows;
using System.Windows.Input;
using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class BillFormatsViewModel : MockPageViewModel
{
    private readonly MainViewModel _host;

    public BillFormatsViewModel(MainViewModel host) : base(
        "Bill Format Master",
        "Print layouts for sales, purchase, GRN, and other documents.",
        "\uE8A5",
        "Code", "Format Name", "Document Type", "Default",
        [
            new("Formats", "0", "\uE8A5", ThemeColors.Primary),
            new("Active", "0", "\uE73E", ThemeColors.Success),
            new("Defaults", "0", "\uE735", ThemeColors.Slate),
            new("Last Updated", "Today", "\uE823", ThemeColors.Warning)
        ],
        [],
        enableDelete: true,
        expandRows: false)
    {
        _host = host;
        EditRowCommand = CreateEditRowCommand(EditRow);
        DesignRowCommand = CreateDesignRowCommand(OpenDesignLayoutForRow);
        DesignLayoutCommand = new RelayCommand(OpenDesignLayoutFromToolbar, () => SelectedRow is not null);
        SubPageActions =
        [
            SubPageActionsFactory.Add(host, "Add Format", "\uE710", () => new AddBillFormatViewModel(host)),
            new SubPageAction
            {
                Title = "Print layout",
                IconGlyph = "\uE8A5",
                Command = DesignLayoutCommand
            }
        ];
        PropertyChanged += (_, e) =>
        {
            if (e.PropertyName == nameof(SelectedRow))
                (DesignLayoutCommand as RelayCommand)?.RaiseCanExecuteChanged();
        };
    }

    public ICommand DesignLayoutCommand { get; }

    protected override void TryLoadFromApi() => ApiListLoader.RefreshBillFormats(this);

    protected override void OnRowDeleted(MockRow row)
    {
        if (row.Source is SalesBillTemplateDto dto && dto.IsSystem)
        {
            MessageBox.Show(
                "System default formats cannot be deleted.",
                "Bill Format",
                MessageBoxButton.OK,
                MessageBoxImage.Information);
            return;
        }

        var id = ResolveTemplateId(row);
        if (string.IsNullOrWhiteSpace(id))
            return;

        ApiUiHelper.RunWithApiFireAndForget(async () =>
        {
            await ImsApiClient.DeleteSalesBillTemplateAsync(id);
            BillFormatTemplateService.InvalidateCache();
            SalesBillTemplateService.InvalidateCache();
            ApiListLoader.RefreshBillFormats(this);
        });

        MessageBox.Show(
            $"Format \"{row.Col2}\" ({row.Col1}) was deleted.",
            "Bill Format Deleted",
            MessageBoxButton.OK,
            MessageBoxImage.Information);
    }

    private void EditRow(MockRow row) =>
        _host.NavigateToSubPage(new AddBillFormatViewModel(_host, row));

    private void OpenDesignLayoutFromToolbar()
    {
        if (SelectedRow is null)
        {
            MessageBox.Show(
                "Select a format row in the list, then click Print layout.",
                "Bill Format Master",
                MessageBoxButton.OK,
                MessageBoxImage.Information);
            return;
        }

        OpenDesignLayoutForRow(SelectedRow);
    }

    private void OpenDesignLayoutForRow(MockRow row)
    {
        var id = ResolveTemplateId(row);
        if (string.IsNullOrWhiteSpace(id))
        {
            MessageBox.Show(
                "Could not open the designer for this row. Refresh the list and try again.",
                "Bill Format Master",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return;
        }

        _host.NavigateToSubPage(new BillFormatDesignViewModel(_host, id));
    }

    private static string? ResolveTemplateId(MockRow row) =>
        (row.Source as SalesBillTemplateDto)?.Id;

    public void RefreshStats()
    {
        if (StatsList.Count < 3)
            return;

        var active = AllRows.Count(r => string.Equals(r.Status, "Active", StringComparison.OrdinalIgnoreCase));
        var defaults = AllRows.Count(r => string.Equals(r.Col4, "Yes", StringComparison.OrdinalIgnoreCase));
        StatsList[0] = new MockStat("Formats", AllRows.Count.ToString("N0"), "\uE8A5", ThemeColors.Primary);
        StatsList[1] = new MockStat("Active", active.ToString("N0"), "\uE73E", ThemeColors.Success);
        StatsList[2] = new MockStat("Defaults", defaults.ToString("N0"), "\uE735", ThemeColors.Slate);
        OnPropertyChanged(nameof(Stats));
    }
}
