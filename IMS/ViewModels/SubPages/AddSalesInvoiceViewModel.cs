using System.Globalization;
using System.Windows;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
namespace IMS.ViewModels.SubPages;

public sealed class AddSalesInvoiceViewModel : SalesDocumentEntryViewModelBase
{
    private DateTime? _invoiceDate = DateTime.Today;
    private DateTime? _dueDate;
    private string _dcReference = string.Empty;
    private string _ewayBillNo = string.Empty;
    private DateTime? _ewayBillDate;
    private string _vehicleNo = string.Empty;
    private string _transporter = string.Empty;
    private string _transporterId = string.Empty;
    private string _distanceKm = string.Empty;

    public AddSalesInvoiceViewModel(MainViewModel host, SalesInvoiceWorkspaceViewModel workspace, int docNo)
        : this(host, workspace, docNo, forEdit: false)
    {
    }

    public AddSalesInvoiceViewModel(
        MainViewModel host,
        SalesInvoiceWorkspaceViewModel workspace,
        int docNo,
        bool forEdit)
        : base(host, workspace, docNo, forEdit)
    {
        LoadFromDeliveryChallansCommand = new AsyncRelayCommand(LoadFromDeliveryChallansAsync);
        RecordPaymentCommand = new AsyncRelayCommand(RecordPaymentAsync, () => CanRecordPayment);
        PropertyChanged += (_, e) =>
        {
            if (e.PropertyName is nameof(Net) or nameof(SaleAmount) or nameof(PaymentType) or nameof(Customer)
                or nameof(PlaceOfSupply) or nameof(Discount) or nameof(SpDiscount))
                RefreshPaymentDisplayProperties();
        };
    }

    public override bool ShowRecordPaymentAction => true;

    public override string DocumentTotalLabel => "Invoice Total";

    public bool ShowSourceRefColumn => true;

    public ICommand LoadFromDeliveryChallansCommand { get; }

