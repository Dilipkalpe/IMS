using Ims.Application.Abstractions;
using Ims.Domain.Entities;
using Ims.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace Ims.Infrastructure.Services.Fulfillment;

public sealed class DeliveryChallanInvoicingService(ImsDbContext db, IFinancialYearContext fy)
{
    public static readonly string[] InvoiceableDcStatuses =
        ["open", "confirmed", "dispatched", "posted", "shipped", "partially_invoiced"];

    private static readonly HashSet<string> OperationalWhenNotInvoiced =
        new(StringComparer.OrdinalIgnoreCase) { "confirmed", "dispatched", "posted", "shipped" };

    private string YearDb => fy.YearDatabaseName
        ?? throw new InvalidOperationException("Financial year context is required.");

    public async Task<Dictionary<string, decimal>> LoadDcInvoicedQtyIndexAsync(string? excludeInvId, CancellationToken ct)
    {
        var query = db.SalesInvoices.AsNoTracking()
            .Where(d => d.YearDatabaseName == YearDb
                        && d.Status != "cancelled"
                        && d.Status != "draft");

        if (!string.IsNullOrEmpty(excludeInvId))
            query = query.Where(d => d.Id != excludeInvId);

        var docs = await query.Select(d => d.BodyJson).ToListAsync(ct);
        var allLines = docs.Select(FulfillmentQty.GetLinesFromBodyJson).ToList();
        // Only docs that have dcDocNo on some line — filter during index build (null skips)
        return FulfillmentQty.BuildLineQtyIndex(allLines, "dcPrefix", "dcDocNo", "dcLineSr", "DC");
    }

    public static string DeriveDeliveryChallanInvoiceStatus(
        IEnumerable<Dictionary<string, object?>> lines,
        string? priorStatus = "open")
    {
        var list = lines.ToList();
        if (list.Count == 0) return "open";

        var anyInvoiced = false;
        var anyPending = false;
        foreach (var line in list)
        {
            var delivered = FulfillmentQty.ParseQty(line.GetValueOrDefault("qty"));
            var invoiced = FulfillmentQty.ParseQty(line.GetValueOrDefault("invoicedQty") ?? 0);
            if (invoiced > 0) anyInvoiced = true;
            if (invoiced < delivered) anyPending = true;
        }

        if (anyInvoiced && anyPending) return "partially_invoiced";
        if (anyInvoiced && !anyPending) return "fully_invoiced";

        var prior = (priorStatus ?? "open").ToLowerInvariant();
        if (OperationalWhenNotInvoiced.Contains(prior)) return prior;
        return "open";
    }

