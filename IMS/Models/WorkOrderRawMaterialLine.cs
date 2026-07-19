namespace IMS.Models;

public sealed class WorkOrderRawMaterialLine
{
    public int SrNo { get; init; }
    public string BomLineRef { get; init; } = string.Empty;
    public string AssignmentType { get; init; } = "bom";
    public string Stage { get; init; } = "planned";
    public IReadOnlyList<MaterialStageEvent> StageEvents { get; init; } = [];
    public string ItemId { get; init; } = string.Empty;
    public string ItemName { get; init; } = string.Empty;
    public string Unit { get; init; } = string.Empty;
    public decimal ReqQty { get; init; }
    public decimal AvailableQty { get; init; }
    public decimal Rate { get; init; }
    public decimal Amount { get; init; }
    public bool IsAvailableShort => AvailableQty < ReqQty;

    public string StageDisplay => MaterialLineDisplay.FormatStage(Stage);
    public string AssignmentDisplay => MaterialLineDisplay.FormatAssignment(AssignmentType);
    public string LastEventSummary => MaterialLineDisplay.FormatLastEvent(StageEvents);
    public string StageHistoryToolTip => MaterialLineDisplay.FormatHistoryToolTip(StageEvents);
}

public sealed class MaterialStageEvent
{
    public string Stage { get; init; } = "planned";
    public DateTime? At { get; init; }
    public string By { get; init; } = string.Empty;
    public decimal Qty { get; init; }
    public string Godown { get; init; } = string.Empty;
    public string Note { get; init; } = string.Empty;
}
