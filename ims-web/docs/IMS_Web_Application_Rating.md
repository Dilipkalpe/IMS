# IMS Web Application — QA / Product Rating

**Evaluation date:** 2026-07-21  
**Production URL:** http://144.91.98.218:8081/  
**Repository:** `ims-web/` (branch `main`, HEAD `74e8d23`)  
**Test workbook:** `ims-web/docs/IMS_Test_Cases_Module_Wise.xlsx`  
**Evaluator:** Automated hands-on review (API probes, codebase audit, test workbook analysis). Browser MCP was not available; no full interactive UI walkthrough was performed.

---

## Executive Summary

| Metric | Value |
|--------|------:|
| **Overall score** | **7.1 / 10** |
| **Letter grade** | **B** |
| **Estimated test pass rate (553 cases)** | **~70% pass / ~30% fail or blocked** |
| **Production build freshness** | Static assets last modified **2026-07-21 07:16 UTC** (~12:46 IST) — includes print fix (`f50b831`) and mobile scroll fixes through `61eb886` |

IMS Web is a credible, production-usable ERP web client for Indian GST operations. Core transactional workflows (sales, procurement, finance vouchers, masters, manufacturing basics) are wired and stable enough for daily use. Gaps remain in secondary document toolbar actions, report export/drill-down parity, PDF generation, platform admin flows, and production security hardening (HTTP, API auth boundaries).

---

## Test Workbook Review

### Structure

| Item | Count |
|------|------:|
| Worksheets | 76 (Index + README + 74 module sheets) |
| Modules covered | 74 |
| Hub sections referenced | 15 (+ standalone Login) |
| Total test cases | **553** |
| High / Medium / Low priority | 274 / 211 / 68 |
| Test types | Functional 478 · Print 50 · UI 20 · Mobile 3 · API 2 |

### Column schema (consistent across sheets)

`Test Case ID` · `Module / Screen` · `Feature / Area` · `Test Scenario` · `Preconditions` · `Test Steps` · `Test Data (sample)` · `Expected Result` · `Priority` · `Test Type`

### Coverage strengths

- Aligns with `hubRegistry.ts` — all 15 hubs and 71+ navigable modules represented.
- Indian GST context baked in (FY 2025-26, sample GSTINs, intra/inter-state tax cases).
- Reusable templates per module type: transaction (10 cases), report (7), master (7).
- Regeneratable from `node ims-web/scripts/generate-test-cases-xlsx.mjs`.
- Index sheet maps hub → module → sheet → case count with sample IDs.

### Coverage gaps

- Cases are **generated**, not execution-tracked — no Pass/Fail/Actual Result columns or defect linkage.
- Limited mobile coverage (3 cases total) vs. recent mobile fix churn.
- Secondary toolbar actions (Search, Convert, Edit Previous, barcode side flows) under-specified relative to known stubs in nine `use*Document.ts` hooks.
- RBAC cases assume test users (`sales_user`, `purchase_user`) that may not exist in production DB.
- No explicit security test cases for unauthenticated API access or TLS/HTTPS requirements.

---

## Production & Codebase Evaluation

### API health (live probes)

| Check | Result |
|-------|--------|
| `GET /` | HTTP 200, ~0.5s TTFB |
| `GET /api/health` | `{"ok":true,"service":"ims-api"}` |
| `GET /api/financial-years` | HTTP 200 (public list for login bootstrap) |
| `POST /api/auth/login` | HTTP 200 with valid `loginId`, `password`, `financialYearId` |
| `GET /api/products` (no auth) | HTTP 200 — **returns product data without JWT** |
| JS bundle `/assets/index-QetsymVA.js` | ~3.9s download (large single bundle) |

### Login flow

- Login screen loads FY list before sign-in; requires `financialYearId` on API (not username-only).
- Invalid credentials and missing FY return structured JSON errors.
- Session bootstrap hardened against undefined FY/permissions (`c1961d6`, `1066b2b`).
- HTTP `crypto.randomUUID` polyfill prevents blank-page crash on plain HTTP (`5e4c066`).

**Rating note:** Login UX is polished; API contract is clear. Workbook LOGIN cases largely executable except RBAC users and multi-company scenarios.

### Mobile responsiveness (commits `95e47e1`, `a9d10f8`, `61eb886`)

Fixes address:

- Viewport overflow locks blocking page scroll.
- Scroll stuck after in-page print preview on HTTP.
- Body `overflow:hidden` applied before hamburger open on mobile nav.

Production build timestamp suggests these fixes **are deployed**. Complex transaction entry forms and hub horizontal tabs remain tight on 375px widths — usable but not native-app quality.

### Print & reports (commit `f50b831`)

- HTTP production uses **in-page iframe overlay** instead of popups (`preferInPagePrintPreview()`).
- Mobile print avoids body scroll lock that stuck on iOS/Android.
- Document print across modules unified; list/report HTML print wired.
- PDF export still stub (`stubExportProvider`); payslip PDF and register export parity incomplete.
- Report screens run via API but export/drill-down often partial per `CONVERSION-GAP-REPORT.md`.

