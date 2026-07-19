# MongoDB collection design

All reporting data lives in the **year-scoped** ERP database (same pattern as existing IMS auth).

## Collections

### `report_formats`

Invoice / document print layouts (element-based JSON).

| Field | Type | Notes |
|-------|------|-------|
| `formatCode` | string | Unique, e.g. `SI-STD` |
| `formatName` | string | Display name |
| `transactionType` | string | `sales_invoice`, `grn`, … |
| `paperSizeKey` | string | FK → `paper_sizes.key` |
| `orientation` | string | `portrait` \| `landscape` |
| `customPaper` | object | Optional override width/height/margins mm |
| `isDefault` | boolean | One per `transactionType` |
| `isActive` | boolean | |
| `layoutJson` | object | Schema v2 — see `04-json-layout-schema.md` |
| `schemaVersion` | number | Default `2` |
| `printSettings` | object | copies, watermark, preview, autoPrint |
| `visibilityOptions` | object | showLogo, showGst, … |
| `createdAt` / `updatedAt` | date | timestamps |

**Indexes:** `{ formatCode: 1 }` unique, `{ transactionType: 1, isDefault: 1 }`, `{ transactionType: 1, isActive: 1 }`

---

### `label_formats`

| Field | Type |
|-------|------|
| `formatCode` | string unique |
| `labelName` | string |
| `labelType` | `product` \| `barcode` \| `qr` \| `batch` \| `warehouse` \| `shipping` |
| `widthMm` | number |
| `heightMm` | number |
| `printerType` | `thermal` \| `laser` \| `any` |
| `layoutJson` | object |
| `isDefault` | boolean per labelType |
| `isActive` | boolean |

---

### `paper_sizes`

| Field | Type |
|-------|------|
| `key` | string unique — `A4_PORTRAIT`, `THERMAL_80` |
| `name` | string |
| `widthMm` | number |
| `heightMm` | number |
| `marginsMm` | `{ top, right, bottom, left }` |
| `orientation` | string |
| `isThermal` | boolean |
| `isSystem` | boolean |

---

### `report_field_registry`

Dynamic fields — **no engine code change** when adding fields.

| Field | Type |
|-------|------|
| `fieldKey` | string |
| `transactionTypes` | string[] — `['*']` or specific |
| `displayLabel` | string |
| `token` | string — `{{invoiceNo}}` |
| `category` | company \| document \| party \| lines \| tax \| footer |
| `dataPath` | string — resolver path e.g. `document.formattedDocNo` |
| `controlTypes` | string[] — which designer controls can bind |
| `sortOrder` | number |
| `isActive` | boolean |

**Index:** `{ fieldKey: 1, transactionTypes: 1 }`

---

### `customer_print_preferences`

| Field | Type |
|-------|------|
| `customerCode` | string |
| `transactionType` | string |
| `reportFormatId` | ObjectId → `report_formats` |
| `isActive` | boolean |

**Unique:** `{ customerCode: 1, transactionType: 1 }`

---

### `supplier_print_preferences`

Same shape with `supplierCode`.

---

### `report_format_versions` (optional audit)

Snapshot `layoutJson` on each save.

---

## Extensibility

New transaction type = insert `transactionType` string + seed `report_field_registry` + default `report_formats` row. **No deploy** required for renderer if element types unchanged.
