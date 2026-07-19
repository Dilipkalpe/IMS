using System.Globalization;
using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels.SubPages;

public sealed class AddGrnViewModel : PurchaseDocumentEntryViewModelBase
{
    private DateTime? _grnDate = DateTime.Today;
    private string _poReference = string.Empty;
    private string _warehouse = string.Empty;
    private string _vehicleNo = string.Empty;
    private string _transporter = string.Empty;

    public AddGrnViewModel(MainViewModel host, GrnWorkspaceViewModel workspace, int docNo)
        : this(host, workspace, docNo, forEdit: false)
    {
    }

    public AddGrnViewModel(MainViewModel host, GrnWorkspaceViewModel workspace, int docNo, bool forEdit)
        : base(host, workspace, docNo, forEdit)
    {
        LoadFromPurchaseOrdersCommand = new AsyncRelayCommand(LoadFromPurchaseOrdersAsync);
    }

    public System.Windows.Input.ICommand LoadFromPurchaseOrdersCommand { get; }

    public DateTime? GrnDate
    {
        get => _grnDate;
        set
        {
            if (!SetProperty(ref _grnDate, value))
                return;
            BillDate = value?.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture) ?? string.Empty;
        }
    }

    public string PoReference
    {
        get => _poReference;
        set => SetProperty(ref _poReference, value);
    }

    public string Warehouse
    {
        get => _warehouse;
        set => SetProperty(ref _warehouse, value);
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

    protected override void InitializeModuleDefaults()
    {
        GrnDate = DateTime.Today;
        PoReference = string.Empty;
        Warehouse = string.Empty;
        VehicleNo = string.Empty;
        Transporter = string.Empty;
    }

    protected override void ApplyModuleFromDto(NumberedPurchaseDocumentDto dto)
    {
        GrnDate = dto.GrnDate?.Date ?? DateTime.Today;
        PoReference = dto.PoReference ?? string.Empty;
        Warehouse = dto.Warehouse ?? string.Empty;
        VehicleNo = dto.VehicleNo ?? string.Empty;
        Transporter = dto.Transporter ?? string.Empty;
    }

    public override void MapModuleToDto(NumberedPurchaseDocumentDto dto)
    {
        dto.GrnDate = GrnDate ?? DateTime.Today;
        dto.PoReference = PoReference?.Trim();
        dto.PoReferences = SalesLineItemSourceMapper.BuildPoReferences(LineItems);
        dto.Warehouse = Warehouse?.Trim();
        dto.VehicleNo = VehicleNo?.Trim();
        dto.Transporter = Transporter?.Trim();
    }

    protected override SalesLineItem MapDtoToLine(SalesOrderLineDto line)
    {
        var item = base.MapDtoToLine(line);
        if (!string.IsNullOrWhiteSpace(line.PoFormattedDocNo))
            SalesLineItemSourceMapper.ApplyPurchaseOrderSource(item, line);
        return item;
    }

    private async Task LoadFromPurchaseOrdersAsync()
    {
        var supplier = Supplier?.Trim();
        if (string.IsNullOrWhiteSpace(supplier))
        {
            MessageBox.Show(
                "Enter or select a supplier before loading purchase orders.",
                "GRN",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return;
        }

        var orders = await DocumentConsolidationPickService.PickPurchaseOrdersForReceiptAsync(
            supplier,
            WindowHelper.GetOwnerWindow());
        if (orders is null || orders.Count == 0)
            return;

        if (LineItems.Count > 0
            && MessageBox.Show(
                "Replace current line items with pending lines from selected purchase orders?",
                "Load from Purchase Orders",
                MessageBoxButton.YesNo,
                MessageBoxImage.Question) != MessageBoxResult.Yes)
            return;

        var lines = await DocumentConsolidationPickService.LoadReceiptLinesFromPurchaseOrdersAsync(
            supplier,
            orders);
        if (lines is null || lines.Count == 0)
            return;

        ClearLineItems();
        var sr = 1;
        foreach (var line in lines.OrderBy(l => l.PoFormattedDocNo).ThenBy(l => l.PoLineSr))
        {
            line.Sr = sr++;
            var item = MapDtoToLine(line);
            item.RecalculateAmount();
            LineItems.Add(item);
        }

        PoReference = string.Join(", ", orders.Select(o => o.FormattedDocNo).Distinct(StringComparer.OrdinalIgnoreCase));
        RecalculateTotals();
    }
}
