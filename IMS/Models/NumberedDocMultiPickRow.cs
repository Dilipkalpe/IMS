using System.Globalization;
using IMS.ViewModels;

namespace IMS.Models;

public sealed class NumberedDocMultiPickRow : ViewModelBase
{
    private bool _isSelected;

    public NumberedDocMultiPickRow(
        string docPrefix,
        int docNo,
        string formattedDocNo,
        string? party,
        string? status,
        DateTime? docDate)
    {
        DocPrefix = docPrefix;
        DocNo = docNo;
        FormattedDocNo = formattedDocNo;
        Party = party ?? string.Empty;
        Status = status ?? string.Empty;
        DocDate = docDate;
    }

    public string DocPrefix { get; }
    public int DocNo { get; }
    public string FormattedDocNo { get; }
    public string Party { get; }
    public string Status { get; }
    public DateTime? DocDate { get; }

    public string StatusDisplay => Status switch
    {
        "partially_delivered" => "Partially Delivered",
        "fully_delivered" => "Fully Delivered",
        "partially_invoiced" => "Partially Invoiced",
        "fully_invoiced" => "Fully Invoiced",
        "partially_received" => "Partially Received",
        "fully_received" => "Fully Received",
        "open" => "Open",
        "dispatched" => "Dispatched",
        "posted" => "Posted",
        _ => Status
    };

    public string DocDateDisplay =>
        DocDate?.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture) ?? "—";

    public bool IsSelected
    {
        get => _isSelected;
        set => SetProperty(ref _isSelected, value);
    }
}
