# Runtime rendering & print engine

## Rendering pipeline

```
ResolveReportFormat (API)
    ↓
Deserialize layoutJson → ReportLayoutDocument
    ↓
Load transaction DTO + company profile
    ↓
FieldResolver.BuildDictionary(registry, dto) → Dictionary<string, string>
    ↓
For each element (sorted by zIndex):
    IElementRenderer.TryRender(element, context)
    ↓
TableRenderer expands lines → measures height → pagination
    ↓
FixedDocument or FlowDocument
```

## Element renderer registry (DI)

```csharp
services.AddSingleton<IElementRenderer, TextElementRenderer>();
services.AddSingleton<IElementRenderer, DynamicTextElementRenderer>();
services.AddSingleton<IElementRenderer, TableElementRenderer>();
services.AddSingleton<IElementRenderer, BarcodeElementRenderer>();
services.AddSingleton<IElementRenderer, QrCodeElementRenderer>();
// ...
services.AddSingleton<ReportLayoutRenderer>();
```

## Barcode (ZXing.Net)

| Symbology | ZXing format |
|-----------|----------------|
| Code128 | CODE_128 |
| Code39 | CODE_39 |
| EAN13 | EAN_13 |
| EAN8 | EAN_8 |
| UPC | UPC_A |
| GS1-128 | CODE_128 (GS1 payload) |
| ITF-14 | ITF |

## QR kinds

| qrKind | Typical payload |
|--------|-----------------|
| product | SKU JSON |
| batch | batch no + expiry |
| inventory | location + SKU |
| payment | UPI / payment string |
| dynamic | field token |
| url | absolute URL |

## Print engine features

| Feature | Implementation |
|---------|----------------|
| Print preview | `DocumentViewer` window |
| Direct print | `PrintDialog` |
| Multiple copies | `PrintTicket.CopyCount` |
| Watermark | `DrawingVisual` overlay from `options.watermark` |
| Thermal | `PageMediaSize` from `effectivePage`; narrow width |
| PDF export | `IPdfExportService` — pluggable |

## Grid column sync (IMS)

Line columns for entry screens: `gridcolumnglobaldefaults` (existing collection).

At render time, merge table column visibility with org grid prefs (same `transactionType` as module key).
