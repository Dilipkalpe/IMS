using System.Globalization;
using System.Windows;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels.SubPages;

public sealed class AddPurchaseInvoiceViewModel : PurchaseDocumentEntryViewModelBase
{
    private DateTime? _invoiceDate = DateTime.Today;
    private DateTime? _dueDate;
    private string _grnReference = string.Empty;

    public AddPurchaseInvoiceViewModel(MainViewModel host, PurchaseInvoiceWorkspaceViewModel workspace, int docNo)
        : this(host, workspace, docNo, forEdit: false)
    {
    }

    public AddPurchaseInvoiceViewModel(
        MainViewModel host,
        PurchaseInvoiceWorkspaceViewModel workspace,
        int docNo,
        bool forEdit)
        : base(host, workspace, docNo, forEdit)
    {
        LoadFromGrnsCommand = new AsyncRelayCommand(LoadFromGrnsAsync);
        RecordPaymentCommand = new AsyncRelayCommand(RecordPaymentAsync, () => CanRecordPayment);
        PropertyChanged += (_, e) =>
        {
            if (e.PropertyName is nameof(Net) or nameof(OrderAmount) or nameof(PaymentType) or nameof(Supplier)
                or nameof(PlaceOfSupply) or nameof(Discount) or nameof(SpDiscount))
                RefreshPaymentDisplayProperties();
        };
    }

    public override bool ShowRecordPaymentAction => true;

    public override string DocumentTotalLabel => "Invoice Total";

    public System.Windows.Input.ICommand LoadFromGrnsCommand { get; }

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

    public string GrnReference
    {
        get => _grnReference;
        set => SetProperty(ref _grnReference, value);
    }

    public string Gstin
    {
        get => SupplierGstin;
        set => SupplierGstin = value;
    }

    public DateTime? DueDate
    {
        get => _dueDate;
        set => SetProperty(ref _dueDate, value);
    }

    public string BillAmountDisplay => Net;

    public bool CanRecordPayment =>
        !string.Equals(PaymentType, "Cash", StringComparison.OrdinalIgnoreCase)
        && InvoicePaymentSummarySupport.ParseMoney(BalanceDueDisplay) > 0.001m
        && HasValidSupplier();

    public new ICommand RecordPaymentCommand { get; }

    protected override void InitializeModuleDefaults()
    {
        InvoiceDate = DateTime.Today;
        DueDate = null;
        GrnReference = string.Empty;
        SupplierGstin = string.Empty;
        PlaceOfSupply = CompanyProfileService.Current.PlaceOfSupply;
        PaymentType = InvoicePaymentOptions.DefaultPaymentType;
        PaymentMode = InvoicePaymentOptions.DefaultPaymentMode;
        PaidAmountDisplay = "0.00";
        RefreshGstSummaryProperties();
    }

    protected override void ApplyModuleFromDto(NumberedPurchaseDocumentDto dto)
    {
        InvoiceDate = dto.InvoiceDate?.Date ?? DateTime.Today;
        DueDate = dto.DueDate?.Date;
        GrnReference = dto.GrnReference ?? string.Empty;
        SupplierGstin = dto.Gstin ?? string.Empty;
        PlaceOfSupply = dto.PlaceOfSupply ?? string.Empty;
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

    public override void MapModuleToDto(NumberedPurchaseDocumentDto dto)
    {
        dto.InvoiceDate = InvoiceDate ?? DateTime.Today;
        dto.DueDate = DueDate;
        dto.GrnReference = GrnReference?.Trim();
        dto.GrnReferences = SalesLineItemSourceMapper.BuildGrnReferences(LineItems);
        dto.Gstin = SupplierGstin?.Trim();
        dto.PlaceOfSupply = PlaceOfSupply?.Trim();
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
        if (!string.IsNullOrWhiteSpace(line.GrnFormattedDocNo))
            SalesLineItemSourceMapper.ApplyGrnSource(item, line);
        return item;
    }

    private async Task LoadFromGrnsAsync()
    {
        var supplier = Supplier?.Trim();
        if (string.IsNullOrWhiteSpace(supplier))
        {
            MessageBox.Show(
                "Enter or select a supplier before loading GRNs.",
                "Purchase Invoice",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return;
        }

        var grns = await DocumentConsolidationPickService.PickGrnsForPurchaseInvoiceAsync(
            supplier,
            WindowHelper.GetOwnerWindow());
        if (grns is null || grns.Count == 0)
            return;

        if (LineItems.Count > 0
            && MessageBox.Show(
                "Replace current line items with pending lines from selected GRNs?",
                "Load from GRNs",
                MessageBoxButton.YesNo,
                MessageBoxImage.Question) != MessageBoxResult.Yes)
            return;

        var lines = await DocumentConsolidationPickService.LoadPurchaseInvoiceLinesFromGrnsAsync(
            supplier,
            grns);
        if (lines is null || lines.Count == 0)
            return;

        ClearLineItems();
        var sr = 1;
        foreach (var line in lines.OrderBy(l => l.GrnFormattedDocNo).ThenBy(l => l.GrnLineSr))
        {
            line.Sr = sr++;
            var item = MapDtoToLine(line);
            item.RecalculateAmount();
            LineItems.Add(item);
        }

        GrnReference = string.Join(", ", grns.Select(g => g.FormattedDocNo).Distinct(StringComparer.OrdinalIgnoreCase));
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
            SourceDocType = "purchase_invoice",
            SourceDocId = SavedDocumentId,
            FormattedDocNo = FormattedDocNo,
            PartyName = Supplier.Trim(),
            AmountDue = balance,
            CashBank = InvoicePaymentSummarySupport.PaymentModeToCashBank(PaymentMode),
            VoucherKind = "payment"
        };

        Host.OpenPaymentVoucherForInvoice(seed, () => _ = ReloadPaymentFromApiAsync());
    }

    private async Task ReloadPaymentFromApiAsync()
    {
        if (!ImsApiClient.IsAvailable)
            return;

        try
        {
            NumberedPurchaseDocumentDto? dto = null;
            if (int.TryParse(BillNo, out var docNo) && docNo > 0)
                dto = await ImsApiClient.GetPurchaseDocumentByNoAsync(EntryType, docNo, EffectiveDocPrefix());
            else if (!string.IsNullOrWhiteSpace(FormattedDocNo))
                dto = await ImsApiClient.GetPurchaseDocumentByFormattedAsync(EntryType, FormattedDocNo);

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
        var owner = Application.Current?.MainWindow;
        if (owner is null)
            return;

        await InvoiceCommunicationCoordinator.HandleAfterSaveAsync(
            owner,
            CommunicationDocumentKind.PurchaseInvoice,
            FormattedDocNo,
            BillDate,
            Supplier,
            OrderAmount,
            BalanceDueDisplay,
            "supplier");
    }
}
