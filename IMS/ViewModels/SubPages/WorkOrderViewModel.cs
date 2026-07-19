using System.Collections.ObjectModel;
using System.Globalization;
using System.Windows;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels.SubPages;

public sealed class WorkOrderViewModel : SubPageViewModelBase
{
    private readonly int? _editProductionNo;
    private string _productionId = "1";
    private DateTime? _productionDate = DateTime.Today;
    private string _manufacturingItemId = string.Empty;
    private string _manufacturingItemName = string.Empty;
    private string _bomRevision = "Rev A";
    private string _machineCode = string.Empty;
    private string _machineName = string.Empty;
    private string _operatorId = string.Empty;
    private string _operatorName = string.Empty;
    private string _startTimeText = string.Empty;
    private string _endTimeText = string.Empty;
    private string _totalDurationMinutes = "0";
    private string _produceQty = "1";
    private string _rejectedQty = "0";
    private string _finalQty = "1";
    private string? _fromGodown = "Counter";
    private string _rawMaterialAmount = "0";
    private string _consumableAmount = "0";
    private string _productionAmount = "0";
    private string _status = "Open";
    private bool _isCompleted;
    private bool _isLoaded;

    public WorkOrderViewModel(MainViewModel host) : this(host, null)
    {
    }

    public WorkOrderViewModel(MainViewModel host, int? editProductionNo) : base(
        host,
        parentTitle: "Job Work",
        pageTitle: editProductionNo is null ? "New Job Work" : $"Job Work #{editProductionNo}",
        pageDescription: "Job work from BOM — material stages, stock issue, and finished goods receipt.",
        iconGlyph: "\uE912")
    {
        _editProductionNo = editProductionNo;
        Godowns = ["Counter", "Main", "Production"];
        RawMaterials = [];
        Consumables = [];
        BrowseManufacturingItemCommand = new RelayCommand(BrowseManufacturingItem);
        LookupManufacturingItemCommand = new RelayCommand(() => _ = LookupManufacturingItemAsync());
        BrowseOperatorCommand = new RelayCommand(BrowseOperator);
        LookupOperatorCommand = new RelayCommand(() => _ = LookupOperatorAsync());
        BrowseMachineCommand = new RelayCommand(BrowseMachine);
        LookupMachineCommand = new RelayCommand(() => _ = LookupMachineAsync());
        OpenBomCommand = new RelayCommand(OpenBomForItem);
        GenerateItemsCommand = new RelayCommand(() => _ = GenerateItemsAsync());
        SaveCommand = new AsyncRelayCommand(SaveWorkOrderAsync, () => !_isCompleted);
        CancelCommand = new RelayCommand(Cancel);
        RecalculateFinalQty();
        _ = InitializeAsync();
    }

    public IReadOnlyList<string> Godowns { get; }
    public ObservableCollection<WorkOrderRawMaterialLine> RawMaterials { get; }
    public ObservableCollection<WorkOrderConsumableLine> Consumables { get; }

    public bool IsCompleted => _isCompleted;

    public string ProductionId
    {
        get => _productionId;
        set => SetProperty(ref _productionId, value);
    }

    public DateTime? ProductionDate
    {
        get => _productionDate;
        set => SetProperty(ref _productionDate, value);
    }

    public string ManufacturingItemId
    {
        get => _manufacturingItemId;
        set => SetProperty(ref _manufacturingItemId, value);
    }

    public string ManufacturingItemName
    {
        get => _manufacturingItemName;
        set => SetProperty(ref _manufacturingItemName, value);
    }

    public string BomRevision
    {
        get => _bomRevision;
        set => SetProperty(ref _bomRevision, value);
    }

    public string MachineCode
    {
        get => _machineCode;
        set => SetProperty(ref _machineCode, value);
    }

    public string MachineName
    {
        get => _machineName;
        set => SetProperty(ref _machineName, value);
    }

    public string OperatorId
    {
        get => _operatorId;
        set => SetProperty(ref _operatorId, value);
    }

