// Contracts — ERP.Reporting.Core/Interfaces/

namespace ERP.Reporting.Core;

public sealed record ReportPrintContext(
    string EntryTypeKey,
    string? PartyCode,
    string PartyKind,
    long? DocumentId,
    string? DocumentNo);

public interface IReportFormatRepository
{
    Task<ResolvedReportFormat?> ResolveAsync(ReportPrintContext context, CancellationToken ct = default);
    Task<long> SaveAsync(ReportFormatSaveRequest request, CancellationToken ct = default);
    Task<ReportFormatMasterDto?> GetByIdAsync(long reportFormatId, CancellationToken ct = default);
}

public sealed record ResolvedReportFormat(
    long ReportFormatId,
    string FormatCode,
    string LayoutJson,
    int SchemaVersion,
    PrintBehaviorSettings PrintBehavior,
    PageDimensions Page);

public sealed record PrintBehaviorSettings(
    bool PrintPreviewOnSave,
    bool AutoPrintOnSave,
    int DefaultCopies,
    string WatermarkType);

public sealed record PageDimensions(
    double WidthMm,
    double HeightMm,
    double MarginTopMm,
    double MarginRightMm,
    double MarginBottomMm,
    double MarginLeftMm);

public sealed record ReportFormatMasterDto(
    long ReportFormatId,
    string FormatCode,
    string FormatName,
    string EntryTypeKey,
    string LayoutJson);

public sealed record ReportFormatSaveRequest(
    long? ReportFormatId,
    string FormatCode,
    string FormatName,
    string EntryTypeKey,
    string LayoutJson,
    bool IsDefault);

public interface IFieldValueProvider
{
    Task<IReadOnlyDictionary<string, string>> GetValuesAsync(
        ReportPrintContext context,
        object documentDto,
        CancellationToken ct = default);
}

public interface IReportLayoutRenderer
{
    Task<RenderedReportDocument> RenderAsync(
        ReportLayoutDocument layout,
        IReadOnlyDictionary<string, string> fieldValues,
        IReadOnlyList<IDictionary<string, string>>? lineRows,
        CancellationToken ct = default);
}

public sealed record RenderedReportDocument(
    System.Windows.Documents.IDocumentPaginatorSource PaginatorSource,
    PageDimensions Page);

public interface IElementRenderer
{
    string ElementType { get; }
    bool CanRender(LayoutElement element);
    System.Windows.UIElement Render(
        LayoutElement element,
        ElementRenderContext context);
}

public sealed class ElementRenderContext
{
    public required IReadOnlyDictionary<string, string> FieldValues { get; init; }
    public IReadOnlyList<IDictionary<string, string>>? LineRows { get; init; }
    public required double Dpi { get; init; }
}

public interface IPrintEngine
{
    void ShowPreview(RenderedReportDocument document, string title);
    bool Print(RenderedReportDocument document, string jobName, int copies, bool showDialog);
    Task ExportPdfAsync(RenderedReportDocument document, string filePath, CancellationToken ct = default);
}

public interface ILabelFormatRepository
{
    Task<LabelFormatMasterDto?> ResolveDefaultAsync(string labelCategory, CancellationToken ct = default);
}

public sealed record LabelFormatMasterDto(long LabelFormatId, string LayoutJson, decimal WidthMm, decimal HeightMm);