    public DateTime? InvoiceDate
    {
        get => _invoiceDate;
        set
        {
            if (!SetProperty(ref _invoiceDate, value))
                return;
            BillDate = value?.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture) ?? string.Empty;
        }
    }

    public string DcReference
    {
        get => _dcReference;
        set => SetProperty(ref _dcReference, value);
    }

    public string Gstin
    {
        get => CustomerGstin;
        set => CustomerGstin = value;
    }

    public DateTime? DueDate
    {
        get => _dueDate;
        set => SetProperty(ref _dueDate, value);
    }

    public string EwayBillNo
    {
        get => _ewayBillNo;
        set => SetProperty(ref _ewayBillNo, value);
    }

    public DateTime? EwayBillDate
    {
        get => _ewayBillDate;
        set => SetProperty(ref _ewayBillDate, value);
    }

    public string VehicleNo
    {
        get => _vehicleNo;
        set => SetProperty(ref _vehicleNo, value);
    }

    public string Transporter
    {
        get => _transporter;
        set => SetProperty(ref _transporter, value);
    }

    public string TransporterId
    {
        get => _transporterId;
        set => SetProperty(ref _transporterId, value);
    }

    public string DistanceKm
    {
        get => _distanceKm;
        set => SetProperty(ref _distanceKm, value);
    }

    public string BillAmountDisplay => Net;

    public bool CanRecordPayment =>
        !string.Equals(PaymentType, "Cash", StringComparison.OrdinalIgnoreCase)
        && InvoicePaymentSummarySupport.ParseMoney(BalanceDueDisplay) > 0.001m
        && HasValidCustomer();

    public new ICommand RecordPaymentCommand { get; }

    protected override async Task SaveAndCloseAsync()
    {
        if (!await EnsureSavedAsync())
            return;

        await PrepareFreshBillAsync();
    }

    protected override async Task LoadLookupsAsync()
    {
        await base.LoadLookupsAsync();
        EnsureBlankCustomerOption();
    }

    private void EnsureBlankCustomerOption()
    {
        if (Customers.Any(string.IsNullOrEmpty))
            return;

        var list = new List<string> { string.Empty };
        list.AddRange(Customers);
        SetCustomers(list);
    }

    protected override void InitializeModuleDefaults()
    {
        InvoiceDate = DateTime.Today;
        DueDate = null;
        DcReference = string.Empty;
        CustomerGstin = string.Empty;
        PlaceOfSupply = CompanyProfileService.Current.PlaceOfSupply;
        PaymentType = InvoicePaymentOptions.DefaultPaymentType;
        PaymentMode = InvoicePaymentOptions.DefaultPaymentMode;
        PaidAmountDisplay = "0.00";
        EwayBillNo = string.Empty;
        EwayBillDate = null;
        VehicleNo = string.Empty;
        Transporter = string.Empty;
        TransporterId = string.Empty;
        DistanceKm = string.Empty;
        RefreshGstSummaryProperties();
    }

    protected override void ApplyModuleFromDto(NumberedSalesDocumentDto dto)
    {
        InvoiceDate = dto.InvoiceDate?.Date ?? DateTime.Today;
        DueDate = dto.DueDate?.Date;
        DcReference = dto.DcReference ?? string.Empty;
        CustomerGstin = dto.Gstin ?? string.Empty;
        PlaceOfSupply = dto.PlaceOfSupply ?? string.Empty;
        EwayBillNo = dto.EwayBillNo ?? string.Empty;
        EwayBillDate = dto.EwayBillDate?.Date;
        VehicleNo = dto.VehicleNo ?? string.Empty;
        Transporter = dto.Transporter ?? string.Empty;
        TransporterId = dto.TransporterId ?? string.Empty;
        DistanceKm = dto.DistanceKm > 0
            ? dto.DistanceKm.ToString("0.###", CultureInfo.InvariantCulture)
            : string.Empty;
        InvoicePaymentFieldsMixin.ApplyFromDto(
            dto.PaymentType,
            dto.PaymentMode,
            v => PaymentType = v,
            v => PaymentMode = v);
        InvoicePaymentSummarySupport.ApplyAmountsFromDto(
            dto,
            _ => { },
            v => PaidAmountDisplay = v,
            _ => { });
        RefreshPaymentDisplayProperties();
    }

    protected override void MapModuleToDto(NumberedSalesDocumentDto dto)
    {
        dto.InvoiceDate = InvoiceDate ?? DateTime.Today;
        dto.DueDate = DueDate;
        dto.DcReference = DcReference?.Trim();
        dto.DcReferences = SalesLineItemSourceMapper.BuildDcReferences(LineItems);
        dto.Gstin = CustomerGstin?.Trim();
        dto.PlaceOfSupply = PlaceOfSupply?.Trim();
        dto.EwayBillNo = EwayBillNo?.Trim();
        dto.EwayBillDate = EwayBillDate;
        dto.VehicleNo = VehicleNo?.Trim();
        dto.Transporter = Transporter?.Trim();
        dto.TransporterId = TransporterId?.Trim();
        dto.DistanceKm = decimal.TryParse(
            DistanceKm?.Trim(),
            NumberStyles.Number,
            CultureInfo.InvariantCulture,
            out var km)
            ? km
            : 0m;
        InvoicePaymentFieldsMixin.MapToDto(
            PaymentType,
            PaymentMode,
            Net,
            PaidAmountDisplay,
            v => dto.PaymentType = v,
            v => dto.PaymentMode = v,
            v => dto.Status = v,
            v => dto.BillAmount = v,
            v => dto.PaidAmount = v,
            v => dto.BalanceDue = v);
    }

    protected override SalesLineItem MapDtoToLine(SalesOrderLineDto line)
    {
        var item = base.MapDtoToLine(line);
        if (!string.IsNullOrWhiteSpace(line.DcFormattedDocNo))
            SalesLineItemSourceMapper.ApplyDeliveryChallanSource(item, line);
        return item;
    }

    protected override SalesOrderLineDto MapLineToDto(SalesLineItem line)
    {
        var dto = base.MapLineToDto(line);
        if (line.HasDeliveryChallanSource)
        {
            dto.DcPrefix = string.IsNullOrWhiteSpace(line.DcPrefix) ? "DC" : line.DcPrefix;
            dto.DcDocNo = line.DcDocNo;
            dto.DcFormattedDocNo = line.DcFormattedDocNo;
            dto.DcLineSr = line.DcLineSr;
            if (line.MaxDeliverQty is decimal max)
                dto.DcPendingQty = max.ToString("0.###", CultureInfo.InvariantCulture);
        }

        return dto;
    }

    private async Task LoadFromDeliveryChallansAsync()
    {
        var customer = Customer?.Trim();
        if (string.IsNullOrWhiteSpace(customer))
        {
            MessageBox.Show(
                "Enter or select a customer before loading delivery challans.",
                "Sales Invoice",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return;
        }

        var challans = await DocumentConsolidationPickService.PickDeliveryChallansForInvoiceAsync(
            customer,
            WindowHelper.GetOwnerWindow());
        if (challans is null || challans.Count == 0)
            return;

        if (LineItems.Count > 0
            && MessageBox.Show(
                "Replace current line items with pending lines from selected delivery challans?",
                "Load from Delivery Challans",
                MessageBoxButton.YesNo,
                MessageBoxImage.Question) != MessageBoxResult.Yes)
            return;

        var lines = await DocumentConsolidationPickService.LoadInvoiceLinesFromDeliveryChallansAsync(
            customer,
            challans);
        if (lines is null || lines.Count == 0)
            return;

        ClearLineItems();
        var sr = 1;
        foreach (var line in lines.OrderBy(l => l.DcFormattedDocNo).ThenBy(l => l.DcLineSr))
        {
            line.Sr = sr++;
            var item = MapDtoToLine(line);
            item.RecalculateAmount();
            LineItems.Add(item);
        }

        DcReference = string.Join(", ", challans.Select(c => c.FormattedDocNo).Distinct(StringComparer.OrdinalIgnoreCase));
        RecalculateTotals();
    }

    private async Task RecordPaymentAsync()
    {
        if (!CanRecordPayment)
            return;

        if (!await EnsureSavedAsync())
            return;

        var balance = InvoicePaymentSummarySupport.ParseMoney(BalanceDueDisplay);
        if (balance <= 0)
        {
            await ReloadPaymentFromApiAsync();
            balance = InvoicePaymentSummarySupport.ParseMoney(BalanceDueDisplay);
        }

        if (balance <= 0)
        {
            MessageBox.Show("This invoice has no balance due.", "Payment",
                MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }

        var seed = new InvoicePaymentSeed
        {
            SourceDocType = "sales_invoice",
            SourceDocId = SavedDocumentId,
            FormattedDocNo = FormattedDocNo,
            PartyName = Customer?.Trim() ?? string.Empty,
            AmountDue = balance,
            CashBank = InvoicePaymentSummarySupport.PaymentModeToCashBank(PaymentMode),
            VoucherKind = "receipt"
        };

        Host.OpenReceiptVoucherForInvoice(seed, () => _ = ReloadPaymentFromApiAsync());
    }

    private async Task ReloadPaymentFromApiAsync()
    {
        if (!ImsApiClient.IsAvailable)
            return;

        try
        {
            NumberedSalesDocumentDto? dto = null;
            if (int.TryParse(BillNo, out var docNo) && docNo > 0)
                dto = await ImsApiClient.GetSalesDocumentByNoAsync(EntryType, docNo, EffectiveDocPrefix());
            else if (!string.IsNullOrWhiteSpace(FormattedDocNo))
                dto = await ImsApiClient.GetSalesDocumentByFormattedAsync(EntryType, FormattedDocNo);

            if (dto is null)
                return;

            InvoicePaymentSummarySupport.ApplyAmountsFromDto(
                dto,
                _ => { },
                v => PaidAmountDisplay = v,
                _ => { });
            RefreshPaymentDisplayProperties();
        }
        catch
        {
            // ignore refresh errors
        }
    }

    private void RefreshPaymentDisplayProperties()
    {
        OnPropertyChanged(nameof(BillAmountDisplay));
        OnPropertyChanged(nameof(BalanceDueDisplay));
        OnPropertyChanged(nameof(CanRecordPayment));
        RefreshGstSummaryProperties();
        (RecordPaymentCommand as AsyncRelayCommand)?.RaiseCanExecuteChanged();
    }

    protected override async Task AfterDocumentSavedAsync()
    {
        await base.AfterDocumentSavedAsync().ConfigureAwait(true);

        var owner = Application.Current?.MainWindow;
        if (owner is null)
            return;

        await InvoiceCommunicationCoordinator.HandleAfterSaveAsync(
            owner,
            CommunicationDocumentKind.SalesInvoice,
            FormattedDocNo,
            BillDate,
            Customer,
            Net,
            BalanceDueDisplay,
            "customer");
    }
}
