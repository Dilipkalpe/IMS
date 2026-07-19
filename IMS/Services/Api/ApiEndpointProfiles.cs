using IMS.Models;

namespace IMS.Services.Api;

public static class ApiEndpointProfiles
{
    public const string OnlineId = "online";
    public const string LocalId = "local";
    public const string IisId = "iis";
    public const string CustomId = "custom";

    /// <summary>Production API (Contabo / Coolify). Base URL only — no /api suffix.</summary>
    public const string OnlineApiBaseUrl = "http://144.91.98.218:8081";

    public const string IisApiApplicationName = "IMSWebAPI";
    public const string IisWebApplicationName = "IMSWebApp";

    public static IReadOnlyList<ApiEndpointProfileOption> All { get; } =
    [
        new(OnlineId, "Online API (production)", "IMS API on the hosted server (same as ims-web VITE_API_BASE_URL)."),
        new(LocalId, "Local API (development)", "Node.js API on this PC at port 3000."),
        new(IisId, "IIS — IMSWebAPI", "Deployed Node.js API via IIS site/application IMSWebAPI."),
        new(CustomId, "Custom URL", "Enter any API base URL manually.")
    ];

    public static string ResolveApiBaseUrl(AppSettings settings)
    {
        var profile = NormalizeProfileId(settings.ApiEndpointProfile);
        return profile switch
        {
            OnlineId => OnlineApiBaseUrl,
            LocalId => "http://127.0.0.1:3000",
            IisId => BuildIisApiUrl(settings.IisServerHost),
            _ => NormalizeApiUrl(settings.ApiBaseUrl)
        };
    }

    public static string ResolveWebAppUrl(AppSettings settings)
    {
        if (!string.IsNullOrWhiteSpace(settings.WebAppBaseUrl))
            return NormalizeWebAppUrl(settings.WebAppBaseUrl);

        var profile = NormalizeProfileId(settings.ApiEndpointProfile);
        if (profile == OnlineId)
            return OnlineApiBaseUrl;
        if (profile == IisId)
            return BuildIisWebAppUrl(settings.IisServerHost);

        return string.Empty;
    }

    public static string NormalizeProfileId(string? profileId)
    {
        var value = (profileId ?? string.Empty).Trim().ToLowerInvariant();
        return value switch
        {
            LocalId => LocalId,
            IisId => IisId,
            CustomId => CustomId,
            OnlineId => OnlineId,
            _ => OnlineId
        };
    }

    public static string NormalizeApiUrl(string? url)
    {
        var value = (url ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(value))
            return "http://127.0.0.1:3000";

        value = value.TrimEnd('/');
        if (value.EndsWith("/api", StringComparison.OrdinalIgnoreCase))
            value = value[..^4];

        // Local IIS is HTTP-only by default; https://localhost often fails with no SSL cert.
        if (Uri.TryCreate(value, UriKind.Absolute, out var uri)
            && uri.Scheme.Equals("https", StringComparison.OrdinalIgnoreCase)
            && (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                || uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase)))
        {
            value = $"http://{uri.Host}{uri.PathAndQuery}".TrimEnd('/');
        }

        if (value.Contains("localhost", StringComparison.OrdinalIgnoreCase))
            value = value.Replace("localhost", "127.0.0.1", StringComparison.OrdinalIgnoreCase);

        return value;
    }

    private static string BuildIisApiUrl(string? serverHost)
    {
        var host = NormalizeServerHost(serverHost);
        return $"http://{host}/{IisApiApplicationName}";
    }

    private static string BuildIisWebAppUrl(string? serverHost)
    {
        var host = NormalizeServerHost(serverHost);
        return $"http://{host}/{IisWebApplicationName}";
    }

    private static string NormalizeWebAppUrl(string url) =>
        url.Trim().TrimEnd('/');

    private static string NormalizeServerHost(string? serverHost)
    {
        var host = (serverHost ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(host))
            host = "localhost";
        return host.TrimEnd('/');
    }
}

public sealed record ApiEndpointProfileOption(string Id, string DisplayName, string Description);
