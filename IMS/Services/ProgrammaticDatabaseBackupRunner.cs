using System.IO;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
using IMS.Services.Api.Dtos;
using MongoDB.Bson;
using MongoDB.Driver;

namespace IMS.Services;

/// <summary>Exports MongoDB collections to a gzip JSON .bak file without mongodump.</summary>
internal static class ProgrammaticDatabaseBackupRunner
{
    private const string BackupFormat = "ims-mongo-json-v1";

    public static async Task<DatabaseBackupResultDto> CreateBackupAsync(
        string outputDirectory,
        string fileName,
        IProgress<string>? progress = null,
        CancellationToken cancellationToken = default)
    {
        var folder = Path.GetFullPath(outputDirectory.Trim());
        DatabaseBackupService.EnsureWritableBackupFolder(folder);

        var safeName = Path.GetFileName(fileName);
        if (string.IsNullOrWhiteSpace(safeName) || safeName != fileName)
            throw new InvalidOperationException("Invalid backup file name.");

        var outputPath = Path.Combine(folder, safeName);
        var tempPath = $"{outputPath}.tmp";

        if (File.Exists(tempPath))
            File.Delete(tempPath);

        var uri = DatabaseBackupSettings.ResolveMongoConnectionUri();
        progress?.Report("Exporting database (built-in backup)…");

        try
        {
            await ExportDatabaseAsync(uri, tempPath, progress, cancellationToken);

            if (File.Exists(outputPath))
                File.Delete(outputPath);

            File.Move(tempPath, outputPath);
        }
        catch
        {
            TryDeleteFile(tempPath);
            throw;
        }

        var info = new FileInfo(outputPath);
        if (!info.Exists || info.Length < 32)
            throw new InvalidOperationException("Backup file was created but appears incomplete.");

        return new DatabaseBackupResultDto
        {
            Success = true,
            FilePath = outputPath,
            FileName = safeName,
            FileSizeBytes = info.Length,
            CreatedAtUtc = DateTime.UtcNow.ToString("o")
        };
    }

    private static async Task ExportDatabaseAsync(
        string connectionUri,
        string archivePath,
        IProgress<string>? progress,
        CancellationToken cancellationToken)
    {
        MongoClient client;
        try
        {
            client = new MongoClient(connectionUri);
            await client.ListDatabaseNamesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException(
                "Cannot connect to MongoDB. Ensure MongoDB is running on this computer " +
                $"(default: {DatabaseBackupSettings.DefaultMongoConnectionUri}).",
                ex);
        }

        var databaseName = MongoUrl.Create(connectionUri).DatabaseName;
        if (string.IsNullOrWhiteSpace(databaseName))
            databaseName = "ims";

        var database = client.GetDatabase(databaseName);
        progress?.Report("Reading collections…");

        var collectionNames = await (await database.ListCollectionNamesAsync(cancellationToken: cancellationToken))
            .ToListAsync(cancellationToken);

        var exportCollections = new Dictionary<string, List<object>>();

        foreach (var name in collectionNames.OrderBy(n => n, StringComparer.OrdinalIgnoreCase))
        {
            if (name.StartsWith("system.", StringComparison.Ordinal))
                continue;

            cancellationToken.ThrowIfCancellationRequested();
            progress?.Report($"Exporting {name}…");

            var collection = database.GetCollection<BsonDocument>(name);
            var documents = await collection
                .Find(FilterDefinition<BsonDocument>.Empty)
                .ToListAsync(cancellationToken);

            exportCollections[name] = documents
                .Select(BsonTypeMapper.MapToDotNetValue)
                .ToList();
        }

        var payload = new
        {
            format = BackupFormat,
            exportedAtUtc = DateTime.UtcNow.ToString("o"),
            database = databaseName,
            collections = exportCollections
        };

        var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = false });
        await WriteGzipFileAsync(archivePath, json, cancellationToken);
    }

    private static async Task WriteGzipFileAsync(string path, string content, CancellationToken cancellationToken)
    {
        await using var fileStream = new FileStream(path, FileMode.Create, FileAccess.Write, FileShare.None);
        await using var gzip = new GZipStream(fileStream, CompressionLevel.Optimal);
        var bytes = Encoding.UTF8.GetBytes(content);
        await gzip.WriteAsync(bytes, cancellationToken);
    }

    private static void TryDeleteFile(string path)
    {
        try
        {
            if (File.Exists(path))
                File.Delete(path);
        }
        catch
        {
            // ignore
        }
    }
}
