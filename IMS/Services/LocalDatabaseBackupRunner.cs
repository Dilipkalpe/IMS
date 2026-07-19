using IMS.Services.Api.Dtos;

namespace IMS.Services;

/// <summary>Creates a MongoDB backup on the local machine when the API route is unavailable.</summary>
internal static class LocalDatabaseBackupRunner
{
    public static Task<DatabaseBackupResultDto> CreateBackupAsync(
        string outputDirectory,
        string fileName,
        IProgress<string>? progress = null,
        CancellationToken cancellationToken = default) =>
        ProgrammaticDatabaseBackupRunner.CreateBackupAsync(
            outputDirectory,
            fileName,
            progress,
            cancellationToken);
}
