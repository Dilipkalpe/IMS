using System.Globalization;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels.SubPages;

public sealed class AddPurchaseOrderViewModel : PurchaseDocumentEntryViewModelBase
{
    private static readonly string[] DefaultDeliveryPriorities = ["Select", "Normal", "Urgent", "Express"];

    private DateTime? _poDate = DateTime.Today;
    private string _paymentTerms = string.Empty;
    private string? _deliveryPriority = DefaultDeliveryPriorities[0];
    private string _billingAddress = string.Empty;
    private string _shipToAddress = string.Empty;

    public AddPurchaseOrderViewModel(MainViewModel host, PurchaseOrderWorkspaceViewModel workspace, int docNo)
        : this(host, workspace, docNo, forEdit: false)
    {
    }

    public AddPurchaseOrderViewModel(
        MainViewModel host,
        PurchaseOrderWorkspaceViewModel workspace,
        int docNo,
        bool forEdit)
        : base(host, workspace, docNo, forEdit)
    {
    }

    public IReadOnlyList<string> DeliveryPriorities { get; } = DefaultDeliveryPriorities;

    public DateTime? PoDate
    {
        get => _poDate;
        set
        {
            if (!SetProperty(ref _poDate, value))
                return;
            BillDate = value?.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture) ?? string.Empty;
        }
    }

    public string PaymentTerms
    {
        get => _paymentTerms;
        set => SetProperty(ref _paymentTerms, value);
    }

    public string? DeliveryPriority
    {
        get => _deliveryPriority;
        set => SetProperty(ref _deliveryPriority, value);
    }

    public string BillingAddress
    {
        get => _billingAddress;
        set => SetProperty(ref _billingAddress, value);
    }

    public string ShipToAddress
    {
        get => _shipToAddress;
        set => SetProperty(ref _shipToAddress, value);
    }

    protected override void InitializeModuleDefaults()
    {
        PoDate = DateTime.Today;
        PaymentTerms = string.Empty;
        DeliveryPriority = DefaultDeliveryPriorities[0];
        BillingAddress = string.Empty;
        ShipToAddress = string.Empty;
    }

    protected override void ApplyModuleFromDto(NumberedPurchaseDocumentDto dto)
    {
        PoDate = dto.PoDate?.Date ?? DateTime.Today;
        PaymentTerms = dto.PaymentTerms ?? string.Empty;
        DeliveryPriority = string.IsNullOrWhiteSpace(dto.DeliveryPriority)
            ? DeliveryPriorities[0]
            : dto.DeliveryPriority;
        BillingAddress = dto.BillingAddress ?? string.Empty;
        ShipToAddress = dto.ShipToAddress ?? string.Empty;
    }

    public override void MapModuleToDto(NumberedPurchaseDocumentDto dto)
    {
        dto.PoDate = PoDate ?? DateTime.Today;
        dto.PaymentTerms = PaymentTerms?.Trim();
        dto.DeliveryPriority = string.IsNullOrWhiteSpace(DeliveryPriority) || DeliveryPriority == "Select"
            ? "Normal"
            : DeliveryPriority.Trim();
        dto.BillingAddress = BillingAddress?.Trim();
        dto.ShipToAddress = ShipToAddress?.Trim();
    }

}
