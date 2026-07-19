# Folder structure (complete)

## Node.js (`api/src/reporting/`)

```
reporting/
  constants/
    transactionTypes.js
    layoutSchema.js
  models/
    ReportFormat.js          → report_formats
    LabelFormat.js           → label_formats
    PaperSize.js             → paper_sizes
    ReportFieldRegistry.js   → report_field_registry
    CustomerPrintPreference.js
    SupplierPrintPreference.js
  repositories/
  services/
  controllers/
  routes/
    reportingRouter.js
```

## WPF (`IMS.Reporting/` recommended new project)

```
IMS.Reporting/
  Core/
  Data/
  Engine/
  Print/
  Barcode/
  Designer/
  Labels/
```

## Existing IMS (migration)

| Current | Target |
|---------|--------|
| `api/.../billFormatTemplates.js` | Keep during migration; proxy to `report_formats` |
| `salesbilltemplates` collection | Migrate documents → `report_formats` |
| `BillFormatDesignerView` | Evolve to element canvas designer |
| `SalesBillFlowDocumentRenderer` | Wrap as v1 renderer; v2 uses `ReportLayoutRenderer` |
