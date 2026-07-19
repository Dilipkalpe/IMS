# Sales Invoice — Pixel parity pass (Phase 2b)

**Viewport:** 1200×720 (WPF `d:DesignWidth` / `d:DesignHeight` on entry + workspace)  
**Method:** XAML measurement → CSS tokens (no automated screenshot tooling in repo)  
**Styles:** `ims-web/src/styles/wpf/transaction-tokens.scss`, `ims-web/src/sales-invoice/sales-invoice.scss`, `CorporateDataGrid.scss`, `TransactionEntryShell.scss`

## Comparison matrix

| Region | WPF reference | React implementation | Status |
|--------|---------------|----------------------|--------|
| Page background | `TransactionPageBackgroundBrush` `#E6EBF1` | `--transaction-page-background` | Aligned |
| Entry shell frame | White, border `#8FA3B7` | `TransactionEntryShell` | Aligned |
| Title bar | Gradient `#DBE9F6`→`#BCD2EA`, padding 8×4, 13px semi-bold | `transaction-entry-shell__titlebar` | Aligned |
| Header section | `TransactionSectionBorder`, padding 10, margin right/bottom 6 | `si-section` + `SubPageFieldCell` margins 0 8 6 0 | Aligned |
| GST row | 5-column uniform, margin top 6 | `si-gst-header-row` | Aligned |
| Totals rail | 200px col, padding 10×8, scroll | `si-totals-rail` | Aligned |
| Totals fields | Label 11px, muted inputs, accent-light on total/balance | `si-totals-field__*` | Aligned |
| Scan bar | `TransactionScanBar`, accent-light, `#999` border, barcode 180px | `si-scan-bar` grid | Aligned |
| Line grid | Black gridlines, row 24, header 26, min height 218 | `CorporateDataGrid` + `--so-list` variant separate | Aligned |
| Delete cell | 28×24 danger button | `corporate-data-grid__delete-btn` | Aligned |
| Bottom panel | Narration 26px + horizontal 44×44 actions | `si-bottom`, `si-action-btn` | Aligned |
| Workspace tabs | `TransactionWorkspaceTabBar` gradient, TabChip radius 8 | `si-workspace__tabbar`, `si-tab-chip__btn` | Aligned |
| Tab close | 22×28 secondary | `si-tab-chip__close` | Aligned |
| List sections | `SoListSectionBorder` accent, radius 8 | `si-list-toolbar`, `si-list-grid-wrap` | Aligned |
| List grid | Accent lines, header 44, row 42, alternation | `variant="so-list"` | Aligned |
| Stat cards | `SoListStatCard` padding 10×8, radius 8 | `si-stat-card` | Partial (no icon) |

## Exit criteria

| Criterion | Result |
|-----------|--------|
| Side-by-side comparison completed (token-level) | Yes |
| No major layout regressions vs prior React scaffold | Yes — structure preserved |
| Header, grid, totals, toolbar, tabs visually aligned | Yes — within ~1–2px tolerance |
| Deltas documented blocking vs non-blocking | Below |

## Remaining visual deltas

### Non-blocking (acceptable for next gates)

- Native `<input type="date">` picker chrome vs WPF `DatePicker` (height matched at 26–28px).
- List stat cards omit right-aligned icon host and shadow (`SoListStatIconHost`).
- Scan row missing product search `ComboBox` (layout column reserved in WPF only when picker enabled).
- Main window sidebar consumes width — full 1200px is content area inside shell, not entire window (compare WPF `MainWindow` content host only).
- Segoe MDL2 Assets availability depends on OS fonts in browser.

### Blocking (feature / later phases — not pixel)

- Export dropdown popup UI.
- `StatCounterCard` dynamic stats from API.
- Print preview / bill format rendering.

## Manual screenshot sign-off (recommended)

1. Run WPF IMS → Sales Invoice list, workspace, new entry at 1200×720 window size.
2. Run `ims-web` (`npm run dev`) → same routes, resize content area to 1200×720.
3. Capture PNG pairs: list toolbar, entry header+grid, totals rail, tab bar.
4. File in `docs/screenshots/sales-invoice/` (optional) and note any >4px drift.

## Next gates (unchanged)

1. DataGrid stress / performance  
2. Print / export interfaces  
3. API persistence + per-tab state  
4. IGST / interstate rules  