    public string OperatorName
    {
        get => _operatorName;
        set => SetProperty(ref _operatorName, value);
    }

    public string StartTimeText
    {
        get => _startTimeText;
        set => SetProperty(ref _startTimeText, value);
    }

    public string EndTimeText
    {
        get => _endTimeText;
        set => SetProperty(ref _endTimeText, value);
    }

    public string TotalDurationMinutes
    {
        get => _totalDurationMinutes;
        set => SetProperty(ref _totalDurationMinutes, value);
    }

    public string ProduceQty
    {
        get => _produceQty;
        set
        {
            if (!SetProperty(ref _produceQty, value))
                return;
            RecalculateFinalQty();
            if (_isLoaded && RawMaterials.Count > 0)
                _ = GenerateItemsAsync();
        }
    }

    public string RejectedQty
    {
        get => _rejectedQty;
        set
        {
            if (!SetProperty(ref _rejectedQty, value))
                return;
            RecalculateFinalQty();
        }
    }

    public string FinalQty
    {
        get => _finalQty;
        set => SetProperty(ref _finalQty, value);
    }

    public string? FromGodown
    {
        get => _fromGodown;
        set => SetProperty(ref _fromGodown, value);
    }

    public string RawMaterialAmount
    {
        get => _rawMaterialAmount;
        set => SetProperty(ref _rawMaterialAmount, value);
    }

    public string ConsumableAmount
    {
        get => _consumableAmount;
        set => SetProperty(ref _consumableAmount, value);
    }

    public string ProductionAmount
    {
        get => _productionAmount;
        set => SetProperty(ref _productionAmount, value);
    }

    public ICommand BrowseManufacturingItemCommand { get; }
    public ICommand LookupManufacturingItemCommand { get; }
    public ICommand BrowseOperatorCommand { get; }
    public ICommand LookupOperatorCommand { get; }
    public ICommand BrowseMachineCommand { get; }
    public ICommand LookupMachineCommand { get; }
    public ICommand OpenBomCommand { get; }
    public ICommand GenerateItemsCommand { get; }