    public async Task SyncDeliveryChallanFromInvoicesAsync(string dcPrefix, int docNo, CancellationToken ct)
    {
        var prefix = FulfillmentQty.NormalizePrefix(dcPrefix, "DC");
        var challan = await db.DeliveryChallans
            .FirstOrDefaultAsync(d => d.YearDatabaseName == YearDb && d.DocPrefix == prefix && d.DocNo == docNo, ct);
        if (challan is null) return;

        var index = await LoadDcInvoicedQtyIndexAsync(null, ct);
        var body = FulfillmentQty.GetBodyDict(challan.BodyJson);
        var lines = FulfillmentQty.ExtractLines(body.GetValueOrDefault("lines"));

        foreach (var line in lines)
        {
            var invoiced = FulfillmentQty.SumQtyFromIndex(index, prefix, docNo, line.GetValueOrDefault("sr"), "DC");
            line["invoicedQty"] = FulfillmentQty.FormatQty(invoiced);
        }

        var nextStatus = DeriveDeliveryChallanInvoiceStatus(
            lines.Select(l => new Dictionary<string, object?>
            {
                ["qty"] = l.GetValueOrDefault("qty"),
                ["invoicedQty"] = l.GetValueOrDefault("invoicedQty")
            }),
            challan.Status);

        if (!string.Equals(challan.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
            body["status"] = nextStatus;

        body["lines"] = lines;
        FulfillmentQty.WriteBody(challan, body);
        await db.SaveChangesAsync(ct);
    }

    public static List<object> CollectDcReferencesFromLines(IEnumerable<Dictionary<string, object?>> lines)
    {
        var map = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
        foreach (var line in lines)
        {
            if (line.GetValueOrDefault("dcFormattedDocNo") is null && line.GetValueOrDefault("dcDocNo") is null)
                continue;
            var prefix = FulfillmentQty.NormalizePrefix(line.GetValueOrDefault("dcPrefix")?.ToString(), "DC");
            var docNo = FulfillmentQty.CoerceInt(line.GetValueOrDefault("dcDocNo"));
            var key = $"{prefix}-{docNo}";
            if (map.ContainsKey(key)) continue;
            map[key] = new Dictionary<string, object?>
            {
                ["docPrefix"] = prefix,
                ["docNo"] = docNo,
                ["formattedDocNo"] = line.GetValueOrDefault("dcFormattedDocNo")?.ToString() ?? $"{prefix}-{docNo}"
            };
        }
        return map.Values.ToList();
    }

    public static string BuildDcReferenceText(IEnumerable<object> refs) =>
        string.Join(", ", refs
            .Select(r => r is Dictionary<string, object?> d ? d.GetValueOrDefault("formattedDocNo")?.ToString() : null)
            .Where(s => !string.IsNullOrEmpty(s)));

    public async Task ValidateSalesInvoiceLinesAsync(Dictionary<string, object?> payload, string? excludeInvId, CancellationToken ct)
    {
        var customer = FulfillmentQty.NormalizeParty(payload.GetValueOrDefault("customer"));
        if (string.IsNullOrEmpty(customer))
            throw new NumberedDocException(400, "Customer is required on sales invoice");

        var lines = FulfillmentQty.EnsureMutableLines(payload);
        var dcKeysTouched = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var invoicedIndex = await LoadDcInvoicedQtyIndexAsync(excludeInvId, ct);
        var challanCache = new Dictionary<string, DeliveryChallanDocument?>(StringComparer.OrdinalIgnoreCase);

        for (var i = 0; i < lines.Count; i++)
        {
            var line = lines[i];
            if (line.GetValueOrDefault("dcDocNo") is null || line.GetValueOrDefault("dcLineSr") is null)
                continue;

            var dcPrefix = FulfillmentQty.NormalizePrefix(line.GetValueOrDefault("dcPrefix")?.ToString(), "DC");
            var dcDocNo = FulfillmentQty.CoerceInt(line.GetValueOrDefault("dcDocNo"));
            var dcLineSr = FulfillmentQty.CoerceInt(line.GetValueOrDefault("dcLineSr"));
            var challanKey = $"{dcPrefix}|{dcDocNo}";

            if (!challanCache.TryGetValue(challanKey, out var challan))
            {
                challan = await db.DeliveryChallans.AsNoTracking()
                    .FirstOrDefaultAsync(d => d.YearDatabaseName == YearDb && d.DocPrefix == dcPrefix && d.DocNo == dcDocNo, ct);
                challanCache[challanKey] = challan;
            }

            if (challan is null)
            {
                var label = line.GetValueOrDefault("dcFormattedDocNo")?.ToString() ?? $"{dcPrefix}-{dcDocNo}";
                throw new NumberedDocException(400, $"Delivery challan {label} not found (line {i + 1})");
            }

            if (!FulfillmentQty.PartiesMatch(challan.Customer, customer))
                throw new NumberedDocException(400,
                    $"Line {i + 1}: delivery challan {challan.FormattedDocNo} belongs to a different customer ({challan.Customer})");

            if (!InvoiceableDcStatuses.Contains(challan.Status ?? "", StringComparer.OrdinalIgnoreCase))
                throw new NumberedDocException(400,
                    $"Delivery challan {challan.FormattedDocNo} cannot be invoiced (status: {challan.Status}).");

            var dcLines = FulfillmentQty.GetLinesFromBodyJson(challan.BodyJson);
            var dcLine = dcLines.FirstOrDefault(l => FulfillmentQty.CoerceInt(l.GetValueOrDefault("sr")) == dcLineSr);
            if (dcLine is null)
                throw new NumberedDocException(400,
                    $"DC line {dcLineSr} not found on {challan.FormattedDocNo} (invoice line {i + 1})");

            var invoiceQty = FulfillmentQty.ParseQty(line.GetValueOrDefault("qty"));
            if (invoiceQty <= 0)
                throw new NumberedDocException(400, $"Invoice quantity must be greater than zero (line {i + 1})");

            var pending = Math.Max(0,
                FulfillmentQty.ParseQty(dcLine.GetValueOrDefault("qty"))
                - FulfillmentQty.SumQtyFromIndex(invoicedIndex, dcPrefix, dcDocNo, dcLineSr, "DC"));

            if (invoiceQty > pending + 0.0001m)
                throw new NumberedDocException(400,
                    $"Line {i + 1}: invoice qty {FulfillmentQty.FormatQty(invoiceQty)} exceeds pending {FulfillmentQty.FormatQty(pending)} on {challan.FormattedDocNo} (line {dcLineSr})");

            line["dcPrefix"] = dcPrefix;
            line["dcDocNo"] = dcDocNo;
            line["dcFormattedDocNo"] = line.GetValueOrDefault("dcFormattedDocNo")?.ToString() ?? challan.FormattedDocNo;
            line["dcLineSr"] = dcLineSr;
            line["dcDeliveredQty"] = FulfillmentQty.FormatQty(FulfillmentQty.ParseQty(dcLine.GetValueOrDefault("qty")));
            line["dcPendingQty"] = FulfillmentQty.FormatQty(pending);

            dcKeysTouched.Add(challanKey);
        }

        var refs = CollectDcReferencesFromLines(lines);
        payload["dcReferences"] = refs;
        payload["dcReference"] = BuildDcReferenceText(refs);
    }

    public async Task ApplySalesInvoiceFulfillmentAsync(IReadOnlyDictionary<string, object?> inv, CancellationToken ct)
    {
        var lines = FulfillmentQty.ExtractLines(inv.GetValueOrDefault("lines"));
        foreach (var refObj in CollectDcReferencesFromLines(lines))
        {
            if (refObj is not Dictionary<string, object?> r) continue;
            await SyncDeliveryChallanFromInvoicesAsync(
                r.GetValueOrDefault("docPrefix")?.ToString() ?? "DC",
                FulfillmentQty.CoerceInt(r.GetValueOrDefault("docNo")),
                ct);
        }
    }

    public async Task RefreshInvoicingForDeliveryChallansAsync(IEnumerable<string> dcKeys, CancellationToken ct)
    {
        foreach (var key in dcKeys.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            var parts = key.Split('|');
            if (parts.Length < 2) continue;
            await SyncDeliveryChallanFromInvoicesAsync(parts[0], int.Parse(parts[1]), ct);
        }
    }

    public static IEnumerable<string> CollectDcKeysFromLines(IEnumerable<Dictionary<string, object?>> lines)
    {
        foreach (var line in lines)
        {
            if (line.GetValueOrDefault("dcDocNo") is null) continue;
            var prefix = FulfillmentQty.NormalizePrefix(line.GetValueOrDefault("dcPrefix")?.ToString(), "DC");
            var docNo = FulfillmentQty.CoerceInt(line.GetValueOrDefault("dcDocNo"));
            yield return $"{prefix}|{docNo}";
        }
    }

    public async Task<object> ListPendingForInvoiceAsync(string? customer, CancellationToken ct)
    {
        var term = FulfillmentQty.NormalizeParty(customer);
        if (string.IsNullOrEmpty(term))
            throw new NumberedDocException(400, "customer query parameter is required");

        var statusSet = InvoiceableDcStatuses.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var challans = await db.DeliveryChallans.AsNoTracking()
            .Where(d => d.YearDatabaseName == YearDb && d.Customer != null && statusSet.Contains(d.Status!))
            .OrderByDescending(d => d.TranDate)
            .ThenByDescending(d => d.DocNo)
            .ToListAsync(ct);

        challans = challans
            .Where(d => FulfillmentQty.PartiesMatch(d.Customer, term))
            .ToList();

        var index = await LoadDcInvoicedQtyIndexAsync(null, ct);
        var items = new List<object>();
        foreach (var dc in challans)
        {
            if (!HasPendingInvoiceLines(dc, index)) continue;
            items.Add(new
            {
                docPrefix = dc.DocPrefix,
                docNo = dc.DocNo,
                formattedDocNo = dc.FormattedDocNo,
                customer = dc.Customer,
                status = dc.Status,
                dcDate = PendingRefParser.GetDateFromBody(dc.BodyJson, "dcDate") ?? dc.TranDate
            });
        }

        return new { items, total = items.Count };
    }

    public async Task<object> BuildPendingInvoiceLinesAsync(string? customer, IReadOnlyList<(string Prefix, int DocNo)> refs, CancellationToken ct)
    {
        var term = FulfillmentQty.NormalizeParty(customer);
        if (string.IsNullOrEmpty(term))
            throw new NumberedDocException(400, "Customer is required");
        if (refs.Count == 0)
            throw new NumberedDocException(400, "Select at least one delivery challan");

        var prefixes = refs.Select(r => r.Prefix).Distinct().ToList();
        var docNos = refs.Select(r => r.DocNo).ToList();

        var challans = await db.DeliveryChallans.AsNoTracking()
            .Where(d => d.YearDatabaseName == YearDb && prefixes.Contains(d.DocPrefix) && docNos.Contains(d.DocNo))
            .ToListAsync(ct);

        var byKey = challans.ToDictionary(c => $"{c.DocPrefix.ToUpperInvariant()}|{c.DocNo}", StringComparer.OrdinalIgnoreCase);
        var index = await LoadDcInvoicedQtyIndexAsync(null, ct);
        var lines = new List<Dictionary<string, object?>>();

        foreach (var (dcPrefix, docNo) in refs)
        {
            if (!byKey.TryGetValue($"{dcPrefix}|{docNo}", out var challan))
                throw new NumberedDocException(404, $"Delivery challan {dcPrefix}-{docNo} not found");

            if (!FulfillmentQty.PartiesMatch(challan.Customer, term))
                throw new NumberedDocException(400,
                    $"Delivery challan {challan.FormattedDocNo} does not belong to customer {term}");

            if (!InvoiceableDcStatuses.Contains(challan.Status ?? "", StringComparer.OrdinalIgnoreCase))
                throw new NumberedDocException(400,
                    $"Delivery challan {challan.FormattedDocNo} is not available for invoicing (status: {challan.Status})");

            foreach (var line in FulfillmentQty.GetLinesFromBodyJson(challan.BodyJson))
            {
                var sr = FulfillmentQty.CoerceInt(line.GetValueOrDefault("sr"));
                var pending = Math.Max(0,
                    FulfillmentQty.ParseQty(line.GetValueOrDefault("qty"))
                    - FulfillmentQty.SumQtyFromIndex(index, dcPrefix, docNo, sr, "DC"));
                if (pending <= 0) continue;

                var rate = line.GetValueOrDefault("rate");
                lines.Add(new Dictionary<string, object?>
                {
                    ["dcPrefix"] = dcPrefix,
                    ["dcDocNo"] = docNo,
                    ["dcFormattedDocNo"] = challan.FormattedDocNo,
                    ["dcLineSr"] = sr,
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
                    ["dcDeliveredQty"] = FulfillmentQty.FormatQty(FulfillmentQty.ParseQty(line.GetValueOrDefault("qty"))),
                    ["dcPendingQty"] = FulfillmentQty.FormatQty(pending)
                });
            }
        }

        if (lines.Count == 0)
            throw new NumberedDocException(400, "No pending lines found on selected delivery challans");

        return new { lines };
    }

    private static bool HasPendingInvoiceLines(DeliveryChallanDocument challan, IReadOnlyDictionary<string, decimal> index)
    {
        foreach (var line in FulfillmentQty.GetLinesFromBodyJson(challan.BodyJson))
        {
            var pending = Math.Max(0,
                FulfillmentQty.ParseQty(line.GetValueOrDefault("qty"))
                - FulfillmentQty.SumQtyFromIndex(index, challan.DocPrefix, challan.DocNo, line.GetValueOrDefault("sr"), "DC"));
            if (pending > 0) return true;
        }
        return false;
    }

}
