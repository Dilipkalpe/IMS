using System.IO;
using System.Text.Json;

namespace IMS.Services;

public sealed class DatabaseBackupLogEntry
{
    public DateTime TimestampLocal { get; init; }
    public string User { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string? FilePath { get; init; }
    public string? ErrorMessage { get; init; }
}

internal static class DatabaseBackupLogStore
{
    private static readonly string LogPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "IMS",
        "backup-logs.jsonl");

    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = false };

    public static void Append(DatabaseBackupLogEntry entry)
    {
        try
        {
            var dir = Path.GetDirectoryName(LogPath)!;
            Directory.CreateDirectory(dir);
            var line = JsonSerializer.Serialize(entry, JsonOptions);
            File.AppendAllText(LogPath, line + Environment.NewLine);
        }
        catch
        {
            // non-fatal
        }
    }
}
