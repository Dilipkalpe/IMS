# WPF → React UI migration (IMS)

## Scope

This migration converts **UI only** from the WPF project (`IMS/*.xaml`) into `ims-web/`.

| WPF | React |
|-----|-------|
| 92 `.xaml` files | 92 generated components under `ims-web/src/wpf-ui/` |
| `AppResources.xaml`, themes, `LoginResources.xaml` | `ims-web/src/styles/wpf/*.scss` |
| `LoginWindow.xaml` | `ims-web/src/windows/LoginWindow.tsx` (hand-refined) |
| `MainWindow.xaml` | `ims-web/src/windows/MainWindow.tsx` (hand-refined shell) |

**Not migrated:** ViewModels, services, API, database, commands, real bindings.

## Run

```bash
cd ims-web
npm install
npm run dev
```

- Sign-in UI: refined `LoginWindow`
- App shell: refined `MainWindow`
- **Gallery:** “View all 92 WPF screens” — auto-generated parity layer from each XAML

Regenerate stubs after XAML changes:

```bash
npm run generate:ui
```

## 100% fidelity expectations

Pixel-perfect parity for **all 92 screens** requires a phased manual pass on top of generated JSX:

1. **Generated layer** — every XAML file has a React counterpart (no screens omitted).
2. **Resource dictionary** — core colors/styles extracted; full `ControlTemplate` triggers need SCSS equivalents per control.
3. **Custom WPF controls** (`DashboardBarChart`, `ProductScanPickerBar`, etc.) — need dedicated React components (stubs exist in generated tree).
4. **DataTemplates / ItemsControl** — structure preserved; live data uses `placeholders.ts`.

## File map

```
tools/generate-wpf-react-ui.mjs        # XAML → TSX generator
ims-web/src/wpf-ui/manifest.ts         # Registry of all 92 screens
ims-web/src/navigation/                # NavKeys, catalog, route map
ims-web/src/components/ContentHost.tsx # Lazy-loads view by XAML path
ims-web/src/screens/                   # Refined Settings / Account / Sales invoice
ims-web/src/placeholders.ts            # Binding/command placeholders
ims-web/src/windows/                   # Login + Main (high fidelity)
ims-web/src/styles/wpf/                # Theme + AppResources SCSS
```

## Phase 2 (navigation + styles + refined screens)

- Sidebar uses full `navigationCatalog.ts` (same items as WPF `NavigationCatalog.cs`).
- Content resolves via `resolveScreen.tsx` → lazy `refinedByXamlPath` or `ContentHost`.
- **40+ routed views** use `RefinedScreenShell` (`screens/refinedScreens.tsx`).
- Header **Workflows** dropdown + XAML path hint for WPF parity QA.
- See `docs/WPF-REACT-WORKFLOW-VALIDATION.md` for the full checklist.

## Responsive layout

The React app is **responsive** (WPF was fixed desktop). Breakpoints live in `ims-web/src/styles/_breakpoints.scss`.

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| `lg` | &lt; 1024px | Collapsible sidebar drawer, compact header, login stacks vertically |
| `md` | &lt; 768px | Narrower nav tools, smaller login typography |
| `sm` | &lt; 640px | Single-column login stats |
| `transaction` | &lt; 1100px | Sales/purchase entry forms stack (totals rail, header grid, list toolbar wrap) |
| `sm` (transactions) | &lt; 640px | Single-column header fields, 2-col totals rail |

**Shell:** `MainWindow` — hamburger opens off-canvas sidebar; backdrop dismisses on tap.  
**Login:** `LoginWindow` — hero + sign-in panel stack on tablet/phone.  
**Transactions:** `sales-invoice.scss` — shared by all sales modules (Invoice, Order, Quotation, Delivery Challan, Sales Return); entry layout reflows at 1100px / 640px.  
**Grids:** `CorporateDataGrid.scss` — horizontal scroll on narrow viewports.

**Production sales transaction modules (web):** Sales Invoice, Sales Order, Quotation, Delivery Challan, Sales Return — list → workspace → entry with API/local repository.

## Phase 3 (next)

- Manual layout pass on high-traffic generated JSX
- DataGrid / dashboard charts / designer canvas
- API bindings (replace `placeholders.ts`)

## Honest limits

- Dumping full source for all files in one chat is not possible (100k+ lines).
- All sources live in the repo; use the gallery to review each screen.
- WPF `DataGrid`, `FlowDocument`, and `DocumentViewer` need custom React tables/PDF viewers for production parity.