    private async Task InitializeAsync()
    {
        if (!await ImsApiClient.CheckHealthAsync())
            return;

        if (_editProductionNo is int editNo)
        {
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var order = await ImsApiClient.GetProductionOrderByNoAsync(editNo);
                if (order is not null)
                    ApplyFromDto(order);
            }, "Load job work");
            _isLoaded = true;
            return;
        }

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var next = await ImsApiClient.GetNextProductionNoAsync();
            ProductionId = next.ToString(In);
            StartTimeText = DateTime.Now.ToString("g", CultureInfo.CurrentCulture);
            EndTimeText = StartTimeText;
        }, "Next job work no");
        _isLoaded = true;
    }

    private void ApplyFromDto(ProductionOrderDto order)
    {
        ProductionId = order.ProductionNo.ToString(In);
        ProductionDate = order.ProductionDate ?? DateTime.Today;
        ManufacturingItemId = order.ManufacturingItemId ?? string.Empty;
        ManufacturingItemName = order.ManufacturingItemName ?? string.Empty;
        BomRevision = order.BomRevision ?? "Rev A";
        MachineCode = order.MachineCode ?? string.Empty;
        MachineName = order.MachineName ?? string.Empty;
        OperatorId = order.OperatorId ?? string.Empty;
        OperatorName = order.OperatorName ?? string.Empty;
        StartTimeText = order.StartTimeText ?? string.Empty;
        EndTimeText = order.EndTimeText ?? string.Empty;
        TotalDurationMinutes = order.TotalDurationMinutes.ToString("N0", In);
        ProduceQty = order.ProduceQty.ToString("N0", In);
        RejectedQty = order.RejectedQty.ToString("N0", In);
        FinalQty = order.FinalQty.ToString("N0", In);
        FromGodown = order.FromGodown ?? "Counter";
        RawMaterialAmount = order.RawMaterialAmount.ToString("N2", In);
        ProductionAmount = order.ProductionAmount.ToString("N2", In);
        ConsumableAmount = order.Consumables.Sum(x => x.Amount).ToString("N2", In);
        _status = order.Status;
        _isCompleted = string.Equals(order.Status, "Completed", StringComparison.OrdinalIgnoreCase);
        OnPropertyChanged(nameof(IsCompleted));

        RawMaterials.Clear();
        foreach (var line in order.RawMaterials.OrderBy(x => x.SrNo))
        {
            RawMaterials.Add(MapRawLine(line));
        }

        Consumables.Clear();
        foreach (var line in order.Consumables.OrderBy(x => x.SrNo))
            Consumables.Add(MapConsumableLine(line));
    }

    private void RecalculateFinalQty()
    {
        var produce = ParseDecimal(ProduceQty);
        var rejected = ParseDecimal(RejectedQty);
        FinalQty = Math.Max(0, produce - rejected).ToString("N0", In);
    }

    private void BrowseManufacturingItem()
    {
        var selected = ProductBrowseService.PickProduct(forPurchase: true);
        if (selected is null)
            return;

        ApplyManufacturingItem(selected.Code, selected.Name);
    }

    private async Task LookupManufacturingItemAsync()
    {
        var code = (ManufacturingItemId ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(code))
        {
            BrowseManufacturingItem();
            return;
        }

        if (!await ImsApiClient.CheckHealthAsync())
        {
            var local = SalesProductLookup.FindLocal(code);
            if (local is null)
            {
                MessageBox.Show($"No product found for \"{code}\".", "Manufacturing item",
                    MessageBoxButton.OK, MessageBoxImage.Warning);
                ManufacturingItemName = string.Empty;
                return;
            }

            ApplyManufacturingItem(local.Code, local.Name);
            return;
        }

        ProductDto? product = null;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            product = await ImsApiClient.GetProductByCodeAsync(code);
        }, "Look up item");

        if (product is null)
        {
            MessageBox.Show($"No product found for \"{code}\".", "Manufacturing item",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            ManufacturingItemName = string.Empty;
            return;
        }

        ApplyManufacturingItem(product.Code, product.Name);
    }

    private void ApplyManufacturingItem(string code, string name)
    {
        ManufacturingItemId = code;
        ManufacturingItemName = name;
    }

    private void BrowseOperator()
    {
        var selected = MasterPickService.PickUser();
        if (selected is null)
            return;

        OperatorId = selected.Code;
        OperatorName = selected.Name;
    }

    private async Task LookupOperatorAsync()
    {
        var username = (OperatorId ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(username))
        {
            BrowseOperator();
            return;
        }

        if (!await ImsApiClient.CheckHealthAsync())
        {
            MessageBox.Show("API is not available to look up users.", "Operator",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        AppUserDto? user = null;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            user = await ImsApiClient.GetUserByUsernameAsync(username);
        }, "Look up operator");

        if (user is null || !user.ActiveStatus)
        {
            MessageBox.Show($"No active user found for \"{username}\".", "Operator",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            OperatorName = string.Empty;
            return;
        }

        OperatorId = user.Username;
        OperatorName = user.FullName;
    }

    private void BrowseMachine()
    {
        var selected = MasterPickService.PickMachine();
        if (selected is null)
            return;

        MachineCode = selected.Code;
        MachineName = selected.Name;
    }

    private async Task LookupMachineAsync()
    {
        var code = (MachineCode ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(code))
        {
            BrowseMachine();
            return;
        }

        if (!await ImsApiClient.CheckHealthAsync())
        {
            MessageBox.Show("API is not available to look up machines.", "Machine",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        MachineDto? machine = null;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            machine = await ImsApiClient.GetMachineByCodeAsync(code);
        }, "Look up machine");

        if (machine is null || !machine.ActiveStatus)
        {
            MessageBox.Show($"No machine found for \"{code}\".", "Machine",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            MachineName = string.Empty;
            return;
        }

        MachineCode = machine.Code;
        MachineName = machine.Name;
    }

    private void OpenBomForItem()
    {
        var code = (ManufacturingItemId ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(code))
        {
            MessageBox.Show("Select a manufacturing item first.", "BOM", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        Host.NavigateToSubPage(new BomViewModel(Host, code, ManufacturingItemName, code));
    }

    private async Task GenerateItemsAsync()
    {
        var productCode = (ManufacturingItemId ?? string.Empty).Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(productCode))
        {
            MessageBox.Show("Select Manufacturing Item first.", "Job Work", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (!await ImsApiClient.CheckHealthAsync())
        {
            MessageBox.Show("API is not available. Start the API server to load BOM items.", "Job Work", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        var produceQty = ParseDecimal(ProduceQty);
        if (produceQty <= 0)
            produceQty = 1;

        ProductionBomExpandDto? expanded = null;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            expanded = await ImsApiClient.ExpandProductionBomAsync(productCode, produceQty);
        }, "Load BOM");

        if (expanded is null)
        {
            var create = MessageBox.Show(
                $"No BOM exists for {productCode}. Open BOM designer now?",
                "Job Work",
                MessageBoxButton.YesNo,
                MessageBoxImage.Question);
            if (create == MessageBoxResult.Yes)
                OpenBomForItem();
            return;
        }

        ApplyExpandedBom(expanded);
        MessageBox.Show("Items generated from BOM.", "Job Work", MessageBoxButton.OK, MessageBoxImage.Information);
    }

    private void ApplyExpandedBom(ProductionBomExpandDto expanded)
    {
        BomRevision = expanded.Revision ?? BomRevision;
        RawMaterials.Clear();
        foreach (var line in expanded.RawMaterials.OrderBy(x => x.SrNo))
        {
            RawMaterials.Add(MapRawLine(line));
        }

        Consumables.Clear();
        foreach (var line in expanded.Consumables.OrderBy(x => x.SrNo))
            Consumables.Add(MapConsumableLine(line));

        RawMaterialAmount = expanded.RawMaterialAmount.ToString("N2", In);
        ProductionAmount = expanded.ProductionAmount.ToString("N2", In);
        ConsumableAmount = expanded.Consumables.Sum(x => x.Amount).ToString("N2", In);
    }

    private void Cancel()
    {
        if (_isCompleted)
        {
            Host.GoBack();
            return;
        }

        var hasDraft = RawMaterials.Count > 0 || Consumables.Count > 0
            || !string.IsNullOrWhiteSpace(ManufacturingItemId);
        if (hasDraft && MessageBox.Show(
                "Discard changes and return to the job work list?",
                "Job Work",
                MessageBoxButton.YesNo,
                MessageBoxImage.Question) != MessageBoxResult.Yes)
            return;

        Host.GoBack();
    }

    private async Task SaveWorkOrderAsync()
    {
        if (_isCompleted)
        {
            MessageBox.Show("This job work entry is already completed.", "Job Work", MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }

        if (string.IsNullOrWhiteSpace(ManufacturingItemId))
        {
            MessageBox.Show("Select Manufacturing Item first.", "Job Work", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (RawMaterials.Count == 0 && Consumables.Count == 0)
        {
            MessageBox.Show("Generate items from BOM before save.", "Job Work", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        var shortQty = RawMaterials.FirstOrDefault(x => x.AvailableQty < x.ReqQty);
        if (shortQty is not null)
        {
            MessageBox.Show(
                $"Insufficient stock for {shortQty.ItemId}.\nAvailable: {shortQty.AvailableQty:N2}  Required: {shortQty.ReqQty:N2}",
                "Job Work",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return;
        }

        if (!await ImsApiClient.CheckHealthAsync())
        {
            MessageBox.Show("API is not available.", "Job Work", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (!int.TryParse(ProductionId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var productionNo))
        {
            MessageBox.Show("Invalid job work number.", "Job Work", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        var dto = BuildDto(productionNo);
        dto.Status = "In Progress";

        var issueTransfer = BuildIssueTransfer();
        var receiptTransfer = BuildReceiptTransfer();

        var saved = false;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            if (_editProductionNo is null)
                await ImsApiClient.CreateProductionOrderAsync(dto);
            else
                await ImsApiClient.UpdateProductionOrderAsync(productionNo, dto);

            await ImsApiClient.CreateStockTransferAsync(issueTransfer);
            await ImsApiClient.CreateStockTransferAsync(receiptTransfer);

            dto.Status = "Completed";
            dto.IssueTransferEntryNo = issueTransfer.EntryNo;
            dto.ReceiptTransferEntryNo = receiptTransfer.EntryNo;
            await ImsApiClient.UpdateProductionOrderAsync(productionNo, dto);
            saved = true;
        }, "Save job work");

        if (!saved)
            return;

        MessageBox.Show(
            $"Job Work #{productionNo} saved.\nStock updated at {FromGodown}.",
            "Job Work",
            MessageBoxButton.OK,
            MessageBoxImage.Information);

        Host.GoBack();
    }

    private ProductionOrderDto BuildDto(int productionNo) =>
        new()
        {
            ProductionNo = productionNo,
            ProductionDate = ProductionDate ?? DateTime.Today,
            ManufacturingItemId = ManufacturingItemId.Trim(),
            ManufacturingItemName = ManufacturingItemName.Trim(),
            BomProductCode = ManufacturingItemId.Trim().ToUpperInvariant(),
            BomRevision = BomRevision,
            MachineCode = MachineCode,
            MachineName = MachineName,
            OperatorId = OperatorId,
            OperatorName = OperatorName,
            StartTimeText = StartTimeText,
            EndTimeText = EndTimeText,
            TotalDurationMinutes = ParseDecimal(TotalDurationMinutes),
            ProduceQty = ParseDecimal(ProduceQty),
            RejectedQty = ParseDecimal(RejectedQty),
            FinalQty = ParseDecimal(FinalQty),
            FromGodown = FromGodown ?? "Counter",
            RawMaterialAmount = ParseDecimal(RawMaterialAmount),
            ProductionAmount = ParseDecimal(ProductionAmount),
            Status = _status,
            RawMaterials = RawMaterials.Select(MapRawToDto).ToList(),
            Consumables = Consumables.Select(MapConsumableToDto).ToList()
        };

    private StockTransferDto BuildIssueTransfer()
    {
        var lines = new List<StockTransferLineDto>();
        var sr = 1;
        foreach (var line in RawMaterials)
        {
            lines.Add(new StockTransferLineDto
            {
                SrNo = sr++,
                ProductId = line.ItemId,
                ProductCode = line.ItemId,
                ProductName = line.ItemName,
                BatchNo = string.Empty,
                Qty = line.ReqQty.ToString("0.##", In),
                Unit = line.Unit
            });
        }

        foreach (var line in Consumables)
        {
            lines.Add(new StockTransferLineDto
            {
                SrNo = sr++,
                ProductId = line.Material,
                ProductCode = line.Material,
                ProductName = line.Material,
                BatchNo = string.Empty,
                Qty = line.Qty.ToString("0.##", In),
                Unit = "Nos"
            });
        }

        return new StockTransferDto
        {
            EntryNo = $"PRD-{ProductionId}-ISSUE",
            FromGodown = FromGodown ?? "Counter",
            ToGodown = "Production",
            TransferDate = ProductionDate ?? DateTime.Today,
            Remark = $"Production issue — {ManufacturingItemId} {ManufacturingItemName}".Trim(),
            Status = "posted",
            Lines = lines
        };
    }

    private StockTransferDto BuildReceiptTransfer()
    {
        var qty = ParseDecimal(FinalQty);
        if (qty <= 0)
            qty = ParseDecimal(ProduceQty);
        if (qty <= 0)
            qty = 1;

        return new StockTransferDto
        {
            EntryNo = $"PRD-{ProductionId}-RECEIPT",
            FromGodown = "Production",
            ToGodown = FromGodown ?? "Counter",
            TransferDate = ProductionDate ?? DateTime.Today,
            Remark = $"Production receipt — {ManufacturingItemId} {ManufacturingItemName}".Trim(),
            Status = "posted",
            Lines =
            [
                new StockTransferLineDto
                {
                    SrNo = 1,
                    ProductId = ManufacturingItemId,
                    ProductCode = ManufacturingItemId,
                    ProductName = ManufacturingItemName,
                    BatchNo = string.Empty,
                    Qty = qty.ToString("0.##", In),
                    Unit = "Nos"
                }
            ]
        };
    }

    private static WorkOrderRawMaterialLine MapRawLine(ProductionOrderRawLineDto line) =>
        new()
        {
            SrNo = line.SrNo,
            BomLineRef = line.BomLineRef ?? $"raw:{line.SrNo}",
            AssignmentType = line.AssignmentType ?? "bom",
            Stage = line.Stage ?? "planned",
            StageEvents = MapStageEvents(line.StageEvents),
            ItemId = line.ItemId ?? string.Empty,
            ItemName = line.ItemName ?? string.Empty,
            Unit = line.Unit ?? "Nos",
            ReqQty = line.ReqQty,
            AvailableQty = line.AvailableQty,
            Rate = line.Rate,
            Amount = line.Amount
        };

    private static WorkOrderConsumableLine MapConsumableLine(ProductionOrderConsumableLineDto line) =>
        new()
        {
            SrNo = line.SrNo,
            BomLineRef = line.BomLineRef ?? $"consumable:{line.SrNo}",
            AssignmentType = line.AssignmentType ?? "bom",
            Stage = line.Stage ?? "planned",
            StageEvents = MapStageEvents(line.StageEvents),
            Material = line.Material ?? string.Empty,
            Qty = line.Qty,
            Rate = line.Rate,
            Amount = line.Amount
        };

    private static ProductionOrderRawLineDto MapRawToDto(WorkOrderRawMaterialLine line) =>
        new()
        {
            SrNo = line.SrNo,
            BomLineRef = line.BomLineRef,
            AssignmentType = line.AssignmentType,
            Stage = line.Stage,
            StageEvents = MapStageEventsToDto(line.StageEvents),
            ItemId = line.ItemId,
            ItemName = line.ItemName,
            Unit = line.Unit,
            ReqQty = line.ReqQty,
            AvailableQty = line.AvailableQty,
            Rate = line.Rate,
            Amount = line.Amount
        };

    private static ProductionOrderConsumableLineDto MapConsumableToDto(WorkOrderConsumableLine line) =>
        new()
        {
            SrNo = line.SrNo,
            BomLineRef = line.BomLineRef,
            AssignmentType = line.AssignmentType,
            Stage = line.Stage,
            StageEvents = MapStageEventsToDto(line.StageEvents),
            Material = line.Material,
            Qty = line.Qty,
            Rate = line.Rate,
            Amount = line.Amount
        };

    private static IReadOnlyList<MaterialStageEvent> MapStageEvents(IEnumerable<MaterialStageEventDto>? events) =>
        (events ?? []).Select(e => new MaterialStageEvent
        {
            Stage = e.Stage,
            At = e.At,
            By = e.By ?? string.Empty,
            Qty = e.Qty,
            Godown = e.Godown ?? string.Empty,
            Note = e.Note ?? string.Empty
        }).ToList();

    private static List<MaterialStageEventDto> MapStageEventsToDto(IEnumerable<MaterialStageEvent> events) =>
        events.Select(e => new MaterialStageEventDto
        {
            Stage = e.Stage,
            At = e.At,
            By = e.By,
            Qty = e.Qty,
            Godown = e.Godown,
            Note = e.Note
        }).ToList();

    private static decimal ParseDecimal(string? text) =>
        decimal.TryParse(text, NumberStyles.Any, CultureInfo.InvariantCulture, out var value)
            ? value
            : decimal.TryParse(text, NumberStyles.Any, CultureInfo.CurrentCulture, out value)
                ? value
                : 0m;

    private static readonly CultureInfo In = CultureInfo.InvariantCulture;
}
