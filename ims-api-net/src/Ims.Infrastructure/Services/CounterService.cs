using System.Globalization;
using System.Text.Json;
using Ims.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Ims.Infrastructure.Services;

public sealed class CounterService(ImsDbContext db)
{
    public async Task<int> GetNextSequenceAsync(string yearDb, string key, int initial, CancellationToken ct = default)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var counter = await db.Counters
            .FirstOrDefaultAsync(c => c.YearDatabaseName == yearDb && c.Key == key, ct);

        if (counter is null)
        {
            counter = new Domain.Entities.Counter
            {
                YearDatabaseName = yearDb,
                Key = key,
                Value = initial
            };
            db.Counters.Add(counter);
        }
        else
        {
            counter.Value += 1;
        }

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return counter.Value;
    }

    public async Task<int> PeekNextSequenceAsync(string yearDb, string key, int initial, CancellationToken ct = default)
    {
        var counter = await db.Counters.AsNoTracking()
            .FirstOrDefaultAsync(c => c.YearDatabaseName == yearDb && c.Key == key, ct);
        return counter is null ? initial : counter.Value + 1;
    }

    public async Task EnsureCounterAtLeastAsync(string yearDb, string key, int docNo, int initial, CancellationToken ct = default)
    {
        var value = Math.Max(docNo, initial);
        var counter = await db.Counters
            .FirstOrDefaultAsync(c => c.YearDatabaseName == yearDb && c.Key == key, ct);

        if (counter is null)
        {
            db.Counters.Add(new Domain.Entities.Counter
            {
                YearDatabaseName = yearDb,
                Key = key,
                Value = value
            });
        }
        else if (counter.Value < value)
        {
            counter.Value = value;
        }

        await db.SaveChangesAsync(ct);
    }

    public async Task<(string DocPrefix, int DocNo)> PeekNextNumberedDocAsync<T>(
        string yearDb,
        string counterNamespace,
        string? prefix,
        string defaultDocPrefix,
        int legacyInitial,
        IQueryable<T> documents,
        CancellationToken ct)
        where T : Domain.Entities.NumberedDocumentBase
    {
        var docPrefix = DocPrefixHelper.NormalizeSoPrefix(prefix ?? defaultDocPrefix);
        var initial = DocPrefixHelper.InitialDocNoForDefaultPrefix(docPrefix, defaultDocPrefix, legacyInitial);
        var key = DocPrefixHelper.SalesDocCounterKey(counterNamespace, docPrefix, defaultDocPrefix);
        var fromCounter = await PeekNextSequenceAsync(yearDb, key, initial, ct);

        var latest = await documents
            .Where(d => d.YearDatabaseName == yearDb && d.DocPrefix == docPrefix)
            .OrderByDescending(d => d.DocNo)
            .Select(d => d.DocNo)
            .FirstOrDefaultAsync(ct);

        var fromDocs = latest > 0 ? latest + 1 : initial;
        return (docPrefix, Math.Max(fromCounter, fromDocs));
    }
}
