# JSON layout schema v2 (element canvas)

Stored in `report_formats.layoutJson` and `label_formats.layoutJson`.

## Document report root

```json
{
  "schemaVersion": 2,
  "page": {
    "paperSizeKey": "A4_PORTRAIT",
    "orientation": "portrait",
    "widthMm": 210,
    "heightMm": 297,
    "marginsMm": { "top": 10, "right": 10, "bottom": 10, "left": 10 }
  },
  "theme": {
    "fontFamily": "Segoe UI",
    "baseFontSizePt": 10,
    "textColor": "#0f172a",
    "borderColor": "#334155"
  },
  "options": {
    "showLogo": true,
    "showGst": true,
    "watermark": "original"
  },
  "elements": []
}
```

## Element (all controls)

```json
{
  "id": "el_a1b2",
  "type": "dynamicText",
  "name": "Invoice No",
  "xMm": 120,
  "yMm": 42,
  "widthMm": 70,
  "heightMm": 6,
  "zIndex": 5,
  "visible": true,
  "snapGridMm": 1,
  "style": {
    "fontFamily": "Segoe UI",
    "fontSizePt": 11,
    "fontWeight": "normal",
    "foreground": "#0f172a",
    "background": null,
    "textAlign": "left",
    "borderThicknessMm": 0,
    "borderColor": "#334155"
  },
  "binding": {
    "token": "{{invoiceNo}}",
    "fieldKey": "invoiceNo"
  }
}
```

## Control types

| type | Notes |
|------|-------|
| `text` | Static text in `binding.value` |
| `dynamicText` | Token from field registry |
| `image` | `binding.source`: `file` \| `field` |
| `companyLogo` | Resolves company logo path/bytes |
| `line` | `orientation`: horizontal \| vertical |
| `rectangle` | Border/fill |
| `table` | Item lines — see below |
| `barcode` | `symbology`: Code128, Code39, EAN13, … |
| `qrcode` | `qrKind`: product, batch, payment, url, dynamic |

## Table element

```json
{
  "type": "table",
  "binding": { "fieldKey": "itemTable", "dataSource": "lines" },
  "table": {
    "showHeader": true,
    "repeatHeaderOnPage": true,
    "rowHeightMm": 6,
    "columns": [
      { "key": "srNo", "header": "Sr", "widthMm": 12, "align": "center", "visible": true },
      { "key": "itemCode", "header": "Code", "widthMm": 22, "visible": true },
      { "key": "description", "header": "Description", "widthMm": 55, "visible": true },
      { "key": "qty", "header": "Qty", "widthMm": 18, "align": "right", "visible": true },
      { "key": "amount", "header": "Amount", "widthMm": 28, "align": "right", "visible": true }
    ],
    "footer": {
      "rows": [
        { "label": "Grand Total", "columnKey": "amount", "binding": "{{grandTotal}}" }
      ]
    }
  }
}
```

Column keys map to `dataPath` on line DTOs via **field registry** — not hardcoded in renderer.

## Label layout root

```json
{
  "schemaVersion": 2,
  "label": { "widthMm": 50, "heightMm": 25, "dpi": 203 },
  "elements": []
}
```
