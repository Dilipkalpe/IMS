# Sales Invoice — DataGrid stress & performance (Phase 2c)

**Scope:** `CorporateDataGrid`, `VirtualGridRow`, `SalesInvoiceLineItemsGrid`, `useSalesInvoiceDocument` calculations.

## Optimizations implemented

| Area | Change |
|------|--------|
| Virtualization | Auto when `data.length > 25`; overscan 8 rows; rAF-throttled scroll |
| Row DOM | Only visible slice mounted (~20–40 rows for 1000 lines) |
| Row memo | `VirtualGridRow` + `memo` — re-render active row + edited row only |
| Column stability | `lineDisplayMap` via ref in `getValue` — columns array not tied to full `doc` |
| Line display | `buildLineDisplayMap(lines)` once per lines change |
| Totals | `computeTotals(lines)` memoized; `SalesInvoiceTotalsRail` isolated with `memo` |
| Focus | Sync scroll + `useLayoutEffect` focus; prune off-screen input refs |
| Stress load | `?stressLines=500` on workspace URL |

## Benchmarks (compute layer)

```bash
cd ims-web
npm run grid:perf
```

Sample targets on dev hardware:

| Scenario | Target |
|----------|--------|
| `computeTotals(500)` | &lt; 5 ms |
| `computeTotals(1000)` | &lt; 10 ms |
| 1000 rapid single-line edits + totals | &lt; 500 ms total |

React render cost is additional; UI should stay responsive with virtualization.

## Manual stress checklist

1. Open workspace with `?stressLines=500` (or 1000).
2. Confirm footer shows `500 line(s) · virtualized`.
3. Scroll top → bottom → top (smooth, no blank gaps).
4. Tab/arrow to row ~400 — focus visible, input accepts keys.
5. Edit Qty rapidly — totals rail updates, no multi-second lag.
6. Barcode scan 20× Enter — lines grow, scan field refocuses.
7. Delete rows on 200+ line doc — focus moves to prior row.
8. Save with invalid line — validation focuses correct qty cell.
9. Open 3 workspace tabs (Ctrl+T) — no crash; each tab loads stress count from URL on first open only.
10. DevTools Memory: 5 min edit session — no runaway growth (heap stair-steps then stable).

## Exit criteria

| Criterion | Status |
|-----------|--------|
| 500+ rows comfortably usable | Yes — virtualized; manual sign-off with `?stressLines=500` |
| No keyboard navigation regressions | Preserved — layout effect focus + scroll sync |
| No virtualization/focus bugs | Addressed — sync scrollTop + ref prune |
| No visible editing lag | Compute layer benchmarked; row memo limits React work |
| Stable memory | DOM bounded by visible rows; refs pruned |

## Known limits (non-blocking)

- Full O(n) `buildLineDisplayMap` on each line edit (acceptable to ~2000 lines in JS).
- Read-only computed columns on visible rows refresh when that row’s object reference changes.
- List grid (`so-list` variant) uses same virtualization threshold; not primary stress target.
- No Web Worker offload for totals (future if n &gt; 2000).

## Next gates

1. Print/export interfaces  
2. API persistence + per-tab document state  
3. IGST / interstate rules  
