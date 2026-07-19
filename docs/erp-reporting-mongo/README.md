# ERP Reporting Framework — MongoDB + Node.js + WPF (.NET 8)

Enterprise-grade, **fully database-driven** invoice and label printing. No SQL, no RDLC/Crystal/FastReport/Stimulsoft/DevExpress Reports.

## Deliverables map

| # | Topic | Location |
|---|--------|----------|
| 1 | MongoDB collections | `01-mongodb-collections.md` |
| 2 | Mongoose schemas | `../../api/src/reporting/models/` |
| 3–6 | API (repo / service / controller / routes) | `../../api/src/reporting/` |
| 7 | REST endpoints | `02-api-endpoints.md` |
| 8–9 | WPF MVVM + Designer | `03-wpf-architecture.md` |
| 10 | JSON layout schema | `04-json-layout-schema.md` |
| 11–12 | Render + Print engine | `05-runtime-and-print.md` |
| 13 | Folder structure | `06-folder-structure.md` |
| 14 | Best practices | `07-production-practices.md` |

## Quick start (API)

```bash
# After API is running and authenticated:
POST /api/reporting/seed          # paper sizes + field registry (admin)
GET  /api/reporting/paper-sizes
GET  /api/reporting/report-formats?transactionType=sales_invoice
GET  /api/reporting/report-formats/resolve?transactionType=sales_invoice&partyCode=C001&partyKind=customer
```

## Migration from existing IMS

| Legacy | New collection |
|--------|----------------|
| `salesbilltemplates` | `report_formats` |
| Bill format assignments on accounts | `customer_print_preferences` / `supplier_print_preferences` |
| `gridcolumnglobaldefaults` | Still used for line-column visibility; sync at render |

Run both APIs during migration: `/api/bill-formats` (legacy) and `/api/reporting` (v2 element canvas).