### Manufacturing hub (commit `98ec46c`)

- Crash from invalid `CorporateDataGrid` props fixed — hub loads without white-screen.
- Work Orders + BOM tabs functional; job card print uses HTML preview.

### Navigation / hubs

- 15 hub sections, 71 module tabs in `hubRegistry.ts` — matches desktop catalog.
- Hub tab routing, sidebar search, and workspace entry headers implemented.
- `work-centers` nav key still has no screen (desktop gap carried over).

### Known functional stubs (affects test pass rate)

Nine document hooks return `(not implemented)` for non-Save/Cancel toolbar labels:

`sales-order`, `delivery-challan`, `sales-invoice`, `sales-return`, `quotation`, `purchase-order`, `grn`, `purchase-invoice`, `purchase-return`.

This impacts clone, search, convert, edit-previous, and similar cases in transaction modules.

---

## Dimension Ratings (1–10)

| Dimension | Score | Rationale |
|-----------|------:|-----------|
| **Functionality / feature completeness** | **7.0** | ~71 full routes; core CRUD + GST billing works. Secondary entry actions, fiscal year admin, report drill-down, PDF, SMS/email stubs reduce desktop parity (~70% daily ops per gap report). |
| **UI/UX design** | **7.5** | Cohesive ERP chrome, hub tabs, login branding, corporate data grid, workspace headers. Dense forms can overwhelm new users. |
| **Mobile responsiveness** | **6.5** | Recent scroll/print fixes materially improve usability; entry forms and hub tabs still require horizontal scroll or zoom on phones. |
| **Print & reports** | **6.5** | HTTP in-page print works across modules after `f50b831`; PDF/export and advanced report actions remain partial. |
| **Performance / stability** | **7.5** | Fast health/API responses; SPA loads in ~0.5s HTML but ~4s JS bundle. Manufacturing crash and login bootstrap issues fixed. No crash observed in API probes. |
| **Security (HTTP, auth)** | **4.5** | Plain HTTP only; CORS `origin: true`; **unauthenticated read on `/api/products`**; JWT auth on login works but many routes rely on year DB fallback without `requireAuth`. Unacceptable for internet-facing production without TLS + auth middleware audit. |
| **Testability / QA readiness** | **8.0** | Excellent 553-case workbook, gap report, health endpoint, regenerable fixtures. Missing execution tracker and security test cases. |
| **Overall (weighted)** | **7.1** | Strong ERP foundation; not production-hardened for security; parity gaps concentrated in polish tier. |

**Letter grade:** **B** (good, production-viable for controlled/trusted networks after security remediation)

---

## Strengths

- Broad module coverage — 15 hubs, 71 modules reachable from web navigation matching WPF catalog.
- Core GST transaction paths (SO → DC → Invoice, PO → GRN → PI) implemented with list + entry screens.
- Professional login and main-window UX with FY context, permissions, and license awareness.
- HTTP-aware print pipeline (in-page preview) solves popup-blocker issues on production IP deployment.
- Active bug-fix velocity on mobile scroll and print regressions (5 commits on 2026-07-21).
- Manufacturing hub stabilized after grid prop crash fix.
- QA artifacts: module-wise Excel workbook, conversion gap report, gap-analysis script.
- API health endpoint and structured login errors aid monitoring and automation.

---

## Weaknesses / Gaps

- **Security:** HTTP-only deployment; product API readable without authentication; no HSTS/TLS.
- **Secondary toolbar actions** stubbed across 9 document types — affects clone, search, convert cases.
- **PDF / Excel export** largely stubbed — 50 print-type cases may pass preview but fail true PDF expectations.
- **Reports:** Many marked Partial — export, print template parity, drill-to-source incomplete.
- **Platform admin:** Fiscal year switch/year-end UI, backup/license parity, report builder canvas incomplete.
- **Payroll reports:** No payslip PDF parity with desktop.
- **Mobile QA depth:** Only 3 explicit mobile cases; complex forms still awkward on small screens.
- **Performance:** Large monolithic JS bundle (~4s) — no code-splitting observed at asset level.
- **Test data dependencies:** RBAC and GST scenario cases assume masters/users not guaranteed in prod DB.
- **Deploy visibility:** No build/version stamp in UI to correlate running bundle with git SHA.

---

## Module-Wise Quick Ratings (Top Hubs)

Scores reflect likely pass rate vs. workbook cases + known gaps (not individual case execution).

