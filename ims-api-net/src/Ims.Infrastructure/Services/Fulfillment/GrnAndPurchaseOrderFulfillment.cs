using System.Text.Json;
using Ims.Application.Abstractions;
using Ims.Domain.Entities;
using Ims.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace Ims.Infrastructure.Services.Fulfillment;

public sealed class GrnInvoicingService(ImsDbContext db, IFinancialYearContext fy)
{
    public static readonly string[] InvoiceableGrnStatuses =
        ["open", "confirmed", "dispatched", "posted", "received", "partially_invoiced"];

    private static readonly HashSet<string> OperationalWhenNotInvoiced =
        new(StringComparer.OrdinalIgnoreCase) { "confirmed", "dispatched", "posted", "received" };

    private string YearDb => fy.YearDatabaseName
        ?? throw new InvalidOperationException("Financial year context is required.");

    public async Task<Dictionary<string, decimal>> LoadGrnInvoicedQtyIndexAsync(string? excludePiId, CancellationToken ct)
    {
        var query = db.PurchaseInvoices.AsNoTracking()
            .Where(d => d.YearDatabaseName == YearDb
                        && d.Status != "cancelled"
                        && d.Status != "draft");

        if (!string.IsNullOrEmpty(excludePiId))
            query = query.Where(d => d.Id != excludePiId);

        var docs = await query.Select(d => d.BodyJson).ToListAsync(ct);
        return FulfillmentQty.BuildLineQtyIndex(
            docs.Select(FulfillmentQty.GetLinesFromBodyJson),
            "grnPrefix", "grnDocNo", "grnLineSr", "GRN");
    }

    public static string DeriveGrnInvoiceStatus(IEnumerable<Dictionary<string, object?>> lines, string? priorStatus = "open")
    {
        var list = lines.ToList();
        if (list.Count == 0) return "open";

        var anyInvoiced = false;
        var anyPending = false;
        foreach (var line in list)
        {
            var received = FulfillmentQty.ParseQty(line.GetValueOrDefault("qty"));
            var invoiced = FulfillmentQty.ParseQty(line.GetValueOrDefault("invoicedQty") ?? 0);
            if (invoiced > 0) anyInvoiced = true;
            if (invoiced < received) anyPending = true;
        }

        if (anyInvoiced && anyPending) return "partially_invoiced";
        if (anyInvoiced && !anyPending) return "fully_invoiced";

        var prior = (priorStatus ?? "open").ToLowerInvariant();
        if (OperationalWhenNotInvoiced.Contains(prior)) return prior;
        return "open";
    }

