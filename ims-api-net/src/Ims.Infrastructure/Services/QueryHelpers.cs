using System.Text.RegularExpressions;
using Ims.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Ims.Infrastructure.Services;

public static class QueryHelpers
{
    public static (int Page, int Limit, int Skip) ParsePagination(IQueryCollection query, int defaultLimit = 100, int maxLimit = 10000)
    {
        var page = Math.Max(int.TryParse(query["page"], out var p) ? p : 1, 1);
        var limit = Math.Min(Math.Max(int.TryParse(query["limit"], out var l) ? l : defaultLimit, 1), maxLimit);
        return (page, limit, (page - 1) * limit);
    }

    public static IQueryable<T> ApplyColumnFilters<T>(IQueryable<T> query, IQueryCollection q, bool isPurchase)
        where T : NumberedDocumentBase
    {
        var col1 = Term(q["col1"]);
        var col2 = Term(q["col2"]);
        var col3 = Term(q["col3"]);
        var col4 = Term(q["col4"]);
        var col5 = Term(q["col5"]);
        var status = Term(q["status"]);

        if (col1 is not null)
        {
            if (int.TryParse(col1, out var num))
                query = query.Where(d => d.DocNo == num || EF.Functions.ILike(d.FormattedDocNo, $"%{col1}%") || EF.Functions.ILike(d.DocPrefix, $"%{col1}%"));
            else
                query = query.Where(d => EF.Functions.ILike(d.FormattedDocNo, $"%{col1}%") || EF.Functions.ILike(d.DocPrefix, $"%{col1}%"));
        }

        if (col2 is not null)
        {
            query = isPurchase
                ? query.Where(d => EF.Functions.ILike(d.Supplier ?? "", $"%{col2}%") || EF.Functions.ILike(d.Customer ?? "", $"%{col2}%"))
                : query.Where(d => EF.Functions.ILike(d.Customer ?? "", $"%{col2}%"));
        }

        if (col4 is not null)
            query = query.Where(d => EF.Functions.ILike(d.Status ?? "", $"%{col4}%"));

        if (col5 is not null)
            query = query.Where(d => EF.Functions.ILike(d.Narration ?? "", $"%{col5}%") || EF.Functions.ILike(d.SalesMan ?? "", $"%{col5}%"));

        if (status is not null)
            query = query.Where(d => EF.Functions.ILike(d.Status ?? "", $"%{status}%"));

        // col3 totals search — match in body_json (simplified: skip deep json filter; global search covers amounts via formatted doc)
        return query;
    }

    public static IQueryable<T> ApplySearch<T>(IQueryable<T> query, string? search, bool isPurchase)
        where T : NumberedDocumentBase
    {
        if (string.IsNullOrWhiteSpace(search)) return query;
        var term = search.Trim();
        if (int.TryParse(term, out var num))
        {
            return query.Where(d =>
                d.DocNo == num ||
                EF.Functions.ILike(d.Customer ?? "", $"%{term}%") ||
                EF.Functions.ILike(d.Supplier ?? "", $"%{term}%") ||
                EF.Functions.ILike(d.SalesMan ?? "", $"%{term}%") ||
                EF.Functions.ILike(d.Narration ?? "", $"%{term}%") ||
                EF.Functions.ILike(d.FormattedDocNo, $"%{term}%") ||
                EF.Functions.ILike(d.DocPrefix, $"%{term}%"));
        }

        return query.Where(d =>
            EF.Functions.ILike(d.Customer ?? "", $"%{term}%") ||
            EF.Functions.ILike(d.Supplier ?? "", $"%{term}%") ||
            EF.Functions.ILike(d.SalesMan ?? "", $"%{term}%") ||
            EF.Functions.ILike(d.Narration ?? "", $"%{term}%") ||
            EF.Functions.ILike(d.FormattedDocNo, $"%{term}%") ||
            EF.Functions.ILike(d.DocPrefix, $"%{term}%"));
    }

    public static IQueryable<T> ApplyListSort<T>(IQueryable<T> query, string docTypeKey, string? sort, string? sortDir, bool isPurchase)
        where T : NumberedDocumentBase
    {
        if (string.IsNullOrWhiteSpace(sort))
        {
            return isPurchase
                ? query.OrderByDescending(d => d.DocNo)
                : ApplyDefaultSalesSort(query, docTypeKey);
        }

        var dir = string.Equals(sortDir, "asc", StringComparison.OrdinalIgnoreCase);
        var key = sort.Trim().ToLowerInvariant();

        return key switch
        {
            "col1" or "docno" => dir ? query.OrderBy(d => d.DocNo) : query.OrderByDescending(d => d.DocNo),
            "col2" => isPurchase
                ? (dir ? query.OrderBy(d => d.Supplier) : query.OrderByDescending(d => d.Supplier))
                : (dir ? query.OrderBy(d => d.Customer) : query.OrderByDescending(d => d.Customer)),
            "col4" or "status" => dir ? query.OrderBy(d => d.Status) : query.OrderByDescending(d => d.Status),
            "invoicedate" or "dcdate" or "returndate" or "grndate" or "trandate" =>
                dir ? query.OrderBy(d => d.TranDate).ThenBy(d => d.DocNo)
                    : query.OrderByDescending(d => d.TranDate).ThenByDescending(d => d.DocNo),
            _ => ApplyDefaultSalesSort(query, docTypeKey)
        };
    }

    private static IQueryable<T> ApplyDefaultSalesSort<T>(IQueryable<T> query, string docTypeKey)
        where T : NumberedDocumentBase =>
        query.OrderByDescending(d => d.TranDate).ThenByDescending(d => d.DocNo);

    private static string? Term(string? value)
    {
        var t = (value ?? "").Trim();
        return t.Length > 0 ? t : null;
    }
}
