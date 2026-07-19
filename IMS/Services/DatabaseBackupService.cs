using System.IO;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.Services;

public static class DatabaseBackupService
{
    private static readonly SemaphoreSlim BackupGate = new(1, 1);

    public static bool IsBackupInProgress => BackupGate.CurrentCount == 0;

    public static async Task<DatabaseBackupResultDto> RunBackupAsync(
        IProgress<string>? progress = null,
        CancellationToken cancellationToken = default)
    {
        if (!await BackupGate.WaitAsync(0, cancellationToken))
            throw new InvalidOperationException("A database backup is already in progress.");

        try
        {
            var apiOnline = await ImsApiClient.CheckHealthAsync();

            var folder = DatabaseBackupSettings.ResolveBackupFolder();
            progress?.Report("Preparing backup folder…");
            EnsureWritableBackupFolder(folder);

            var fileName = DatabaseBackupSettings.CreateTimestampedFileName();
            progress?.Report("Creating database backup…");

            var result = apiOnline
                ? await CreateBackupViaApiOrLocalAsync(folder, fileName, progress, cancellationToken)
                : await CreateLocalBackupAsync(folder, fileName, progress, cancellationToken);

            DatabaseBackupLogStore.Append(new DatabaseBackupLogEntry
            {
                TimestampLocal = DateTime.Now,
                User = AuthSession.User?.Username ?? AuthSession.DisplayName,
                Status = "Success",
                FilePath = result.FilePath
            });

            return result;
        }
        catch (Exception ex)
        {
            DatabaseBackupLogStore.Append(new DatabaseBackupLogEntry
            {
                TimestampLocal = DateTime.Now,
                User = AuthSession.User?.Username ?? AuthSession.DisplayName,
                Status = "Failed",
                ErrorMessage = ex.Message
            });
            throw;
        }
        finally
        {
            BackupGate.Release();
        }
    }

    private static async Task<DatabaseBackupResultDto> CreateBackupViaApiOrLocalAsync(
        string folder,
        string fileName,
        IProgress<string>? progress,
        CancellationToken cancellationToken)
    {
        try
        {
            var apiResult = await ImsApiClient.CreateDatabaseBackupAsync(folder, fileName);
            if (apiResult is not null)
                return apiResult;

            throw new ApiException("Backup failed — no response from API.");
        }
        catch (ApiException ex) when (ShouldUseLocalBackupFallback(ex))
        {
            progress?.Report("Using built-in database export on this computer…");
        }

        return await CreateLocalBackupAsync(folder, fileName, progress, cancellationToken);
    }

    private static Task<DatabaseBackupResultDto> CreateLocalBackupAsync(
        string folder,
        string fileName,
        IProgress<string>? progress,
        CancellationToken cancellationToken) =>
        LocalDatabaseBackupRunner.CreateBackupAsync(folder, fileName, progress, cancellationToken);

    private static bool ShouldUseLocalBackupFallback(ApiException ex)
    {
        if (ex.Message.Contains("401", StringComparison.Ordinal)
            || ex.Message.Contains("403", StringComparison.Ordinal))
        {
            return false;
        }

        return true;
    }

    private static bool IsBackupRouteMissing(ApiException ex) =>
        ex.Message.Contains("404", StringComparison.OrdinalIgnoreCase)
        || ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase);

    public static void EnsureWritableBackupFolder(string folder)
    {
        Directory.CreateDirectory(folder);

        try
        {
            var probe = Path.Combine(folder, $".ims-write-test-{Guid.NewGuid():N}");
            File.WriteAllText(probe, "ok");
            File.Delete(probe);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Cannot write to backup folder:\n{folder}", ex);
        }
    }
}
