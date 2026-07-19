# Custom ERP Reporting & Printing Framework (WPF + SQL Server)

Production architecture for **database-driven** invoice and label formats — no RDLC, Crystal, FastReport, Stimulsoft, or DevExpress Reports.

Inspired by Tally Prime / Busy / Marg / Zoho Books: users design formats in-app; layouts live in SQL Server as JSON; a runtime engine binds transaction data and prints.

---

## 1. Complete architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ERP Desktop (WPF Host)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  ERP.App (Shell, DI, Navigation)                                           │
│    ├── ERP.Modules.Sales / Purchase / Inventory                              │
│    └── ERP.Reporting.UI          ← Designer + Label Designer + Preview       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ERP.Reporting.Designer (MVVM)   Canvas, toolbox, properties, bands optional │
│  ERP.Reporting.Labels.Designer   Label canvas (mm-based)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ERP.Reporting.Engine            JSON → measure → arrange → Visual tree       │
│  ERP.Reporting.Print             PrintDialog, copies, watermark, thermal     │
│  ERP.Reporting.Pdf               FlowDocument → PDF (Save dialog / file)    │
│  ERP.Reporting.Barcode           ZXing.Net symbologies                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ERP.Reporting.Core              Models, JSON schema, field catalog, contracts│
│  ERP.Reporting.Data              Repositories (Dapper or EF Core)            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  SQL Server                                                                  │
│    ReportFormatMaster, ReportFieldCatalog, PartyFormatMapping,              │
│    LabelFormatMaster, ReportFormatVersion (optional audit)                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data flow at print time

1. **Resolve format** — `EntryType` + party code → mapping table → else default for entry type.
2. **Load layout JSON** — from `ReportFormatMaster.LayoutJson`.
3. **Load field catalog** — merge DB catalog + runtime values (company, document, lines).
4. **Build render tree** — `ReportLayoutRenderer` walks elements; tables expand per line.
5. **Paginate** — page height minus margins; repeat headers; split item table.
6. **Output** — `DocumentPaginator` for preview/print; optional PDF exporter.

### Extension without code changes

| Mechanism | How |
|-----------|-----|
| New transaction type | Insert `EntryType` row + default format seed; add field bindings in `ReportFieldCatalog` (SQL), not C# switch |
| New dynamic field | `ReportFieldCatalog` row with `Token` = `{{fieldKey}}`; designer reads catalog per entry type |
| New paper size | `PaperPreset` enum/table + mm dimensions in JSON `page` node |
| New label size | `LabelFormatMaster` row with width/height mm |

Code only needs **generic renderers** per `element.type` (text, image, line, rect, table, barcode, qrcode).

---

## 2. Database schema

See `02-database-schema.sql`.

---

## 3. Entity models

See `samples/Entities.cs` and `samples/LayoutDocument.cs`.

---

## 4. JSON layout schema

See `03-layout-json-schema.json` (illustrative) and `03-layout-schema.md`.

Versioned root: `{ "schemaVersion": 1, "page": {...}, "elements": [...] }`.

---

## 5. Designer UI architecture

| View | ViewModel | Responsibility |
|------|-----------|----------------|
| `ReportDesignerView` | `ReportDesignerViewModel` | Toolbox, canvas, zoom, rulers, selection |
| `DesignerCanvas` | `DesignerCanvasViewModel` | `ObservableCollection<DesignElementViewModel>` |
| `PropertiesPanel` | `ElementPropertiesViewModel` | Bind selected element; fonts, colors, binding |
| `FieldExplorerView` | `FieldExplorerViewModel` | Loads `ReportFieldCatalog` for entry type |
| `FormatListView` | `ReportFormatListViewModel` | CRUD `ReportFormatMaster` |

**Canvas implementation**

- Root: `Canvas` inside `ScrollViewer` + `Viewbox` for zoom.
- Each element: `ContentPresenter` or custom `DesignerElementControl` with thumbs for resize.
- Drag: capture mouse; update `X`, `Y` in model (mm or % — recommend **mm from top-left of printable area** for thermal parity).
- Snap: 1 mm grid optional.
- Z-order: `Panel.ZIndex` / element `zIndex` in JSON.
- Tables: special designer — column editor sub-dialog bound to `table.columns`.

**Label designer** — separate module; coordinates strictly in mm; smaller canvas presets.

---

## 6. Rendering engine architecture

```
IReportFormatRepository.GetByIdAsync / ResolveAsync(entryType, partyKind, partyCode)
        ↓
LayoutDocument (deserialize JSON)
        ↓
IFieldValueProvider.GetValuesAsync(context)  ← document DTO + company profile
        ↓
ReportLayoutRenderer.Render(layout, values, options)
        ↓
ReportVisualRoot (FixedDocument or FlowDocument)
        ↓
IPrintService.PrintPreview / Print / ExportPdf
```

