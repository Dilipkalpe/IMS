# JSON layout schema (version 1)

All positions and sizes are in **millimeters** from the top-left of the **printable area** (inside margins).

## Root document

```json
{
  "schemaVersion": 1,
  "page": {
    "paperKey": "A4_PORTRAIT",
    "orientation": "portrait",
    "widthMm": 210,
    "heightMm": 297,
    "marginsMm": { "top": 10, "right": 10, "bottom": 10, "left": 10 }
  },
  "theme": {
    "fontFamily": "Segoe UI",
    "baseFontSizePt": 10,
    "primaryColor": "#1e293b",
    "textColor": "#0f172a",
    "borderColor": "#334155"
  },
  "options": {
    "showLogo": true,
    "showGst": true,
    "showAmountInWords": true,
    "watermark": "original"
  },
  "elements": []
}
```

## Element types

| type | Purpose |
|------|---------|
| `text` | Static or `{{token}}` bound text |
| `image` | Company logo, product image; `source`: `companyLogo` \| `field` \| `file` |
| `line` | Horizontal/vertical rule |
| `rectangle` | Box/border |
| `table` | Item lines + optional header/footer bands |
| `barcode` | ZXing symbology |
| `qrcode` | QR payload from field or static |

## Common element properties

```json
{
  "id": "el_001",
  "type": "text",
  "name": "Invoice title",
  "xMm": 12,
  "yMm": 8,
  "widthMm": 80,
  "heightMm": 8,
  "zIndex": 10,
  "visible": true,
  "visibleWhen": "options.showGst",
  "style": {
    "fontFamily": "Segoe UI",
    "fontSizePt": 14,
    "fontWeight": "bold",
    "foreground": "#0f172a",
    "background": null,
    "textAlign": "center",
    "borderThicknessMm": 0,
    "borderColor": "#334155",
    "paddingMm": { "top": 1, "right": 2, "bottom": 1, "left": 2 }
  },
  "binding": {
    "mode": "token",
    "value": "{{documentTitle}}"
  }
}
```

## Table (item engine)

```json
{
  "id": "tbl_items",
  "type": "table",
  "xMm": 10,
  "yMm": 95,
  "widthMm": 190,
  "heightMm": 0,
  "grow": true,
  "dataSource": "lines",
  "showHeader": true,
  "repeatHeaderOnPage": true,
  "columns": [
    { "key": "srNo", "header": "Sr", "widthMm": 12, "align": "center", "visible": true },
    { "key": "itemCode", "header": "Code", "widthMm": 22, "align": "left", "visible": true },
    { "key": "description", "header": "Description", "widthMm": 55, "align": "left", "visible": true },
    { "key": "qty", "header": "Qty", "widthMm": 18, "align": "right", "visible": true },
    { "key": "rate", "header": "Rate", "widthMm": 22, "align": "right", "visible": true },
    { "key": "amount", "header": "Amount", "widthMm": 28, "align": "right", "visible": true }
  ],
  "footer": {
    "rows": [
      { "label": "Total", "columnKey": "amount", "binding": "{{totals.net}}" }
    ]
  }
}
```

Column `key` maps to **field catalog** line bindings (configurable in SQL, not hardcoded).

## Barcode

```json
{
  "type": "barcode",
  "symbology": "Code128",
  "binding": { "value": "{{invoiceNo}}" },
  "xMm": 150,
  "yMm": 20,
  "widthMm": 50,
  "heightMm": 15,
  "showText": true
}
```

Supported symbologies: `Code128`, `Code39`, `EAN13`, `EAN8`, `UPCA`, `GS1128`, `ITF14`.

## QR Code

```json
{
  "type": "qrcode",
  "qrKind": "payment",
  "binding": { "value": "{{paymentQrPayload}}" },
  "xMm": 160,
  "yMm": 250,
  "sizeMm": 25,
  "errorCorrection": "M"
}
```

Kinds: `product`, `batch`, `inventory`, `payment`, `dynamic`.

## Label layout (separate schema version)

Same element model; root adds:

```json
{
  "schemaVersion": 1,
  "label": { "widthMm": 50, "heightMm": 25, "dpi": 203 }
}
```
