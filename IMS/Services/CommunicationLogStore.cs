using System.IO;
using System.Text.Json;

namespace IMS.Services;

public sealed class CommunicationLogEntry
{
    public DateTime TimestampLocal { get; init; }
    public string InvoiceNumber { get; init; } = string.Empty;
    public string DocumentKind { get; init; } = string.Empty;
    public string Channel { get; init; } = string.Empty;
    public string Recipient { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string? ErrorMessage { get; init; }
}

internal static class CommunicationLogStore
{
    private static readonly string LogPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "IMS",
        "communication-logs.jsonl");

    public static void Append(CommunicationLogEntry entry)
    {
        try
        {
            var dir = Path.GetDirectoryName(LogPath)!;
            Directory.CreateDirectory(dir);
            var line = JsonSerializer.Serialize(entry);
            File.AppendAllText(LogPath, line + Environment.NewLine);
        }
        catch
        {
            // non-fatal
        }
    }
}