| Hub | Modules | Quick rating | Notes |
|-----|--------:|:------------:|-------|
| **Master Data** | 13 | **8.5 / 10** | Strong CRUD, search, GST fields; export shortcuts work |
| **Sales** | 5 | **7.5 / 10** | Save/list/GST solid; toolbar extras stubbed |
| **Procurement** | 4 | **7.5 / 10** | Same pattern as Sales |
| **Finance** | 6 | **7.0 / 10** | Voucher entry good; allocation shortcuts vary |
| **Manufacturing** | 2 | **7.0 / 10** | Hub stable; WO/BOM core flows; routing/print polish |
| **Payroll & HR** | 4 | **6.5 / 10** | Attendance/payroll runs upgraded; payslip PDF gap |
| **Inventory** | 3 | **6.5 / 10** | Transfers full; movements journal less than WPF |
| **Insights** | 6 | **6.0 / 10** | Reports run; export/drill partial |
| **Financial Reports** | 5 | **6.0 / 10** | API reports render; print/export parity TBD |
| **Transaction Reports** | 8 | **6.0 / 10** | Registers filter OK; export/print gaps |
| **AR & AP** | 3 | **6.0 / 10** | Aging reports via API; limited drill |
| **Inventory Insights** | 3 | **6.0 / 10** | Report shells + API; export partial |
| **Platform** | 4 | **5.5 / 10** | Settings/designer routes; admin flows incomplete |
| **Bulk Import** | 4 | **6.5 / 10** | Wizards work; error UX and large-batch perf vary |
| **User Administration** | 2 | **7.5 / 10** | Users/roles CRUD; permission matrix usable |
| **Authentication / Overview** | 2 | **8.0 / 10** | Login + dashboard reliable |

---

## Test Case Pass / Fail Estimate

Based on codebase stubs, gap report, production build including recent fixes, and API probe results:

| Category | Cases | Est. pass | Est. fail / blocked |
|----------|------:|----------:|--------------------:|
| Master data & admin | ~112 | ~95 (85%) | ~17 |
| Transaction CRUD + GST | ~280 | ~210 (75%) | ~70 (toolbar stubs, validation edge cases) |
| Print-type | 50 | ~38 (76%) | ~12 (PDF expectation vs HTML preview) |
| Reports | ~147 | ~88 (60%) | ~59 (export, drill, print parity) |
| Mobile | 3 | ~2 (67%) | ~1 |
| Login / dashboard / API | 16 | ~14 (88%) | ~2 |
| **Total** | **553** | **~387 (70%)** | **~166 (30%)** |

### Deploy lag impact

| Fix area | In production? | Cases affected |
|----------|----------------|----------------|
| HTTP print (`f50b831`) | Yes (build after commit) | ~40 print cases moved from fail → pass |
| Mobile scroll (`95e47e1`–`61eb886`) | Yes (build ~07:16 UTC) | 3 mobile cases likely pass |
| Manufacturing crash (`98ec46c`) | Yes | WO/BOM navigation cases unblocked |
| Test workbook (`74e8d23`) | N/A (docs only) | — |
| Uncommitted print hook edits (local) | **No** | Minor; not in rating baseline |

If production were stuck on pre-`f50b831` build, estimated pass rate would drop to **~62%** (~340/553).

---

## Recommendations for Production Readiness

### P0 — Before internet exposure

1. **Enable HTTPS** (reverse proxy TLS termination) and redirect HTTP → HTTPS.
2. **Audit API routes** — apply `requireAuth` (and role checks) to all data-mutating and sensitive read endpoints; verify `/api/products` and similar leaks.
3. **Restrict CORS** to known frontend origins in production.
4. Add **security headers** (CSP, X-Frame-Options, HSTS once on HTTPS).

### P1 — Parity & QA (2–4 weeks)

5. Implement or hide **secondary document toolbar actions** (9 doc types) — highest test-case failure driver.
6. Wire **real PDF export** for invoices, registers, and payslips; update print test expected results.
7. Complete **report export/drill-down** for Insights, Financial Reports, Transaction Reports hubs.
8. Add **Pass/Fail/Notes columns** to test workbook or export to test management tool.
9. Seed **RBAC test users** matching workbook preconditions.

### P2 — Polish

10. **Code-split** hub routes to reduce initial JS payload below 2s on 4G.
11. Display **build version / git SHA** in Settings or footer for deploy correlation.
12. Expand **mobile test cases** (hub tabs, invoice entry, print overlay close).
13. Build **fiscal year switch / year-end admin UI** for platform parity.
14. Resolve **`work-centers`** missing screen or remove nav key.

---

## Evaluation Methods

| Method | Performed |
|--------|-----------|
| Live HTTP/API probes to production | Yes |
| Test workbook parse (553 cases, priorities, types) | Yes |
| Codebase / gap report audit | Yes |
| Full browser UI walkthrough (553 cases) | No — browser MCP unavailable |
| Authenticated end-to-end document save | No — limited to API login verification |

---

## References

- `ims-web/docs/CONVERSION-GAP-REPORT.md`
- `ims-web/scripts/generate-test-cases-xlsx.mjs`
- Recent fixes: `f50b831`, `98ec46c`, `95e47e1`, `a9d10f8`, `61eb886`
- Production static asset: `/assets/index-QetsymVA.js` (Last-Modified 2026-07-21 07:16:29 GMT)

---

*Report generated 2026-07-21 as part of IMS Web QA assessment.*
