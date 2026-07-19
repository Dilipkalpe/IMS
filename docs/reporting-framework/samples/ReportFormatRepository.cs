// Dapper repository sample — ERP.Reporting.Data/Repositories/

using System.Data;
using Dapper;
using ERP.Reporting.Core;

namespace ERP.Reporting.Data.Repositories;

public sealed class ReportFormatRepository : IReportFormatRepository
{
    private readonly Func<IDbConnection> _connectionFactory;

    public ReportFormatRepository(Func<IDbConnection> connectionFactory) =>
        _connectionFactory = connectionFactory;

    public async Task<ResolvedReportFormat?> ResolveAsync(ReportPrintContext context, CancellationToken ct = default)
    {
        await using var conn = _connectionFactory();
        var parameters = new DynamicParameters();
        parameters.Add("@EntryTypeKey", context.EntryTypeKey);
        parameters.Add("@PartyKind", context.PartyKind);
        parameters.Add("@PartyCode", context.PartyCode);
        parameters.Add("@ReportFormatId", dbType: DbType.Int64, direction: ParameterDirection.Output);

        await conn.ExecuteAsync(
            new CommandDefinition(
                "dbo.usp_ReportFormat_Resolve",
                parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        var id = parameters.Get<long?>("@ReportFormatId");
        if (id is null or 0)
            return null;

        const string sql = """
            SELECT ReportFormatId, FormatCode, LayoutJson, SchemaVersion,
                   PrintPreviewOnSave, AutoPrintOnSave, DefaultCopies, WatermarkType,
                   COALESCE(CustomWidthMm, p.WidthMm) AS WidthMm,
                   COALESCE(CustomHeightMm, p.HeightMm) AS HeightMm,
                   MarginTopMm, MarginRightMm, MarginBottomMm, MarginLeftMm
            FROM dbo.ReportFormatMaster m
            INNER JOIN dbo.ReportPaperPreset p ON p.PaperKey = m.PaperKey
            WHERE m.ReportFormatId = @id AND m.IsActive = 1
            """;

        var row = await conn.QuerySingleOrDefaultAsync<ResolveRow>(
            new CommandDefinition(sql, new { id }, cancellationToken: ct));

        return row is null
            ? null
            : new ResolvedReportFormat(
                row.ReportFormatId,
                row.FormatCode,
                row.LayoutJson,
                row.SchemaVersion,
                new PrintBehaviorSettings(
                    row.PrintPreviewOnSave,
                    row.AutoPrintOnSave,
                    row.DefaultCopies,
                    row.WatermarkType),
                new PageDimensions(
                    (double)row.WidthMm,
                    (double)row.HeightMm,
                    (double)row.MarginTopMm,
                    (double)row.MarginRightMm,
                    (double)row.MarginBottomMm,
                    (double)row.MarginLeftMm));
    }

    public async Task<long> SaveAsync(ReportFormatSaveRequest request, CancellationToken ct = default)
    {
        await using var conn = _connectionFactory();
        if (request.IsDefault)
        {
            await conn.ExecuteAsync(
                """
                UPDATE dbo.ReportFormatMaster SET IsDefault = 0
                WHERE EntryTypeKey = @EntryTypeKey
                """,
                new { request.EntryTypeKey });
        }

        if (request.ReportFormatId is null or 0)
        {
            return await conn.ExecuteScalarAsync<long>(
                """
                INSERT INTO dbo.ReportFormatMaster
                    (FormatCode, FormatName, EntryTypeKey, LayoutJson, IsDefault, ModifiedAtUtc)
                OUTPUT INSERTED.ReportFormatId
                VALUES (@FormatCode, @FormatName, @EntryTypeKey, @LayoutJson, @IsDefault, SYSUTCDATETIME())
                """,
                request);
        }

        await conn.ExecuteAsync(
            """
            UPDATE dbo.ReportFormatMaster
            SET FormatCode = @FormatCode, FormatName = @FormatName, EntryTypeKey = @EntryTypeKey,
                LayoutJson = @LayoutJson, IsDefault = @IsDefault, ModifiedAtUtc = SYSUTCDATETIME()
            WHERE ReportFormatId = @ReportFormatId
            """,
            request);

        return request.ReportFormatId!.Value;
    }

    public async Task<ReportFormatMasterDto?> GetByIdAsync(long reportFormatId, CancellationToken ct = default)
    {
        await using var conn = _connectionFactory();
        return await conn.QuerySingleOrDefaultAsync<ReportFormatMasterDto>(
            """
            SELECT ReportFormatId, FormatCode, FormatName, EntryTypeKey, LayoutJson
            FROM dbo.ReportFormatMaster WHERE ReportFormatId = @reportFormatId
            """,
            new { reportFormatId });
    }

    private sealed class ResolveRow
    {
        public long ReportFormatId { get; init; }
        public string FormatCode { get; init; } = "";
        public string LayoutJson { get; init; } = "";
        public int SchemaVersion { get; init; }
        public bool PrintPreviewOnSave { get; init; }
        public bool AutoPrintOnSave { get; init; }
        public int DefaultCopies { get; init; }
        public string WatermarkType { get; init; } = "";
        public decimal WidthMm { get; init; }
        public decimal HeightMm { get; init; }
        public decimal MarginTopMm { get; init; }
        public decimal MarginRightMm { get; init; }
        public decimal MarginBottomMm { get; init; }
        public decimal MarginLeftMm { get; init; }
    }
}
