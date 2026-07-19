using System.Collections.Concurrent;
using IMS.Models;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.Services;

public static class GridColumnPreferenceService
{
    private static readonly ConcurrentDictionary<string, IReadOnlyList<string>> Cache = new(StringComparer.Ordinal);

    public static event EventHandler<string>? PreferencesChanged;

    public static string CacheKey(string userId, string moduleKey) => $"{userId}:{moduleKey}";

    public static IReadOnlyList<string> GetCachedVisibleKeys(string moduleKey)
    {
        var userId = AuthSession.User?.Id ?? string.Empty;
        if (string.IsNullOrWhiteSpace(userId))
            return SalesGridColumnCatalog.GetDefaultVisibleKeys(moduleKey);

        return Cache.TryGetValue(CacheKey(userId, moduleKey), out var keys)
            ? keys
            : SalesGridColumnCatalog.GetDefaultVisibleKeys(moduleKey);
    }

    public static async Task<IReadOnlyList<string>> LoadVisibleKeysAsync(string moduleKey, bool forceRefresh = false)
    {
        var userId = AuthSession.User?.Id;
        if (string.IsNullOrWhiteSpace(userId) || !AuthSession.IsAuthenticated)
            return SalesGridColumnCatalog.GetDefaultVisibleKeys(moduleKey);

        var cacheKey = CacheKey(userId, moduleKey);
        if (!forceRefresh && Cache.TryGetValue(cacheKey, out var cached))
            return cached;

        if (!await ImsApiClient.CheckHealthAsync())
            return SalesGridColumnCatalog.GetDefaultVisibleKeys(moduleKey);

        try
        {
            var prefs = await ImsApiClient.GetGridColumnPreferencesAsync(moduleKey);
            var keys = prefs?.VisibleColumnKeys is { Count: > 0 }
                ? SalesGridColumnCatalog.NormalizeVisibleKeys(prefs.VisibleColumnKeys, moduleKey)
                : SalesGridColumnCatalog.GetDefaultVisibleKeys(moduleKey);
            Cache[cacheKey] = keys;
            return keys;
        }
        catch
        {
            return SalesGridColumnCatalog.GetDefaultVisibleKeys(moduleKey);
        }
    }

    public static async Task<GridColumnPreferencesDto?> SaveVisibleKeysAsync(
        string moduleKey,
        IEnumerable<string> visibleKeys)
    {
        var normalized = SalesGridColumnCatalog.NormalizeVisibleKeys(visibleKeys, moduleKey);
        var prefs = await ImsApiClient.SaveGridColumnPreferencesAsync(moduleKey, normalized);
        UpdateCache(moduleKey, prefs?.VisibleColumnKeys ?? normalized);
        return prefs;
    }

    public static async Task<GridColumnPreferencesDto?> ResetToDefaultAsync(string moduleKey)
    {
        var prefs = await ImsApiClient.ResetGridColumnPreferencesAsync(moduleKey);
        var keys = prefs?.VisibleColumnKeys is { Count: > 0 }
            ? SalesGridColumnCatalog.NormalizeVisibleKeys(prefs.VisibleColumnKeys, moduleKey)
            : SalesGridColumnCatalog.GetDefaultVisibleKeys(moduleKey);
        UpdateCache(moduleKey, keys);
        return prefs;
    }

    public static async Task PreloadAllModulesAsync()
    {
        if (!AuthSession.IsAuthenticated)
            return;

        foreach (var moduleKey in SalesGridColumnCatalog.AllModuleKeys)
            await LoadVisibleKeysAsync(moduleKey, forceRefresh: true);
    }

    public static Task PreloadSalesModulesAsync() => PreloadAllModulesAsync();

    public static void ClearCache()
    {
        Cache.Clear();
        PreferencesChanged?.Invoke(null, string.Empty);
    }

    public static void NotifyPreferencesChanged(string moduleKey) =>
        PreferencesChanged?.Invoke(null, moduleKey);

    private static void UpdateCache(string moduleKey, IEnumerable<string> keys)
    {
        var userId = AuthSession.User?.Id;
        if (string.IsNullOrWhiteSpace(userId))
            return;

        var normalized = SalesGridColumnCatalog.NormalizeVisibleKeys(keys, moduleKey);
        Cache[CacheKey(userId, moduleKey)] = normalized;
        NotifyPreferencesChanged(moduleKey);
    }
}
