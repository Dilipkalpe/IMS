using System.Globalization;
using IMS.ViewModels;

namespace IMS.Models;

public sealed class SalesOrderMultiPickRow : ViewModelBase
{
    private bool _isSelected;

    public SalesOrderMultiPickRow(
        string soPrefix,
        int docNo,
        string formattedDocNo,
        string? customer,
        string? status,
        DateTime? soDate)
    {
        SoPrefix = soPrefix;
        DocNo = docNo;
        FormattedDocNo = formattedDocNo;
        Customer = customer ?? string.Empty;
        Status = status ?? string.Empty;
        SoDate = soDate;
    }

    public string SoPrefix { get; }
    public int DocNo { get; }
    public string FormattedDocNo { get; }
    public string Customer { get; }
    public string Status { get; }
    public DateTime? SoDate { get; }

    public string StatusDisplay => Status switch
    {
        "partially_delivered" => "Partially Delivered",
        "fully_delivered" => "Fully Delivered",
        "open" => "Open",
        _ => Status
    };

    public string SoDateDisplay =>
        SoDate?.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture) ?? "—";

    public bool IsSelected
    {
        get => _isSelected;
        set => SetProperty(ref _isSelected, value);
    }
}
