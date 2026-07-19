using System.Globalization;
using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels.SubPages;

public sealed class AddDeliveryChallanViewModel : SalesDocumentEntryViewModelBase
{
    private DateTime? _dcDate = DateTime.Today;
    private string _soReference = string.Empty;
    private string _warehouse = string.Empty;
    private string _vehicleNo = string.Empty;
    private string _transporter = string.Empty;

    public AddDeliveryChallanViewModel(MainViewModel host, DeliveryChallanWorkspaceViewModel workspace, int docNo)
        : this(host, workspace, docNo, forEdit: false)
    {
    }

    public AddDeliveryChallanViewModel(
        MainViewModel host,
        DeliveryChallanWorkspaceViewModel workspace,
        int docNo,
        bool forEdit)
        : base(host, workspace, docNo, forEdit)
    {
        LoadFromSalesOrdersCommand = new AsyncRelayCommand(LoadFromSalesOrdersAsync);
    }

    public bool ShowSalesOrderRefColumn => true;

    public System.Windows.Input.ICommand LoadFromSalesOrdersCommand { get; }

    public DateTime? DcDate
    {
        get => _dcDate;
        set
        {
            if (!SetProperty(ref _dcDate, value))
                return;
            BillDate = value?.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture) ?? string.Empty;
        }
    }

    public string SoReference
    {
        get => _soReference;
        set => SetProperty(ref _soReference, value);
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
        DcDate = DateTime.Today;
        SoReference = string.Empty;
        Warehouse = string.Empty;
        VehicleNo = string.Empty;
        Transporter = string.Empty;
    }

    protected override void ApplyModuleFromDto(NumberedSalesDocumentDto dto)
    {
        DcDate = dto.DcDate?.Date ?? DateTime.Today;
        SoReference = dto.SoReference ?? string.Empty;
        Warehouse = dto.Warehouse ?? string.Empty;
        VehicleNo = dto.VehicleNo ?? string.Empty;
        Transporter = dto.Transporter ?? string.Empty;
    }

    protected override void MapModuleToDto(NumberedSalesDocumentDto dto)
    {
        dto.DcDate = DcDate ?? DateTime.Today;
        dto.SoReference = SoReference?.Trim();
        dto.SoReferences = BuildSoReferencesFromLines();
        dto.Warehouse = Warehouse?.Trim();
        dto.VehicleNo = VehicleNo?.Trim();
        dto.Transporter = Transporter?.Trim();
    }

    protected override SalesLineItem MapDtoToLine(SalesOrderLineDto line)
    {
        var item = base.MapDtoToLine(line);
        item.SoPrefix = line.SoPrefix ?? string.Empty;
        item.SoDocNo = line.SoDocNo;
        item.SoFormattedDocNo = line.SoFormattedDocNo ?? string.Empty;
        item.SoLineSr = line.SoLineSr;
        if (decimal.TryParse(line.SoPendingQty, NumberStyles.Any, CultureInfo.InvariantCulture, out var pending))
            item.MaxDeliverQty = pending;
        return item;
    }

    protected override SalesOrderLineDto MapLineToDto(SalesLineItem line)
    {
        var dto = base.MapLineToDto(line);
        if (line.HasSalesOrderSource)
        {
            dto.SoPrefix = string.IsNullOrWhiteSpace(line.SoPrefix) ? "SO" : line.SoPrefix;
            dto.SoDocNo = line.SoDocNo;
            dto.SoFormattedDocNo = line.SoFormattedDocNo;
            dto.SoLineSr = line.SoLineSr;
            if (line.MaxDeliverQty is decimal max)
                dto.SoPendingQty = max.ToString("0.###", CultureInfo.InvariantCulture);
        }

        return dto;
    }

    private async Task LoadFromSalesOrdersAsync()
    {
        var customer = Customer?.Trim();
        if (string.IsNullOrWhiteSpace(customer))
        {
            MessageBox.Show(
                "Enter or select a customer before loading sales orders.",
                "Delivery Challan",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return;
        }

        var orders = await SalesOrderPickService.PickMultipleForDeliveryAsync(
            customer,
            WindowHelper.GetOwnerWindow());
        if (orders is null || orders.Count == 0)
            return;

        if (LineItems.Count > 0
            && MessageBox.Show(
                "Replace current line items with pending lines from selected sales orders?",
                "Load from Sales Orders",
                MessageBoxButton.YesNo,
                MessageBoxImage.Question) != MessageBoxResult.Yes)
            return;

        var lines = await SalesOrderPickService.LoadPendingLinesAsync(customer, orders);
        if (lines is null || lines.Count == 0)
            return;

        ClearLineItems();
        var sr = 1;
        foreach (var line in lines.OrderBy(l => l.SoFormattedDocNo).ThenBy(l => l.SoLineSr))
        {
            line.Sr = sr++;
            var item = MapDtoToLine(line);
            item.RecalculateAmount();
            LineItems.Add(item);
        }

        SoReference = string.Join(", ", orders.Select(o => o.FormattedDocNo).Distinct(StringComparer.OrdinalIgnoreCase));
        RecalculateTotals();
    }

    private List<SalesOrderReferenceDto> BuildSoReferencesFromLines() =>
        LineItems
            .Where(l => l.HasSalesOrderSource && l.SoDocNo is int)
            .GroupBy(l => $"{l.SoPrefix}|{l.SoDocNo}")
            .Select(g =>
            {
                var first = g.First();
                return new SalesOrderReferenceDto
                {
                    SoPrefix = string.IsNullOrWhiteSpace(first.SoPrefix) ? "SO" : first.SoPrefix,
                    DocNo = first.SoDocNo!.Value,
                    FormattedDocNo = first.SoFormattedDocNo
                };
            })
            .ToList();
}
