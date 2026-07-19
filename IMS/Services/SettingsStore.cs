using System.IO;
using System.Text.Json;
using IMS.Models;
using IMS.Services.Api;

namespace IMS.Services;

internal static class SettingsStore
{
    private const int CurrentSettingsVersion = 1;

    private static readonly string SettingsPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "IMS",
        "settings.json");

    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    public static AppSettings Load()
    {
        try
        {
            if (!File.Exists(SettingsPath))
                return new AppSettings();

            var json = File.ReadAllText(SettingsPath);
            var settings = JsonSerializer.Deserialize<AppSettings>(json, JsonOptions) ?? new AppSettings();
            if (MigrateIfNeeded(settings))
                Save(settings);

            return settings;
        }
        catch
        {
            return new AppSettings();
        }
    }

    /// <summary>
    /// One-time upgrades for installs that still point at the old local dev API default.
    /// </summary>
    private static bool MigrateIfNeeded(AppSettings settings)
    {
        if (settings.SettingsVersion >= CurrentSettingsVersion)
            return false;

        if (ShouldMigrateLegacyLocalApi(settings))
        {
            settings.ApiEndpointProfile = ApiEndpointProfiles.OnlineId;
            settings.ApiBaseUrl = ApiEndpointProfiles.OnlineApiBaseUrl;
        }

        settings.SettingsVersion = CurrentSettingsVersion;
        return true;
    }

    private static bool ShouldMigrateLegacyLocalApi(AppSettings settings)
    {
        if (string.Equals(settings.ApiEndpointProfile, ApiEndpointProfiles.LocalId, StringComparison.OrdinalIgnoreCase))
            return true;

        return string.IsNullOrWhiteSpace(settings.ApiEndpointProfile)
               && ApiEndpointProfiles.NormalizeApiUrl(settings.ApiBaseUrl) == "http://127.0.0.1:3000";
    }

    public static void Save(AppSettings settings)
    {
        try
        {
            var dir = Path.GetDirectoryName(SettingsPath)!;
            Directory.CreateDirectory(dir);
            var json = JsonSerializer.Serialize(settings, JsonOptions);
            File.WriteAllText(SettingsPath, json);
        }
        catch
        {
            // non-fatal for mock app
        }
    }

    public static void Update(Action<AppSettings> mutate)
    {
        var settings = Load();
        mutate(settings);
        Save(settings);
    }
}
