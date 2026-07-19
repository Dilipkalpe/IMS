# Sales Invoice — IGST / interstate tax (Phase 2f)

**WPF reference:** `GstEntrySummarySupport.cs`, `SalesLineItem.cs`, `IndianStates.cs`, `SalesEntryFormViewModelBase.IsInterStateTax`.

**React:** `ims-web/src/sales-invoice/gstTax.ts` (determination + validation), `calculations.ts` (amounts).

## Rules

| Condition | Line tax split | Totals rail |
|-----------|----------------|-------------|
| Company state = place of supply (intra) | CGST % = SGST % = half of combined GST; IGST = 0 | CGST + SGST |
| Company state ≠ place of supply (inter) | IGST % = combined GST; CGST/SGST = 0 | IGST only |

- **Company state** — first 2 digits of seller GSTIN (default seller `24AABCU9603R1ZM` → Gujarat `24`).
- **Place of supply** — `NN-State name` (e.g. `24-Gujarat`), same as WPF `IndianStates.StateOptions`.
- **Combined rate per line** — `cgstPercent + sgstPercent`, or `igstPercent` when stored IGST-only.
- **Zero-rated / exempt** — combined rate 0 → no tax amounts.

## API (unchanged for screens)

- `computeTotals(lines, taxContext?)` — optional context; without context, legacy per-column percents apply.
- `computeLine(line, taxContext?)` — same.
- `buildLineDisplayMap(lines, header)` — passes header for POS-driven display percents.
- `validateGstTax(context)` — errors (missing POS) + warnings (GSTIN mismatch, unregistered).

No tax branching in React UI components — only `calculations` / `gstTax` / `lineDisplay`.

## Testing matrix

Run: `cd ims-web && npm run test:gst`

| Scenario | Covered |
|----------|---------|
| Same-state taxable (5% → 2.5+2.5) | ✔ |
| Interstate taxable (5% → IGST) | ✔ |
| Zero-rated (0%) | ✔ |
| POS change after lines entered | ✔ |
| Mixed line rates (5% + 12%) interstate | ✔ |
| State code parsing (coded + legacy names) | ✔ |

## Manual check

1. Default POS `24-Gujarat` — totals show CGST/SGST, status `CGST+SGST (intra-state)`.
2. Change POS to `27-Maharashtra` — IGST column fills, CGST/SGST amounts zero; rail IGST updates.
3. Print preview — tax breakdown matches on-screen totals.

## Exit criteria

- [x] Tax split per GST rules for supported scenarios
- [x] Totals rail updates when place-of-supply changes
- [x] Printable document uses `computeTotals` / `computeLine` with header context
- [x] No tax-rule logic in UI components
