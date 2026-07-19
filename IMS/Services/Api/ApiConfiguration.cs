using IMS.Models;
using IMS.Services;

namespace IMS.Services.Api;

public static class ApiConfiguration
{
    public static string BaseUrl { get; private set; } = ApiEndpointProfiles.OnlineApiBaseUrl;

    public static string WebAppUrl { get; private set; } = string.Empty;

    public static string EndpointProfileId { get; private set; } = ApiEndpointProfiles.OnlineId;

    public static void LoadFromSettings()
    {
        var settings = SettingsStore.Load();
        EndpointProfileId = ApiEndpointProfiles.NormalizeProfileId(settings.ApiEndpointProfile);
        BaseUrl = ApiEndpointProfiles.ResolveApiBaseUrl(settings);
        WebAppUrl = ApiEndpointProfiles.ResolveWebAppUrl(settings);
    }

    public static void SaveConnection(AppSettings settings)
    {
        settings.ApiEndpointProfile = ApiEndpointProfiles.NormalizeProfileId(settings.ApiEndpointProfile);
        settings.IisServerHost = string.IsNullOrWhiteSpace(settings.IisServerHost)
            ? "localhost"
            : settings.IisServerHost.Trim();

        if (settings.ApiEndpointProfile == ApiEndpointProfiles.CustomId)
            settings.ApiBaseUrl = ApiEndpointProfiles.NormalizeApiUrl(settings.ApiBaseUrl);

        settings.WebAppBaseUrl = string.IsNullOrWhiteSpace(settings.WebAppBaseUrl)
            ? string.Empty
            : settings.WebAppBaseUrl.Trim().TrimEnd('/');

        SettingsStore.Save(settings);
        LoadFromSettings();
    }
}
