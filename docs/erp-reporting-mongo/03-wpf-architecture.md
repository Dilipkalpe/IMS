# WPF architecture (.NET 8 + MVVM + CommunityToolkit.Mvvm)

## Solution structure

```
IMS.Reporting/                    # Class library
  Core/
    Layout/                       # ReportLayoutDocument, elements
    Fields/                       # IFieldValueProvider, registry DTOs
    Interfaces/
  Data/
    ReportingApiClient.cs         # HttpClient → /api/reporting
    Dtos/
  Engine/
    ReportLayoutRenderer.cs
    ElementRenderers/             # Text, Table, Barcode, ...
    FieldResolver.cs              # dataPath → values
    Pagination/
  Print/
    PrintEngine.cs
    PdfExportService.cs
    WatermarkAdorner.cs
  Barcode/
    ZXingBarcodeService.cs
  Designer/
    Views/
    ViewModels/
    Controls/DesignerCanvas.cs
    Services/DesignerHistory.cs   # Undo/redo
  Labels/
    Designer/
    Engine/
IMS/                              # Host app
  ViewModels/
  Views/
  Hosting/ReportingHostModule.cs  # DI registration
```

## MVVM — Report Designer

`ReportDesignerViewModel` (partial class + CommunityToolkit):

```csharp
public partial class ReportDesignerViewModel : ObservableObject
{
    [ObservableProperty] private double _zoom = 1.0;
    [ObservableProperty] private DesignElementViewModel? _selectedElement;
    public ObservableCollection<DesignElementViewModel> Elements { get; } = new();

    [RelayCommand] private void AddText() => AddElement("text");
    [RelayCommand] private async Task SaveAsync() => await _api.UpdateReportFormatAsync(...);

    // DesignerHistory: UndoCommand, RedoCommand
    // Clipboard: CopyCommand, PasteCommand
    // Align: AlignLeftCommand, ...
}
```

## Designer canvas (WPF)

- `DesignerCanvas : Canvas` — mm → DIP conversion, snap grid 1mm
- `AdornerLayer` for resize thumbs
- Multi-select: `Selector` rectangle + `SelectedElements` collection
- `ZoomControl` bound to `Zoom` (0.25–2.0)

## Label Designer

- Separate `LabelDesignerViewModel`
- Preset sizes from API or local enum synced with seed
- Same element model, different page root (`label.widthMm`)

## API client (runtime flow)

```csharp
// 1. Resolve format
var resolved = await _reportingApi.ResolveReportFormatAsync(
    "sales_invoice", customerCode, "customer");

// 2. Load transaction
var invoice = await _salesApi.GetInvoiceAsync(id);

// 3. Build field dictionary from registry + DTO
var values = await _fieldResolver.ResolveAsync(resolved.Format, invoice);

// 4. Render
var doc = await _renderer.RenderAsync(resolved.Format.LayoutJson, values, invoice.Lines);

// 5. Print
_printEngine.ShowPreview(doc, "Tax Invoice");
```

## CommunityToolkit.Mvvm packages

```xml
<PackageReference Include="CommunityToolkit.Mvvm" Version="8.*" />
<PackageReference Include="ZXing.Net" Version="0.16.*" />
<PackageReference Include="ZXing.Net.Bindings.Windows.Compatibility" Version="0.16.*" />
```

## Dynamic fields without code changes

1. API returns `field-registry` for transaction type.
2. Designer populates Field Explorer from registry.
3. `FieldResolver` walks `dataPath` on print DTO (reflection or source-generated map).
4. New field = MongoDB insert only.

Example paths:

| fieldKey | dataPath |
|----------|----------|
| invoiceNo | document.formattedDocNo |
| companyName | company.name |
| itemTable | lines |
