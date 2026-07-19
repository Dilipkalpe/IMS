namespace IMS.Models;

public enum BarcodeLabelQuantitySource
{
    PurchaseQuantity,
    CustomQuantity
}

public enum BarcodeLabelSymbology
{
    Code128,
    QrCode
}

public sealed class BarcodeLabelFormat
{
    public required string Id { get; init; }
    public required string DisplayName { get; init; }
    public required string Description { get; init; }
    public double WidthMm { get; init; }
    public double HeightMm { get; init; }
    public int ColumnsPerPage { get; init; } = 2;
    public int RowsPerPage { get; init; } = 10;
}

public sealed class BarcodeLabelPrintOptions
{
    public required BarcodeLabelFormat Format { get; init; }
    public BarcodeLabelSymbology Symbology { get; init; } = BarcodeLabelSymbology.Code128;
    public BarcodeLabelQuantitySource QuantitySource { get; init; } = BarcodeLabelQuantitySource.PurchaseQuantity;
    public int CustomQuantityPerLine { get; init; } = 1;
    public int CopyMultiplier { get; init; } = 1;
}

public sealed class BarcodeLabelItem
{
    public string ProductCode { get; init; } = string.Empty;
    public string ProductName { get; init; } = string.Empty;
    public string BarcodeValue { get; init; } = string.Empty;
    public bool MissingBarcode { get; init; }
    public string? BatchNo { get; init; }
    public string? Mrp { get; init; }
    public string? SalesRate { get; init; }
    public string? ManufacturingDate { get; init; }
    public string? ExpiryDate { get; init; }
    public string PurchaseInvoiceNo { get; init; } = string.Empty;
}

public sealed class BarcodeLabelPrintResult
{
    public IReadOnlyList<BarcodeLabelItem> Labels { get; init; } = [];
    public IReadOnlyList<string> Warnings { get; init; } = [];
}