**Key interfaces**

- `IReportLayoutRenderer` — layout + data → paginated document.
- `IElementRenderer` — one implementation per `element.type`.
- `ITableRenderer` — expands `itemTable` rows using column config + line collection.
- `IBarcodeRenderer` / `IQrCodeRenderer` — ZXing encode → `ImageSource`.

**Binding**

- Text: replace `{{token}}` from field dictionary (case-insensitive).
- Visibility: `visibleWhen` expression optional (e.g. `showGst == true`) stored in JSON or resolved from format flags.

---

## 7. Printing engine architecture

`PrintEngine` (singleton or scoped):

- Input: `IDocumentPaginatorSource` or `FixedDocument`.
- **Print preview** — `Window` + `DocumentViewer` or `FlowDocumentScrollViewer`.
- **Direct print** — `PrintDialog` + `PrintTicket` (page size from layout mm → DIP).
- **Copies** — `PrintTicket.CopyCount` or loop paginator.
- **Watermark** — draw diagonal text on `DrawingVisual` layer (original/duplicate/copy).
- **Thermal** — force custom `PageMediaSize` width 58/80 mm; disable scaling; monospace optional.
- **PDF** — `PdfExporter` using Save File Dialog; options: print to PDF driver, or `XpsDocument` → PDF tool, or dedicated library if you add one later (keep interface so engine stays swappable).

---

## 8. MVVM folder structure

```
src/
  ERP.Reporting.Core/
    Models/
    Layout/
    Fields/
    Enums/
    Interfaces/
    Serialization/
  ERP.Reporting.Data/
    Entities/
    Repositories/
    Sql/
  ERP.Reporting.Engine/
    Renderers/
    Pagination/
    Binding/
  ERP.Reporting.Print/
    PrintEngine.cs
    WatermarkService.cs
    PdfExportService.cs
  ERP.Reporting.Barcode/
    ZXingBarcodeGenerator.cs
    ZXingQrGenerator.cs
  ERP.Reporting.Designer/
    Views/
    ViewModels/
    Controls/
    Services/DesignerCommands.cs
  ERP.Reporting.Labels/
    Core/
    Designer/
    Engine/
  ERP.Reporting.UI/
    Views/ReportFormatListView.xaml
    DependencyInjection/ReportingModule.cs
```

---

## 9. Sample code

See `samples/` folder.

---

## 10. Best practices (scalable ERP)

1. **Version JSON schema** — `schemaVersion` on every layout; migrate with upgrade scripts.
2. **Never hardcode field lists in C#** — `ReportFieldCatalog` table drives Field Explorer.
3. **Separate design units from print units** — store positions in **mm**; convert to DIP at render (`mm * 96 / 25.4`).
4. **Immutable layout at print** — deserialize to read-only graph; no shared mutable state across threads.
5. **Cache format by id** — memory cache 2–5 min; invalidate on save.
6. **Audit** — `ReportFormatVersion` optional snapshot on each save.
7. **Validate JSON on save** — JSON Schema validation in API/SQL proc before commit.
8. **Default seeds** — one system format per `EntryType` in migration scripts.
9. **Party mapping** — unique (PartyKind, PartyCode, EntryType); FK to format master.
10. **Labels separate** — never mix label JSON with invoice JSON; different paginator and DPI rules.
11. **Test render golden files** — snapshot PDF hash for regression on engine changes.
12. **Thermal path** — cap element width to printable width; auto-wrap text; smaller fonts.

---

## Relation to current IMS project

IMS today uses **MongoDB** (`salesbilltemplates`) and a **banded section** designer. Migrating to this framework means:

1. Add SQL Server reporting tables (or sync Mongo → SQL).
2. Replace section-based JSON with **element-based** JSON (this schema).
3. Gradually port `SalesBillFlowDocumentRenderer` logic into `IElementRenderer` implementations.

You can run **both** during migration: resolve SQL format first, fallback to legacy Mongo template.

---

## NuGet packages

| Package | Use |
|---------|-----|
| `ZXing.Net` | Barcode + QR encode |
| `Dapper` or `Microsoft.EntityFrameworkCore.SqlServer` | Data access |
| `Microsoft.Extensions.DependencyInjection` | DI |
| `System.Text.Json` | Layout serialize/deserialize |

Optional later: PDF library behind `IPdfExportService` interface.

---

## Implementation phases

| Phase | Deliverable |
|-------|-------------|
| 1 | SQL schema + repositories + seed formats |
| 2 | Core JSON models + field catalog API |
| 3 | Render engine (text, line, rect, image, table) |
| 4 | Print preview + print + PDF stub |
| 5 | WPF canvas designer |
| 6 | Barcode/QR renderers |
| 7 | Label designer module |
| 8 | Party mapping UI + print integration in sales/purchase modules |
