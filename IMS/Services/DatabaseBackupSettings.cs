using System.IO;
using IMS.Models;

namespace IMS.Services;

public static class DatabaseBackupSettings
{
    public static string DefaultBackupFolder =>
        Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "IMS",
            "Backups");

    public const string DefaultMongoConnectionUri = "mongodb://127.0.0.1:27017/ims";

    public static string ResolveBackupFolder(AppSettings? settings = null)
    {
        settings ??= SettingsStore.Load();
        var configured = settings.DatabaseBackupFolder?.Trim();
        var preferred = string.IsNullOrWhiteSpace(configured) ? DefaultBackupFolder : configured;

        if (TryEnsureFolder(preferred, out var ready))
            return ready;

        if (!string.Equals(preferred, DefaultBackupFolder, StringComparison.OrdinalIgnoreCase)
            && TryEnsureFolder(DefaultBackupFolder, out ready))
        {
            return ready;
        }

        throw new InvalidOperationException($"Cannot create or access the backup folder:\n{preferred}");
    }

    public static string ResolveMongoConnectionUri(AppSettings? settings = null)
    {
        settings ??= SettingsStore.Load();
        var uri = settings.MongoDbConnectionUri?.Trim();
        return string.IsNullOrWhiteSpace(uri) ? DefaultMongoConnectionUri : uri;
    }

    private static bool TryEnsureFolder(string folder, out string resolved)
    {
        resolved = folder;
        try
        {
            resolved = Path.GetFullPath(folder);
            Directory.CreateDirectory(resolved);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public static ExitBackupPreference ResolvePreference(AppSettings? settings = null)
    {
        settings ??= SettingsStore.Load();
        return settings.ExitBackupPreference;
    }

    public static string CreateTimestampedFileName() =>
        $"DatabaseBackup_{DateTime.Now:yyyyMMdd_HHmmss}.bak";
}
