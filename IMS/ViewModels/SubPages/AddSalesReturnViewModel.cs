using System.Globalization;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels.SubPages;

public sealed class AddSalesReturnViewModel : SalesDocumentEntryViewModelBase
{
    private DateTime? _returnDate = DateTime.Today;
    private string _invoiceReference = string.Empty;
    private string _returnReason = string.Empty;
    private string _qcRemark = string.Empty;
    private string _returnWarehouse = string.Empty;

    public AddSalesReturnViewModel(MainViewModel host, SalesReturnWorkspaceViewModel workspace, int docNo)
        : this(host, workspace, docNo, forEdit: false)
    {
    }

    public AddSalesReturnViewModel(
        MainViewModel host,
        SalesReturnWorkspaceViewModel workspace,
        int docNo,
        bool forEdit)
        : base(host, workspace, docNo, forEdit)
    {
    }

    public DateTime? ReturnDate
    {
        get => _returnDate;
        set
        {
            if (!SetProperty(ref _returnDate, value))
                return;
            BillDate = value?.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture) ?? string.Empty;
        }
    }

    public string InvoiceReference
    {
        get => _invoiceReference;
        set => SetProperty(ref _invoiceReference, value);
    }

    public string ReturnReason
    {
        get => _returnReason;
        set => SetProperty(ref _returnReason, value);
    }

    public string QcRemark
    {
        get => _qcRemark;
        set => SetProperty(ref _qcRemark, value);
    }

    public string ReturnWarehouse
    {
        get => _returnWarehouse;
        set => SetProperty(ref _returnWarehouse, value);
    }

    protected override void InitializeModuleDefaults()
    {
        ReturnDate = DateTime.Today;
        InvoiceReference = string.Empty;
        ReturnReason = string.Empty;
        QcRemark = string.Empty;
        ReturnWarehouse = string.Empty;
    }

    protected override void ApplyModuleFromDto(NumberedSalesDocumentDto dto)
    {
        ReturnDate = dto.ReturnDate?.Date ?? DateTime.Today;
        InvoiceReference = dto.InvoiceReference ?? string.Empty;
        ReturnReason = dto.ReturnReason ?? string.Empty;
        QcRemark = dto.QcRemark ?? string.Empty;
        ReturnWarehouse = dto.ReturnWarehouse ?? string.Empty;
    }

    protected override void MapModuleToDto(NumberedSalesDocumentDto dto)
    {
        dto.ReturnDate = ReturnDate ?? DateTime.Today;
        dto.InvoiceReference = InvoiceReference?.Trim();
        dto.ReturnReason = ReturnReason?.Trim();
        dto.QcRemark = QcRemark?.Trim();
        dto.ReturnWarehouse = ReturnWarehouse?.Trim();
    }
}
