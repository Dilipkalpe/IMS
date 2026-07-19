// Sample entity models — move to ERP.Reporting.Data/Entities/

namespace ERP.Reporting.Data.Entities;

public sealed class ReportFormatMasterEntity
{
    public long ReportFormatId { get; init; }
    public string FormatCode { get; init; } = string.Empty;
    public string FormatName { get; init; } = string.Empty;
    public string EntryTypeKey { get; init; } = string.Empty;
    public string PaperKey { get; init; } = "A4_PORTRAIT";
    public string Orientation { get; init; } = "portrait";
    public decimal? CustomWidthMm { get; init; }
    public decimal? CustomHeightMm { get; init; }
    public decimal MarginTopMm { get; init; } = 10;
    public decimal MarginRightMm { get; init; } = 10;
    public decimal MarginBottomMm { get; init; } = 10;
    public decimal MarginLeftMm { get; init; } = 10;
    public string LayoutJson { get; init; } = "{}";
    public int SchemaVersion { get; init; } = 1;
    public bool IsDefault { get; init; }
    public bool IsActive { get; init; } = true;
    public bool PrintPreviewOnSave { get; init; }
    public bool AutoPrintOnSave { get; init; }
    public int DefaultCopies { get; init; } = 1;
    public string WatermarkType { get; init; } = "original";
    public DateTime CreatedAtUtc { get; init; }
    public DateTime ModifiedAtUtc { get; init; }
}

public sealed class LabelFormatMasterEntity
{
    public long LabelFormatId { get; init; }
    public string FormatCode { get; init; } = string.Empty;
    public string FormatName { get; init; } = string.Empty;
    public string LabelCategory { get; init; } = "product";
    public decimal WidthMm { get; init; }
    public decimal HeightMm { get; init; }
    public string LayoutJson { get; init; } = "{}";
    public bool IsDefault { get; init; }
    public bool IsActive { get; init; } = true;
}

public sealed class ReportFieldCatalogEntity
{
    public string FieldKey { get; init; } = string.Empty;
    public string EntryTypeKey { get; init; } = string.Empty;
    public string DisplayLabel { get; init; } = string.Empty;
    public string Token { get; init; } = string.Empty;
    public string DataType { get; init; } = "string";
    public string Category { get; init; } = string.Empty;
    public int SortOrder { get; init; }
}
