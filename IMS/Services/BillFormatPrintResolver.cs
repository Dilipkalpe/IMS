using IMS.Models;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.Services;

/// <summary>
/// Resolves bill format layouts from Bill Format Master (party assignment → default for document type).
/// </summary>
public static class BillFormatPrintResolver
{
    private static Dictionary<string, string>? _nameToCodeByType;
    private static string? _cachedAccountType;
    private static DateTime _accountMapLoadedUtc = DateTime.MinValue;
    private static readonly TimeSpan AccountMapTtl = TimeSpan.FromMinutes(3);

    public static void InvalidateAccountMap()
    {
        _nameToCodeByType = null;
        _cachedAccountType = null;
    }

    public static async Task<string?> ResolvePartyCodeAsync(SalesOrderDto? order, string accountType = "customer")
    {
        if (order is null)
            return null;

        if (!string.IsNullOrWhiteSpace(order.CustomerAccountCode))
            return order.CustomerAccountCode.Trim().ToUpperInvariant();

        var name = order.Customer?.Trim();
        if (string.IsNullOrWhiteSpace(name))
            return null;

        await EnsureAccountNameMapAsync(accountType).ConfigureAwait(false);
        if (_nameToCodeByType is null)
            return null;

        if (_nameToCodeByType.TryGetValue(name, out var exact))
            return exact;

        foreach (var kv in _nameToCodeByType)
        {
            if (string.Equals(kv.Key, name, StringComparison.OrdinalIgnoreCase))
                return kv.Value;
        }

        return null;
    }

    /// <summary>
    /// Layout from Bill Format Master for the document type and customer (not app Settings paper template).
    /// </summary>
    public static async Task<SalesBillLayoutDefinition?> ResolveLayoutForPrintAsync(
        string docTypeKey,
        SalesOrderDto? order,
        string accountType = "customer")
    {
        if (!ImsApiClient.IsAvailable)
            return null;

        try
        {
            await ImsApiClient.EnsureSalesBillTemplateDefaultsAsync().ConfigureAwait(false);
        }
        catch
        {
            /* continue with existing templates */
        }

        var partyCode = await ResolvePartyCodeAsync(order, accountType).ConfigureAwait(false);
        var template = await BillFormatTemplateService.ResolveTemplateAsync(docTypeKey, partyCode, accountType)
            .ConfigureAwait(false);
        return BillFormatTemplateService.ToPrintLayout(template);
    }

    private static async Task EnsureAccountNameMapAsync(string accountType)
    {
        var type = accountType.Trim().ToLowerInvariant();
        if (_nameToCodeByType is not null
            && string.Equals(_cachedAccountType, type, StringComparison.Ordinal)
            && DateTime.UtcNow - _accountMapLoadedUtc < AccountMapTtl)
            return;

        var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        try
        {
            var accounts = await ImsApiClient.GetAccountsAsync(type).ConfigureAwait(false);
            foreach (var a in accounts)
            {
                if (string.IsNullOrWhiteSpace(a.Code) || string.IsNullOrWhiteSpace(a.Name))
                    continue;
                map[a.Name.Trim()] = a.Code.Trim().ToUpperInvariant();
            }
        }
        catch
        {
            /* print still works with default format */
        }

        _nameToCodeByType = map;
        _cachedAccountType = type;
        _accountMapLoadedUtc = DateTime.UtcNow;
    }
}