    public async Task SyncGrnFromInvoicesAsync(string grnPrefix, int docNo, CancellationToken ct)
    {
        var prefix = FulfillmentQty.NormalizePrefix(grnPrefix, "GRN");
        var grn = await db.Grns
            .FirstOrDefaultAsync(d => d.YearDatabaseName == YearDb && d.DocPrefix == prefix && d.DocNo == docNo, ct);
        if (grn is null) return;

        var index = await LoadGrnInvoicedQtyIndexAsync(null, ct);
        var body = FulfillmentQty.GetBodyDict(grn.BodyJson);
        var lines = FulfillmentQty.ExtractLines(body.GetValueOrDefault("lines"));

        foreach (var line in lines)
        {
            var invoiced = FulfillmentQty.SumQtyFromIndex(index, prefix, docNo, line.GetValueOrDefault("sr"), "GRN");
            line["invoicedQty"] = FulfillmentQty.FormatQty(invoiced);
        }

        var nextStatus = DeriveGrnInvoiceStatus(
            lines.Select(l => new Dictionary<string, object?>
            {
                ["qty"] = l.GetValueOrDefault("qty"),
                ["invoicedQty"] = l.GetValueOrDefault("invoicedQty")
            }),
            grn.Status);

        if (!string.Equals(grn.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
            body["status"] = nextStatus;

        body["lines"] = lines;
        FulfillmentQty.WriteBody(grn, body);
        await db.SaveChangesAsync(ct);
    }

    public static List<object> CollectGrnReferencesFromLines(IEnumerable<Dictionary<string, object?>> lines)
    {
        var map = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
        foreach (var line in lines)
        {
            if (line.GetValueOrDefault("grnFormattedDocNo") is null && line.GetValueOrDefault("grnDocNo") is null)
                continue;
            var prefix = FulfillmentQty.NormalizePrefix(line.GetValueOrDefault("grnPrefix")?.ToString(), "GRN");
            var docNo = FulfillmentQty.CoerceInt(line.GetValueOrDefault("grnDocNo"));
            var key = $"{prefix}-{docNo}";
            if (map.ContainsKey(key)) continue;
            map[key] = new Dictionary<string, object?>
            {
                ["docPrefix"] = prefix,
                ["docNo"] = docNo,
                ["formattedDocNo"] = line.GetValueOrDefault("grnFormattedDocNo")?.ToString() ?? $"{prefix}-{docNo}"
            };
        }
        return map.Values.ToList();
    }

    public static string BuildGrnReferenceText(IEnumerable<object> refs) =>
        string.Join(", ", refs
            .Select(r => r is Dictionary<string, object?> d ? d.GetValueOrDefault("formattedDocNo")?.ToString() : null)
            .Where(s => !string.IsNullOrEmpty(s)));

    public static IEnumerable<string> CollectGrnKeysFromLines(IEnumerable<Dictionary<string, object?>> lines)
    {
        foreach (var line in lines)
        {
            if (line.GetValueOrDefault("grnDocNo") is null) continue;
            var prefix = FulfillmentQty.NormalizePrefix(line.GetValueOrDefault("grnPrefix")?.ToString(), "GRN");
            yield return $"{prefix}|{FulfillmentQty.CoerceInt(line.GetValueOrDefault("grnDocNo"))}";
        }
    }

    public async Task ValidatePurchaseInvoiceLinesAsync(Dictionary<string, object?> payload, string? excludePiId, CancellationToken ct)
    {
        var supplier = FulfillmentQty.NormalizeParty(payload.GetValueOrDefault("supplier"));
        if (string.IsNullOrEmpty(supplier))
            throw new NumberedDocException(400, "Supplier is required on purchase invoice");

        var lines = FulfillmentQty.EnsureMutableLines(payload);
        var invoicedIndex = await LoadGrnInvoicedQtyIndexAsync(excludePiId, ct);
        var grnCache = new Dictionary<string, GrnDocument?>(StringComparer.OrdinalIgnoreCase);

        for (var i = 0; i < lines.Count; i++)
        {
            var line = lines[i];
            if (line.GetValueOrDefault("grnDocNo") is null || line.GetValueOrDefault("grnLineSr") is null)
                continue;

            var grnPrefix = FulfillmentQty.NormalizePrefix(line.GetValueOrDefault("grnPrefix")?.ToString(), "GRN");
            var grnDocNo = FulfillmentQty.CoerceInt(line.GetValueOrDefault("grnDocNo"));
            var grnLineSr = FulfillmentQty.CoerceInt(line.GetValueOrDefault("grnLineSr"));
            var grnKey = $"{grnPrefix}|{grnDocNo}";

            if (!grnCache.TryGetValue(grnKey, out var grn))
            {
                grn = await db.Grns.AsNoTracking()
                    .FirstOrDefaultAsync(d => d.YearDatabaseName == YearDb && d.DocPrefix == grnPrefix && d.DocNo == grnDocNo, ct);
                grnCache[grnKey] = grn;
            }

            if (grn is null)
            {
                var label = line.GetValueOrDefault("grnFormattedDocNo")?.ToString() ?? $"{grnPrefix}-{grnDocNo}";
                throw new NumberedDocException(400, $"GRN {label} not found (line {i + 1})");
            }

            if (!FulfillmentQty.PartiesMatch(grn.Supplier, supplier))
                throw new NumberedDocException(400,
                    $"Line {i + 1}: GRN {grn.FormattedDocNo} belongs to a different supplier ({grn.Supplier})");

            if (!InvoiceableGrnStatuses.Contains(grn.Status ?? "", StringComparer.OrdinalIgnoreCase))
                throw new NumberedDocException(400, $"GRN {grn.FormattedDocNo} cannot be invoiced (status: {grn.Status}).");

            var grnLines = FulfillmentQty.GetLinesFromBodyJson(grn.BodyJson);
            var grnLine = grnLines.FirstOrDefault(l => FulfillmentQty.CoerceInt(l.GetValueOrDefault("sr")) == grnLineSr);
            if (grnLine is null)
                throw new NumberedDocException(400, $"GRN line {grnLineSr} not found on {grn.FormattedDocNo} (invoice line {i + 1})");

            var invoiceQty = FulfillmentQty.ParseQty(line.GetValueOrDefault("qty"));
            if (invoiceQty <= 0)
                throw new NumberedDocException(400, $"Invoice quantity must be greater than zero (line {i + 1})");

            var pending = Math.Max(0,
                FulfillmentQty.ParseQty(grnLine.GetValueOrDefault("qty"))
                - FulfillmentQty.SumQtyFromIndex(invoicedIndex, grnPrefix, grnDocNo, grnLineSr, "GRN"));

            if (invoiceQty > pending + 0.0001m)
                throw new NumberedDocException(400,
                    $"Line {i + 1}: invoice qty {FulfillmentQty.FormatQty(invoiceQty)} exceeds pending {FulfillmentQty.FormatQty(pending)} on {grn.FormattedDocNo} (line {grnLineSr})");

            line["grnPrefix"] = grnPrefix;
            line["grnDocNo"] = grnDocNo;
            line["grnFormattedDocNo"] = line.GetValueOrDefault("grnFormattedDocNo")?.ToString() ?? grn.FormattedDocNo;
            line["grnLineSr"] = grnLineSr;
            line["grnReceivedQty"] = FulfillmentQty.FormatQty(FulfillmentQty.ParseQty(grnLine.GetValueOrDefault("qty")));
            line["grnPendingQty"] = FulfillmentQty.FormatQty(pending);
        }

        var refs = CollectGrnReferencesFromLines(lines);
        payload["grnReferences"] = refs;
        payload["grnReference"] = BuildGrnReferenceText(refs);
    }

    public async Task ApplyPurchaseInvoiceFulfillmentAsync(IReadOnlyDictionary<string, object?> inv, CancellationToken ct)
    {
        var lines = FulfillmentQty.ExtractLines(inv.GetValueOrDefault("lines"));
        foreach (var refObj in CollectGrnReferencesFromLines(lines))
        {
            if (refObj is not Dictionary<string, object?> r) continue;
            await SyncGrnFromInvoicesAsync(
                r.GetValueOrDefault("docPrefix")?.ToString() ?? "GRN",
                FulfillmentQty.CoerceInt(r.GetValueOrDefault("docNo")),
                ct);
        }
    }

    public async Task RefreshInvoicingForGrnsAsync(IEnumerable<string> grnKeys, CancellationToken ct)
    {
        foreach (var key in grnKeys.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            var parts = key.Split('|');
            if (parts.Length < 2) continue;
            await SyncGrnFromInvoicesAsync(parts[0], int.Parse(parts[1]), ct);
        }
    }

    public async Task<object> ListPendingForInvoiceAsync(string? supplier, CancellationToken ct)
    {
        var term = FulfillmentQty.NormalizeParty(supplier);
        if (string.IsNullOrEmpty(term))
            throw new NumberedDocException(400, "supplier query parameter is required");

        var statusSet = InvoiceableGrnStatuses.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var grns = await db.Grns.AsNoTracking()
            .Where(d => d.YearDatabaseName == YearDb && d.Supplier != null && statusSet.Contains(d.Status!))
            .OrderByDescending(d => d.TranDate)
            .ThenByDescending(d => d.DocNo)
            .ToListAsync(ct);

        grns = grns.Where(d => FulfillmentQty.PartiesMatch(d.Supplier, term)).ToList();
        var index = await LoadGrnInvoicedQtyIndexAsync(null, ct);
        var items = new List<object>();

        foreach (var grn in grns)
        {
            if (!HasPending(grn, index)) continue;
            items.Add(new
            {
                docPrefix = grn.DocPrefix,
                docNo = grn.DocNo,
                formattedDocNo = grn.FormattedDocNo,
                supplier = grn.Supplier,
                status = grn.Status,
                grnDate = PendingRefParser.GetDateFromBody(grn.BodyJson, "grnDate") ?? grn.TranDate
            });
        }

        return new { items, total = items.Count };
    }

    public async Task<object> BuildPendingInvoiceLinesAsync(string? supplier, IReadOnlyList<(string Prefix, int DocNo)> refs, CancellationToken ct)
    {
        var term = FulfillmentQty.NormalizeParty(supplier);
        if (string.IsNullOrEmpty(term))
            throw new NumberedDocException(400, "Supplier is required");
        if (refs.Count == 0)
            throw new NumberedDocException(400, "Select at least one GRN");

        var prefixes = refs.Select(r => r.Prefix).Distinct().ToList();
        var docNos = refs.Select(r => r.DocNo).ToList();
        var grnDocs = await db.Grns.AsNoTracking()
            .Where(d => d.YearDatabaseName == YearDb && prefixes.Contains(d.DocPrefix) && docNos.Contains(d.DocNo))
            .ToListAsync(ct);
        var byKey = grnDocs.ToDictionary(g => $"{g.DocPrefix.ToUpperInvariant()}|{g.DocNo}", StringComparer.OrdinalIgnoreCase);
        var index = await LoadGrnInvoicedQtyIndexAsync(null, ct);
        var lines = new List<Dictionary<string, object?>>();

        foreach (var (grnPrefix, docNo) in refs)
        {
            if (!byKey.TryGetValue($"{grnPrefix}|{docNo}", out var grn))
                throw new NumberedDocException(404, $"GRN {grnPrefix}-{docNo} not found");

            if (!FulfillmentQty.PartiesMatch(grn.Supplier, term))
                throw new NumberedDocException(400, $"GRN {grn.FormattedDocNo} does not belong to supplier {term}");

            if (!InvoiceableGrnStatuses.Contains(grn.Status ?? "", StringComparer.OrdinalIgnoreCase))
                throw new NumberedDocException(400,
                    $"GRN {grn.FormattedDocNo} is not available for invoicing (status: {grn.Status})");

            foreach (var line in FulfillmentQty.GetLinesFromBodyJson(grn.BodyJson))
            {
                var sr = FulfillmentQty.CoerceInt(line.GetValueOrDefault("sr"));
                var pending = Math.Max(0,
                    FulfillmentQty.ParseQty(line.GetValueOrDefault("qty"))
                    - FulfillmentQty.SumQtyFromIndex(index, grnPrefix, docNo, sr, "GRN"));
                if (pending <= 0) continue;

                var rate = line.GetValueOrDefault("rate");
                lines.Add(new Dictionary<string, object?>
                {
                    ["grnPrefix"] = grnPrefix,
                    ["grnDocNo"] = docNo,
                    ["grnFormattedDocNo"] = grn.FormattedDocNo,
                    ["grnLineSr"] = sr,
                    ["productRetailCode"] = line.GetValueOrDefault("productRetailCode"),
                    ["itemDescription"] = line.GetValueOrDefault("itemDescription"),
                    ["qty"] = FulfillmentQty.FormatQty(pending),
                    ["rate"] = rate,
                    ["salesRate"] = line.GetValueOrDefault("salesRate") ?? rate,
                    ["discPercent"] = line.GetValueOrDefault("discPercent"),
                    ["discValue"] = line.GetValueOrDefault("discValue"),
                    ["taxType"] = line.GetValueOrDefault("taxType"),
                    ["taxPercent"] = line.GetValueOrDefault("taxPercent"),
                    ["amount"] = line.GetValueOrDefault("amount"),
                    ["grnReceivedQty"] = FulfillmentQty.FormatQty(FulfillmentQty.ParseQty(line.GetValueOrDefault("qty"))),
                    ["grnPendingQty"] = FulfillmentQty.FormatQty(pending)
                });
            }
        }

        if (lines.Count == 0)
            throw new NumberedDocException(400, "No pending lines found on selected GRNs");

        return new { lines };
    }

    private static bool HasPending(GrnDocument grn, IReadOnlyDictionary<string, decimal> index)
    {
        foreach (var line in FulfillmentQty.GetLinesFromBodyJson(grn.BodyJson))
        {
            var pending = Math.Max(0,
                FulfillmentQty.ParseQty(line.GetValueOrDefault("qty"))
                - FulfillmentQty.SumQtyFromIndex(index, grn.DocPrefix, grn.DocNo, line.GetValueOrDefault("sr"), "GRN"));
            if (pending > 0) return true;
        }
        return false;
    }
}

public sealed class PurchaseOrderFulfillmentService(ImsDbContext db, IFinancialYearContext fy)
{
    public static readonly string[] ReceivablePoStatuses = ["open", "partially_received"];

    private string YearDb => fy.YearDatabaseName
        ?? throw new InvalidOperationException("Financial year context is required.");

    public async Task<Dictionary<string, decimal>> LoadPoReceivedQtyIndexAsync(string? excludeGrnId, CancellationToken ct)
    {
        var query = db.Grns.AsNoTracking()
            .Where(d => d.YearDatabaseName == YearDb
                        && d.Status != "cancelled"
                        && d.Status != "draft");

        if (!string.IsNullOrEmpty(excludeGrnId))
            query = query.Where(d => d.Id != excludeGrnId);

        var docs = await query.Select(d => d.BodyJson).ToListAsync(ct);
        return FulfillmentQty.BuildLineQtyIndex(
            docs.Select(FulfillmentQty.GetLinesFromBodyJson),
            "poPrefix", "poDocNo", "poLineSr", "PO");
    }

    public static string DerivePurchaseOrderStatus(IEnumerable<Dictionary<string, object?>> lines)
    {
        var list = lines.ToList();
        if (list.Count == 0) return "open";

        var anyReceived = false;
        var anyPending = false;
        foreach (var line in list)
        {
            var ordered = FulfillmentQty.ParseQty(line.GetValueOrDefault("qty"));
            var received = FulfillmentQty.ParseQty(line.GetValueOrDefault("receivedQty"));
            if (received > 0) anyReceived = true;
            if (received < ordered) anyPending = true;
        }

        if (anyReceived && anyPending) return "partially_received";
        if (anyReceived && !anyPending) return "fully_received";
        return "open";
    }

    public async Task SyncPurchaseOrderFromReceiptsAsync(string poPrefix, int docNo, CancellationToken ct)
    {
        var prefix = FulfillmentQty.NormalizePrefix(poPrefix, "PO");
        var order = await db.PurchaseOrders
            .FirstOrDefaultAsync(d => d.YearDatabaseName == YearDb && d.DocPrefix == prefix && d.DocNo == docNo, ct);
        if (order is null) return;

        var index = await LoadPoReceivedQtyIndexAsync(null, ct);
        var body = FulfillmentQty.GetBodyDict(order.BodyJson);
        var lines = FulfillmentQty.ExtractLines(body.GetValueOrDefault("lines"));

        foreach (var line in lines)
        {
            var received = FulfillmentQty.SumQtyFromIndex(index, prefix, docNo, line.GetValueOrDefault("sr"), "PO");
            line["receivedQty"] = FulfillmentQty.FormatQty(received);
        }

        var nextStatus = DerivePurchaseOrderStatus(lines);
        if (!string.Equals(order.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
            body["status"] = nextStatus;

        body["lines"] = lines;
        FulfillmentQty.WriteBody(order, body);
        await db.SaveChangesAsync(ct);
    }

    public static List<object> CollectPoReferencesFromLines(IEnumerable<Dictionary<string, object?>> lines)
    {
        var map = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
        foreach (var line in lines)
        {
            if (line.GetValueOrDefault("poFormattedDocNo") is null && line.GetValueOrDefault("poDocNo") is null)
                continue;
            var prefix = FulfillmentQty.NormalizePrefix(line.GetValueOrDefault("poPrefix")?.ToString(), "PO");
            var docNo = FulfillmentQty.CoerceInt(line.GetValueOrDefault("poDocNo"));
            var key = $"{prefix}-{docNo}";
            if (map.ContainsKey(key)) continue;
            map[key] = new Dictionary<string, object?>
            {
                ["docPrefix"] = prefix,
                ["docNo"] = docNo,
                ["formattedDocNo"] = line.GetValueOrDefault("poFormattedDocNo")?.ToString() ?? $"{prefix}-{docNo}"
            };
        }
        return map.Values.ToList();
    }

    public static string BuildPoReferenceText(IEnumerable<object> refs) =>
        string.Join(", ", refs
            .Select(r => r is Dictionary<string, object?> d ? d.GetValueOrDefault("formattedDocNo")?.ToString() : null)
            .Where(s => !string.IsNullOrEmpty(s)));

    public static IEnumerable<string> CollectPoKeysFromLines(IEnumerable<Dictionary<string, object?>> lines)
    {
        foreach (var line in lines)
        {
            if (line.GetValueOrDefault("poDocNo") is null) continue;
            var prefix = FulfillmentQty.NormalizePrefix(line.GetValueOrDefault("poPrefix")?.ToString(), "PO");
            yield return $"{prefix}|{FulfillmentQty.CoerceInt(line.GetValueOrDefault("poDocNo"))}";
        }
    }

    public async Task ValidateGrnLinesAsync(Dictionary<string, object?> payload, string? excludeGrnId, CancellationToken ct)
    {
        var supplier = FulfillmentQty.NormalizeParty(payload.GetValueOrDefault("supplier"));
        if (string.IsNullOrEmpty(supplier))
            throw new NumberedDocException(400, "Supplier is required on GRN");

        var lines = FulfillmentQty.EnsureMutableLines(payload);
        var receivedIndex = await LoadPoReceivedQtyIndexAsync(excludeGrnId, ct);
        var orderCache = new Dictionary<string, PurchaseOrderDocument?>(StringComparer.OrdinalIgnoreCase);

        for (var i = 0; i < lines.Count; i++)
        {
            var line = lines[i];
            if (line.GetValueOrDefault("poDocNo") is null || line.GetValueOrDefault("poLineSr") is null)
                continue;

            var poPrefix = FulfillmentQty.NormalizePrefix(line.GetValueOrDefault("poPrefix")?.ToString(), "PO");
            var poDocNo = FulfillmentQty.CoerceInt(line.GetValueOrDefault("poDocNo"));
            var poLineSr = FulfillmentQty.CoerceInt(line.GetValueOrDefault("poLineSr"));
            var orderKey = $"{poPrefix}|{poDocNo}";

            if (!orderCache.TryGetValue(orderKey, out var order))
            {
                order = await db.PurchaseOrders.AsNoTracking()
                    .FirstOrDefaultAsync(d => d.YearDatabaseName == YearDb && d.DocPrefix == poPrefix && d.DocNo == poDocNo, ct);
                orderCache[orderKey] = order;
            }

            if (order is null)
            {
                var label = line.GetValueOrDefault("poFormattedDocNo")?.ToString() ?? $"{poPrefix}-{poDocNo}";
                throw new NumberedDocException(400, $"Purchase order {label} not found (line {i + 1})");
            }

            if (!FulfillmentQty.PartiesMatch(order.Supplier, supplier))
                throw new NumberedDocException(400,
                    $"Line {i + 1}: purchase order {order.FormattedDocNo} belongs to a different supplier ({order.Supplier})");

            if (!ReceivablePoStatuses.Contains(order.Status ?? "", StringComparer.OrdinalIgnoreCase))
                throw new NumberedDocException(400,
                    $"Purchase order {order.FormattedDocNo} cannot be received (status: {order.Status}). Only Open or Partially Received orders are allowed.");

            var poLines = FulfillmentQty.GetLinesFromBodyJson(order.BodyJson);
            var poLine = poLines.FirstOrDefault(l => FulfillmentQty.CoerceInt(l.GetValueOrDefault("sr")) == poLineSr);
            if (poLine is null)
                throw new NumberedDocException(400, $"PO line {poLineSr} not found on {order.FormattedDocNo} (GRN line {i + 1})");

            var receiveQty = FulfillmentQty.ParseQty(line.GetValueOrDefault("qty"));
            if (receiveQty <= 0)
                throw new NumberedDocException(400, $"Receipt quantity must be greater than zero (line {i + 1})");

            var pending = Math.Max(0,
                FulfillmentQty.ParseQty(poLine.GetValueOrDefault("qty"))
                - FulfillmentQty.SumQtyFromIndex(receivedIndex, poPrefix, poDocNo, poLineSr, "PO"));

            if (receiveQty > pending + 0.0001m)
                throw new NumberedDocException(400,
                    $"Line {i + 1}: receipt qty {FulfillmentQty.FormatQty(receiveQty)} exceeds pending {FulfillmentQty.FormatQty(pending)} on {order.FormattedDocNo} (line {poLineSr})");

            line["poPrefix"] = poPrefix;
            line["poDocNo"] = poDocNo;
            line["poFormattedDocNo"] = line.GetValueOrDefault("poFormattedDocNo")?.ToString() ?? order.FormattedDocNo;
            line["poLineSr"] = poLineSr;
            line["poOrderedQty"] = FulfillmentQty.FormatQty(FulfillmentQty.ParseQty(poLine.GetValueOrDefault("qty")));
            line["poPendingQty"] = FulfillmentQty.FormatQty(pending);
        }

        var refs = CollectPoReferencesFromLines(lines);
        payload["poReferences"] = refs;
        payload["poReference"] = BuildPoReferenceText(refs);
    }

    public async Task ApplyGrnFulfillmentAsync(IReadOnlyDictionary<string, object?> grn, CancellationToken ct)
    {
        var lines = FulfillmentQty.ExtractLines(grn.GetValueOrDefault("lines"));
        foreach (var refObj in CollectPoReferencesFromLines(lines))
        {
            if (refObj is not Dictionary<string, object?> r) continue;
            await SyncPurchaseOrderFromReceiptsAsync(
                r.GetValueOrDefault("docPrefix")?.ToString() ?? "PO",
                FulfillmentQty.CoerceInt(r.GetValueOrDefault("docNo")),
                ct);
        }
    }

    public async Task RefreshFulfillmentForPurchaseOrdersAsync(IEnumerable<string> poKeys, CancellationToken ct)
    {
        foreach (var key in poKeys.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            var parts = key.Split('|');
            if (parts.Length < 2) continue;
            await SyncPurchaseOrderFromReceiptsAsync(parts[0], int.Parse(parts[1]), ct);
        }
    }

    public async Task<object> ListPendingForReceiptAsync(string? supplier, CancellationToken ct)
    {
        var term = FulfillmentQty.NormalizeParty(supplier);
        if (string.IsNullOrEmpty(term))
            throw new NumberedDocException(400, "supplier query parameter is required");

        var statusSet = ReceivablePoStatuses.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var orders = await db.PurchaseOrders.AsNoTracking()
            .Where(d => d.YearDatabaseName == YearDb && d.Supplier != null && statusSet.Contains(d.Status!))
            .OrderByDescending(d => d.TranDate)
            .ThenByDescending(d => d.DocNo)
            .ToListAsync(ct);

        orders = orders.Where(d => FulfillmentQty.PartiesMatch(d.Supplier, term)).ToList();
        var index = await LoadPoReceivedQtyIndexAsync(null, ct);
        var items = new List<object>();

        foreach (var order in orders)
        {
            if (!HasPending(order, index)) continue;
            items.Add(new
            {
                docPrefix = order.DocPrefix,
                docNo = order.DocNo,
                formattedDocNo = order.FormattedDocNo,
                supplier = order.Supplier,
                status = order.Status,
                poDate = PendingRefParser.GetDateFromBody(order.BodyJson, "poDate") ?? order.TranDate
            });
        }

        return new { items, total = items.Count };
    }

    public async Task<object> BuildPendingReceiptLinesAsync(string? supplier, IReadOnlyList<(string Prefix, int DocNo)> refs, CancellationToken ct)
    {
        var term = FulfillmentQty.NormalizeParty(supplier);
        if (string.IsNullOrEmpty(term))
            throw new NumberedDocException(400, "Supplier is required");
        if (refs.Count == 0)
            throw new NumberedDocException(400, "Select at least one purchase order");

        var prefixes = refs.Select(r => r.Prefix).Distinct().ToList();
        var docNos = refs.Select(r => r.DocNo).ToList();
        var orders = await db.PurchaseOrders.AsNoTracking()
            .Where(d => d.YearDatabaseName == YearDb && prefixes.Contains(d.DocPrefix) && docNos.Contains(d.DocNo))
            .ToListAsync(ct);
        var byKey = orders.ToDictionary(o => $"{o.DocPrefix.ToUpperInvariant()}|{o.DocNo}", StringComparer.OrdinalIgnoreCase);
        var index = await LoadPoReceivedQtyIndexAsync(null, ct);
        var lines = new List<Dictionary<string, object?>>();

        foreach (var (poPrefix, docNo) in refs)
        {
            if (!byKey.TryGetValue($"{poPrefix}|{docNo}", out var order))
                throw new NumberedDocException(404, $"Purchase order {poPrefix}-{docNo} not found");

            if (!FulfillmentQty.PartiesMatch(order.Supplier, term))
                throw new NumberedDocException(400, $"Purchase order {order.FormattedDocNo} does not belong to supplier {term}");

            if (!ReceivablePoStatuses.Contains(order.Status ?? "", StringComparer.OrdinalIgnoreCase))
                throw new NumberedDocException(400,
                    $"Purchase order {order.FormattedDocNo} is not available for receipt (status: {order.Status})");

            foreach (var line in FulfillmentQty.GetLinesFromBodyJson(order.BodyJson))
            {
                var sr = FulfillmentQty.CoerceInt(line.GetValueOrDefault("sr"));
                var pending = Math.Max(0,
                    FulfillmentQty.ParseQty(line.GetValueOrDefault("qty"))
                    - FulfillmentQty.SumQtyFromIndex(index, poPrefix, docNo, sr, "PO"));
                if (pending <= 0) continue;

                var rate = line.GetValueOrDefault("rate");
                lines.Add(new Dictionary<string, object?>
                {
                    ["poPrefix"] = poPrefix,
                    ["poDocNo"] = docNo,
                    ["poFormattedDocNo"] = order.FormattedDocNo,
                    ["poLineSr"] = sr,
                    ["productRetailCode"] = line.GetValueOrDefault("productRetailCode"),
                    ["itemDescription"] = line.GetValueOrDefault("itemDescription"),
                    ["qty"] = FulfillmentQty.FormatQty(pending),
                    ["rate"] = rate,
                    ["salesRate"] = line.GetValueOrDefault("salesRate") ?? rate,
                    ["discPercent"] = line.GetValueOrDefault("discPercent"),
                    ["discValue"] = line.GetValueOrDefault("discValue"),
                    ["taxType"] = line.GetValueOrDefault("taxType"),
                    ["taxPercent"] = line.GetValueOrDefault("taxPercent"),
                    ["amount"] = line.GetValueOrDefault("amount"),
                    ["poOrderedQty"] = FulfillmentQty.FormatQty(FulfillmentQty.ParseQty(line.GetValueOrDefault("qty"))),
                    ["poPendingQty"] = FulfillmentQty.FormatQty(pending)
                });
            }
        }

        if (lines.Count == 0)
            throw new NumberedDocException(400, "No pending lines found on selected purchase orders");

        return new { lines };
    }

    private static bool HasPending(PurchaseOrderDocument order, IReadOnlyDictionary<string, decimal> index)
    {
        foreach (var line in FulfillmentQty.GetLinesFromBodyJson(order.BodyJson))
        {
            var pending = Math.Max(0,
                FulfillmentQty.ParseQty(line.GetValueOrDefault("qty"))
                - FulfillmentQty.SumQtyFromIndex(index, order.DocPrefix, order.DocNo, line.GetValueOrDefault("sr"), "PO"));
            if (pending > 0) return true;
        }
        return false;
    }
}

public static class PendingRefParser
{
    public static List<(string Prefix, int DocNo)> ParseRefs(JsonElement arrayOrNull, string defaultPrefix, params string[] altPrefixFields)
    {
        var result = new List<(string, int)>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (arrayOrNull.ValueKind != JsonValueKind.Array) return result;

        foreach (var item in arrayOrNull.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Object) continue;
            string? prefix = null;
            if (item.TryGetProperty("docPrefix", out var p) && p.ValueKind == JsonValueKind.String)
                prefix = p.GetString();
            foreach (var alt in altPrefixFields)
            {
                if (!string.IsNullOrEmpty(prefix)) break;
                if (item.TryGetProperty(alt, out var ap) && ap.ValueKind == JsonValueKind.String)
                    prefix = ap.GetString();
            }

            var docNo = 0;
            if (item.TryGetProperty("docNo", out var n))
                docNo = FulfillmentQty.CoerceInt(n);

            var normalized = FulfillmentQty.NormalizePrefix(prefix, defaultPrefix);
            var key = $"{normalized}|{docNo}";
            if (!seen.Add(key)) continue;
            result.Add((normalized, docNo));
        }

        return result;
    }

    public static DateTime? GetDateFromBody(string bodyJson, string field)
    {
        try
        {
            using var doc = JsonDocument.Parse(bodyJson);
            if (doc.RootElement.TryGetProperty(field, out var el) && el.ValueKind == JsonValueKind.String
                && DateTime.TryParse(el.GetString(), out var dt))
                return DateTime.SpecifyKind(dt.ToUniversalTime(), DateTimeKind.Utc);
        }
        catch
        {
            // ignore
        }
        return null;
    }
}
