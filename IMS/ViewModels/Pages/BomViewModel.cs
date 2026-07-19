using IMS.Models;
using IMS.Resources;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels;

public sealed class BomViewModel : MockPageViewModel
{
    private readonly MainViewModel _host;

    public BomViewModel(MainViewModel host) : base(
        "Bill of Material (BOM)",
        "Define raw materials and consumables per finished product — used by Production to generate work order lines.",
        "\uE8F1",
        "Product Code", "Product Name", "Components", "Revision",
        [
            new("Active BOMs", "0", "\uE8F1", ThemeColors.Purple),
            new("Products", "0", "\uE7B8", ThemeColors.Primary),
            new("Avg Raw Lines", "0", "\uE823", ThemeColors.Warning),
            new("Avg Consumables", "0", "\uE8A5", ThemeColors.Slate)
        ],
        [])
    {
        SubPageActions =
        [
            SubPageActionsFactory.Add(host, "Add / Edit BOM", "\uE710",
                () => new SubPages.BomViewModel(host, string.Empty, string.Empty, string.Empty))
        ];
        EditRowCommand = CreateEditRowCommand(EditRow);
        _host = host;
    }

    protected override void TryLoadFromApi() => ApiListLoader.RefreshBoms(this);

    private void EditRow(MockRow row)
    {
        var code = row.Col1?.Trim() ?? string.Empty;
        var name = row.Col2?.Trim() ?? string.Empty;
        _host.NavigateToSubPage(new SubPages.BomViewModel(_host, code, name, code));
    }

    public void RefreshStats(IReadOnlyList<BomDto> items)
    {
        if (StatsList.Count < 4)
            return;

        var active = items.Count(i => !string.Equals(i.Status, "inactive", StringComparison.OrdinalIgnoreCase));
        var rawAvg = items.Count > 0
            ? items.Average(i => i.RawMaterials?.Count ?? 0)
            : 0;
        var conAvg = items.Count > 0
            ? items.Average(i => i.Consumables?.Count ?? 0)
            : 0;

        StatsList[0] = new MockStat("Active BOMs", active.ToString("N0"), "\uE8F1", ThemeColors.Purple);
        StatsList[1] = new MockStat("Products", items.Count.ToString("N0"), "\uE7B8", ThemeColors.Primary);
        StatsList[2] = new MockStat("Avg Raw Lines", rawAvg.ToString("N1"), "\uE823", ThemeColors.Warning);
        StatsList[3] = new MockStat("Avg Consumables", conAvg.ToString("N1"), "\uE8A5", ThemeColors.Slate);
        OnPropertyChanged(nameof(Stats));
    }
}
