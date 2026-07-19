namespace IMS.Models;

public sealed class WorkOrderConsumableLine
{
    public int SrNo { get; init; }
    public string BomLineRef { get; init; } = string.Empty;
    public string AssignmentType { get; init; } = "bom";
    public string Stage { get; init; } = "planned";
    public IReadOnlyList<MaterialStageEvent> StageEvents { get; init; } = [];
    public string Material { get; init; } = string.Empty;
    public decimal Qty { get; init; }
    public decimal Rate { get; init; }
    public decimal Amount { get; init; }

    public string StageDisplay => MaterialLineDisplay.FormatStage(Stage);
    public string AssignmentDisplay => MaterialLineDisplay.FormatAssignment(AssignmentType);
    public string LastEventSummary => MaterialLineDisplay.FormatLastEvent(StageEvents);
    public string StageHistoryToolTip => MaterialLineDisplay.FormatHistoryToolTip(StageEvents);
}
