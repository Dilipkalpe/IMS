# REST API — `/api/reporting`

All routes require **JWT** (`requireAuth`). Admin-only routes noted.

## Catalog

| Method | Path | Description |
|--------|------|-------------|
| GET | `/catalog` | Transaction types + control types for designer |
| GET | `/field-registry?transactionType=sales_invoice` | Dynamic field registry |
| POST | `/seed` | Seed paper sizes, fields, default formats (admin) |

## Paper sizes

| Method | Path |
|--------|------|
| GET | `/paper-sizes` |
| POST | `/paper-sizes` (admin) |

## Report formats

| Method | Path |
|--------|------|
| GET | `/report-formats?transactionType=grn` |
| GET | `/report-formats/resolve?transactionType=sales_invoice&partyCode=C001&partyKind=customer` |
| GET | `/report-formats/:id` |
| POST | `/report-formats` (admin) |
| PUT | `/report-formats/:id` (admin) |
| DELETE | `/report-formats/:id` (admin) |

### Resolve response

```json
{
  "source": "customer",
  "transactionType": "sales_invoice",
  "partyCode": "C001",
  "format": { "id": "...", "layoutJson": { ... }, "printSettings": { ... } },
  "paperSize": { "key": "A4_PORTRAIT", "widthMm": 210, ... },
  "effectivePage": { "widthMm": 210, "heightMm": 297, "marginsMm": { ... } }
}
```

## Label formats

| Method | Path |
|--------|------|
| GET | `/label-formats?labelType=product` |
| GET | `/label-formats/resolve?labelType=barcode` |
| GET | `/label-formats/:id` |
| POST | `/label-formats` (admin) |
| PUT | `/label-formats/:id` (admin) |

## Party mappings

| Method | Path | Body |
|--------|------|------|
| PUT | `/customer-print-preferences` | `{ customerCode, transactionType, reportFormatId }` |
| PUT | `/supplier-print-preferences` | `{ supplierCode, transactionType, reportFormatId }` |

## Create report format (example)

```http
POST /api/reporting/report-formats
Content-Type: application/json

{
  "formatCode": "SI-MODERN",
  "formatName": "Modern Sales Invoice",
  "transactionType": "sales_invoice",
  "paperSizeKey": "A4_PORTRAIT",
  "isDefault": false,
  "layoutJson": {
    "schemaVersion": 2,
    "page": { "paperSizeKey": "A4_PORTRAIT", "widthMm": 210, "heightMm": 297 },
    "elements": []
  }
}
```
