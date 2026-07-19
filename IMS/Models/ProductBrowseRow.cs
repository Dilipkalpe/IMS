using IMS.Services;
using IMS.ViewModels;

namespace IMS.Models;

public sealed class ProductBrowseRow : ViewModelBase
{
    private bool _isSelected;

    public int RowNumber { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Category { get; init; }
    public string? Unit { get; init; }
    public decimal Rate { get; init; }
    public decimal StockQty { get; init; }
    public string TaxType { get; init; } = "GST";
    public string TaxPercent { get; init; } = "18";

    public bool IsSelected
    {
        get => _isSelected;
        set => SetProperty(ref _isSelected, value);
    }

    public SalesProductInfo ToProductInfo() =>
        new(Code, Name, Rate, TaxType, TaxPercent);
}
