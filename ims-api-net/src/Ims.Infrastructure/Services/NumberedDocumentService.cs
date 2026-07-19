using System.Text.Json;
using Ims.Application.Documents;
using Ims.Domain.Common;
using Ims.Domain.Entities;
using Ims.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Ims.Infrastructure.Services;

public sealed class NumberedDocumentService<T> : INumberedDocumentService
    where T : NumberedDocumentBase, new()
{
    private readonly ImsDbContext _db;
    private readonly CounterService _counters;
    private readonly ProductStockService _stock;
    private readonly INumberedDocumentHooks _hooks;

    public NumberedDocumentService(
        ImsDbContext db,
        CounterService counters,
        ProductStockService stock,
        NumberedDocConfig config,
        INumberedDocumentHooks hooks)
    {
        _db = db;
        _counters = counters;
        _stock = stock;
        Config = config;
        _hooks = hooks;
    }

    public NumberedDocConfig Config { get; }

    private DbSet<T> Set => _db.Set<T>();
    private int LegacyInitial => Config.IsPurchaseSide
        ? DocPrefixHelper.ResolveInitialPurchaseDocNo(Config.DocTypeKey)
        : DocPrefixHelper.ResolveInitialSalesDocNo(Config.DocTypeKey);

    public async Task<object> ListAsync(string yearDb, IQueryCollection query, CancellationToken ct)
    {
        var (page, limit, skip) = QueryHelpers.ParsePagination(query);
        var q = Set.AsNoTracking().Where(d => d.YearDatabaseName == yearDb);

        if (query.TryGetValue("status", out var statusVal) && !string.IsNullOrWhiteSpace(statusVal))
        {
            var status = statusVal.ToString()!.Trim().ToLowerInvariant().Replace(' ', '_');
            q = q.Where(d => d.Status == status);
        }

        q = QueryHelpers.ApplySearch(q, query["search"], Config.IsPurchaseSide);
        q = QueryHelpers.ApplyColumnFilters(q, query, Config.IsPurchaseSide);
        q = QueryHelpers.ApplyListSort(q, Config.DocTypeKey, query["sort"], query["sortDir"], Config.IsPurchaseSide);

        var total = await q.CountAsync(ct);
        var items = await q.Skip(skip).Take(limit).ToListAsync(ct);
        return new { items = items.Select(DocumentJsonHelper.ToApiResponse), total, page, limit };
    }

    public async Task<object> StatsAsync(string yearDb, CancellationToken ct)
    {
        var baseQ = Set.Where(d => d.YearDatabaseName == yearDb);
        var total = await baseQ.CountAsync(ct);
        var open = await baseQ.CountAsync(d => d.Status == "open", ct);
        var draft = await baseQ.CountAsync(d => d.Status == "draft", ct);
        var dispatched = await baseQ.CountAsync(d => d.Status == "dispatched", ct);
        var posted = await baseQ.CountAsync(d => d.Status == "posted", ct);
        var closed = await baseQ.CountAsync(d => d.Status == "closed", ct);
        var cancelled = await baseQ.CountAsync(d => d.Status == "cancelled", ct);
        return new { total, open, draft, dispatched, posted, closed, cancelled, active = open + draft + dispatched };
    }

    public async Task<object> NextNoAsync(string yearDb, string? prefix, CancellationToken ct)
    {
        var (docPrefix, docNo) = await _counters.PeekNextNumberedDocAsync(
            yearDb, Config.CounterNamespace, prefix, Config.DefaultDocPrefix, LegacyInitial, Set, ct);

        var response = new Dictionary<string, object?>
        {
            ["docPrefix"] = docPrefix,
            ["docNo"] = docNo,
            ["formattedDocNo"] = DocPrefixHelper.FormatPrefixDocNo(docPrefix, docNo)
        };

        if (Config.IsPurchaseSide)
            response["poPrefix"] = docPrefix;
        else
            response["soPrefix"] = docPrefix;

        return response;
    }

    public async Task<object?> GetByNoAsync(string yearDb, int docNo, string? prefix, CancellationToken ct)
    {
        var docPrefix = DocPrefixHelper.NormalizeSoPrefix(prefix ?? Config.DefaultDocPrefix);
        var item = await Set.AsNoTracking()
            .FirstOrDefaultAsync(d => d.YearDatabaseName == yearDb && d.DocNo == docNo && d.DocPrefix == docPrefix, ct);
        return item is null ? null : DocumentJsonHelper.ToApiResponse(item);
    }

    public async Task<object?> GetByFormattedAsync(string yearDb, string formatted, CancellationToken ct)
    {
        var item = await Set.AsNoTracking()
            .FirstOrDefaultAsync(d => d.YearDatabaseName == yearDb && d.FormattedDocNo == formatted, ct);

        if (item is null)
        {
            var parsed = DocPrefixHelper.ParseFormattedDocNo(formatted, Config.DefaultDocPrefix);
            if (parsed.DocNo > 0)
            {
                item = await Set.AsNoTracking()
                    .FirstOrDefaultAsync(d => d.YearDatabaseName == yearDb && d.DocNo == parsed.DocNo && d.DocPrefix == parsed.DocPrefix, ct);
            }
        }

        return item is null ? null : DocumentJsonHelper.ToApiResponse(item);
    }

    public async Task<object?> GetByIdAsync(string yearDb, string id, CancellationToken ct)
    {
        var item = await Set.AsNoTracking()
            .FirstOrDefaultAsync(d => d.YearDatabaseName == yearDb && d.Id == id, ct);
        return item is null ? null : DocumentJsonHelper.ToApiResponse(item);
    }

    public async Task<object> CreateAsync(string yearDb, IReadOnlyDictionary<string, object?> body, CancellationToken ct)
    {
        var payload = DocumentJsonHelper.ToUpdatePayload(body);
        DocumentJsonHelper.NormalizeTotals(payload, Config.IsPurchaseSide);

        if (Config.NormalizeInvoicePayment)
            InvoicePaymentNormalizer.Normalize(payload);

        var docPrefix = DocPrefixHelper.NormalizeSoPrefix(payload.GetValueOrDefault("docPrefix")?.ToString() ?? Config.DefaultDocPrefix);
        var initial = DocPrefixHelper.InitialDocNoForDefaultPrefix(docPrefix, Config.DefaultDocPrefix, LegacyInitial);
        var counterKey = DocPrefixHelper.SalesDocCounterKey(Config.CounterNamespace, docPrefix, Config.DefaultDocPrefix);

        int docNo;
        if (!payload.ContainsKey("docNo") || payload["docNo"] is null)
        {
            docNo = await _counters.GetNextSequenceAsync(yearDb, counterKey, initial, ct);
        }
        else
        {
            docNo = DocumentJsonHelper.CoerceInt(payload["docNo"]);
            await _counters.EnsureCounterAtLeastAsync(yearDb, counterKey, docNo, initial, ct);
        }

        DocumentJsonHelper.ApplyNumbers(payload, docNo, docPrefix, Config.DefaultDocPrefix);
        await _hooks.BeforeCreateAsync(payload, ct);

        var createDirection = _hooks.ResolveStockDirection(payload) ?? Config.StockDirection;

        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            var entity = new T
            {
                Id = ObjectIdGenerator.NewId(),
                YearDatabaseName = yearDb,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            DocumentJsonHelper.SyncIndexedFields(entity, payload, Config.TranDateField);
            entity.BodyJson = DocumentJsonHelper.SerializeBody(payload);

            Set.Add(entity);
            try
            {
                await _db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex) when (IsDuplicate(ex))
            {
                throw new NumberedDocException(409, $"{Config.NotFoundLabel} number already exists for this prefix");
            }

            await _stock.ApplyDocumentStockAsync(yearDb, DocumentJsonHelper.GetLinesElement(payload), createDirection, ct);
            await _hooks.AfterCreateAsync(entity.Id, payload, ct);
            await tx.CommitAsync(ct);

            return DocumentJsonHelper.ToApiResponse(entity);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<object?> UpdateByNoAsync(string yearDb, int docNo, string? prefix, IReadOnlyDictionary<string, object?> body, CancellationToken ct)
    {
        var payload = DocumentJsonHelper.ToUpdatePayload(body);
        DocumentJsonHelper.NormalizeTotals(payload, Config.IsPurchaseSide);
        if (Config.NormalizeInvoicePayment) InvoicePaymentNormalizer.Normalize(payload);

        var lookupPrefix = DocPrefixHelper.NormalizeSoPrefix(prefix ?? payload.GetValueOrDefault("docPrefix")?.ToString() ?? Config.DefaultDocPrefix);

        if (payload.ContainsKey("docPrefix") || payload.ContainsKey("docNo"))
        {
            var nextPrefix = DocPrefixHelper.NormalizeSoPrefix(payload.GetValueOrDefault("docPrefix")?.ToString() ?? lookupPrefix);
            var nextDocNo = payload.ContainsKey("docNo") && payload["docNo"] is not null ? DocumentJsonHelper.CoerceInt(payload["docNo"]) : docNo;
            DocumentJsonHelper.ApplyNumbers(payload, nextDocNo, nextPrefix, Config.DefaultDocPrefix);
        }

        var existing = await Set.FirstOrDefaultAsync(
            d => d.YearDatabaseName == yearDb && d.DocNo == docNo && d.DocPrefix == lookupPrefix, ct);
        if (existing is null) return null;

        var existingBodyJson = existing.BodyJson;
        var existingPayload = JsonSerializer.Deserialize<Dictionary<string, object?>>(
            existingBodyJson, new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? new();

        await _hooks.BeforeUpdateAsync(existing.Id, existingPayload, payload, ct);

        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            MergePayload(existing, payload);
            try
            {
                await _db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex) when (IsDuplicate(ex))
            {
                throw new NumberedDocException(409, $"{Config.NotFoundLabel} number already exists for this prefix");
            }

            var updateDir = _hooks.ResolveStockDirection(DocumentJsonHelper.PayloadToDictionary(payload)) ?? Config.StockDirection;
            var priorDir = _hooks.ResolveStockDirection(existingPayload) ?? Config.StockDirection;
            await _stock.ReplaceDocumentStockAsync(
                yearDb,
                DocumentJsonHelper.GetLinesFromBodyJson(existingBodyJson),
                DocumentJsonHelper.GetLinesFromBodyJson(existing.BodyJson),
                updateDir, priorDir, ct);

            var updatedPayload = JsonSerializer.Deserialize<Dictionary<string, object?>>(existing.BodyJson,
                new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? new();
            await _hooks.AfterUpdateAsync(existing.Id, existingPayload, updatedPayload, ct);
            await tx.CommitAsync(ct);

            return DocumentJsonHelper.ToApiResponse(existing);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<object?> UpdateByIdAsync(string yearDb, string id, IReadOnlyDictionary<string, object?> body, CancellationToken ct)
    {
        var payload = DocumentJsonHelper.ToUpdatePayload(body);
        DocumentJsonHelper.NormalizeTotals(payload, Config.IsPurchaseSide);
        if (Config.NormalizeInvoicePayment) InvoicePaymentNormalizer.Normalize(payload);

        var existingBefore = await Set.FirstOrDefaultAsync(d => d.YearDatabaseName == yearDb && d.Id == id, ct);
        if (existingBefore is null) return null;

        var existingBodyJson = existingBefore.BodyJson;
        var existingPayload = JsonSerializer.Deserialize<Dictionary<string, object?>>(
            existingBodyJson, new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? new();

        await _hooks.BeforeUpdateAsync(existingBefore.Id, existingPayload, payload, ct);

        if (payload.ContainsKey("docPrefix") && payload.ContainsKey("docNo"))
            DocumentJsonHelper.ApplyNumbers(payload, DocumentJsonHelper.CoerceInt(payload["docNo"]), payload["docPrefix"]?.ToString(), Config.DefaultDocPrefix);
        else if (payload.ContainsKey("docPrefix"))
            DocumentJsonHelper.ApplyNumbers(payload, existingBefore.DocNo, payload["docPrefix"]?.ToString(), Config.DefaultDocPrefix);
        else if (payload.ContainsKey("docNo"))
            DocumentJsonHelper.ApplyNumbers(payload, DocumentJsonHelper.CoerceInt(payload["docNo"]), existingBefore.DocPrefix, Config.DefaultDocPrefix);

        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            MergePayload(existingBefore, payload);
            await _db.SaveChangesAsync(ct);

            var updateDir = _hooks.ResolveStockDirection(DocumentJsonHelper.PayloadToDictionary(payload)) ?? Config.StockDirection;
            var priorDir = _hooks.ResolveStockDirection(existingPayload) ?? Config.StockDirection;
            await _stock.ReplaceDocumentStockAsync(
                yearDb,
                DocumentJsonHelper.GetLinesFromBodyJson(existingBodyJson),
                DocumentJsonHelper.GetLinesFromBodyJson(existingBefore.BodyJson),
                updateDir, priorDir, ct);

            var updatedPayload = JsonSerializer.Deserialize<Dictionary<string, object?>>(existingBefore.BodyJson,
                new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? new();
            await _hooks.AfterUpdateAsync(existingBefore.Id, existingPayload, updatedPayload, ct);
            await tx.CommitAsync(ct);

            return DocumentJsonHelper.ToApiResponse(existingBefore);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<bool> DeleteByNoAsync(string yearDb, int docNo, string? prefix, CancellationToken ct)
    {
        var docPrefix = DocPrefixHelper.NormalizeSoPrefix(prefix ?? Config.DefaultDocPrefix);
        var item = await Set.FirstOrDefaultAsync(
            d => d.YearDatabaseName == yearDb && d.DocNo == docNo && d.DocPrefix == docPrefix, ct);
        if (item is null) return false;
        return await DeleteEntityAsync(yearDb, item, ct);
    }

    public async Task<bool> DeleteByIdAsync(string yearDb, string id, CancellationToken ct)
    {
        var item = await Set.FirstOrDefaultAsync(d => d.YearDatabaseName == yearDb && d.Id == id, ct);
        if (item is null) return false;
        return await DeleteEntityAsync(yearDb, item, ct);
    }

    private async Task<bool> DeleteEntityAsync(string yearDb, T item, CancellationToken ct)
    {
        var bodyJson = item.BodyJson;
        var payload = JsonSerializer.Deserialize<Dictionary<string, object?>>(
            bodyJson, new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? new();

        var deletedDir = _hooks.ResolveStockDirection(payload) ?? Config.StockDirection;
        var revert = deletedDir switch
        {
            StockDirection.In => StockDirection.Out,
            StockDirection.Out => StockDirection.In,
            _ => StockDirection.None
        };

        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            Set.Remove(item);
            await _db.SaveChangesAsync(ct);
            await _stock.ApplyDocumentStockAsync(yearDb, DocumentJsonHelper.GetLinesFromBodyJson(bodyJson), revert, ct);
            await _hooks.AfterDeleteAsync(payload, ct);
            await tx.CommitAsync(ct);
            return true;
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    private void MergePayload(T entity, Dictionary<string, object?> patch)
    {
        var current = JsonSerializer.Deserialize<Dictionary<string, object?>>(
            entity.BodyJson, new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? new();

        foreach (var (k, v) in patch)
            current[k] = v;

        DocumentJsonHelper.SyncIndexedFields(entity, current, Config.TranDateField);
        entity.BodyJson = DocumentJsonHelper.SerializeBody(current);
        entity.UpdatedAt = DateTime.UtcNow;
    }

    private static bool IsDuplicate(DbUpdateException ex) =>
        ex.InnerException is PostgresException pg && pg.SqlState == PostgresErrorCodes.UniqueViolation;
}

public sealed class NumberedDocException(int status, string message) : Exception(message)
{
    public int Status { get; } = status;
}
