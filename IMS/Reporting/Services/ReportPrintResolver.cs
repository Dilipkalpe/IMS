using System.Text.Json;
using IMS.Models;
using IMS.Reporting.Data;
using IMS.Reporting.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.Reporting.Services;

public static class ReportPrintResolver
{
    /// <summary>
    /// Resolves canvas (v2) layout for printing. Returns null when no designed elements exist (use legacy bill format).
    /// </summary>
    public static Task<ResolvedReportPrintModel?> TryResolveAsync(
        string transactionType,
        SalesOrderDto? order,
        string accountType = "customer") =>
        ResolveForPrintAsync(transactionType, order, accountType);

    public static async Task<ResolvedReportPrintModel?> ResolveForPrintAsync(
        string transactionType,
        SalesOrderDto? order,
        string accountType = "customer")
    {
        if (!ImsApiClient.IsAvailable)
            return null;

        try
        {
            var partyCode = await BillFormatPrintResolver.ResolvePartyCodeAsync(order, accountType)
                .ConfigureAwait(false);
            var partyKind = string.Equals(accountType, "supplier", StringComparison.OrdinalIgnoreCase)
                ? "supplier"
                : "customer";

            var resolved = await ImsApiClient.ResolveReportFormatAsync(
                    transactionType,
                    partyCode,
                    partyKind)
                .ConfigureAwait(false);

            if (resolved?.Format is null)
                return null;

            var model = BuildPrintModel(resolved);
            if (model is not null)
                return model;

            // Party-specific format may be empty; use org default for this transaction type.
            if (!string.Equals(resolved.Source, "default", StringComparison.OrdinalIgnoreCase)
                && !string.IsNullOrWhiteSpace(partyCode))
            {
                var fallback = await ImsApiClient.ResolveReportFormatAsync(transactionType, null, partyKind)
                    .ConfigureAwait(false);
                if (fallback?.Format is not null
                    && !string.Equals(fallback.Format.Id, resolved.Format.Id, StringComparison.Ordinal))
                    return BuildPrintModel(fallback);
            }

            return null;
        }
        catch
        {
            return null;
        }
    }

    public static async Task<ResolvedReportPrintModel?> TryResolveWithBootstrapAsync(
        string transactionType,
        SalesOrderDto? order,
        string accountType = "customer")
    {
        var model = await ResolveForPrintAsync(transactionType, order, accountType).ConfigureAwait(false);
        if (model is not null)
            return model;

        if (!ImsApiClient.IsAvailable)
            return null;

        try
        {
            var partyCode = await BillFormatPrintResolver.ResolvePartyCodeAsync(order, accountType)
                .ConfigureAwait(false);
            var partyKind = string.Equals(accountType, "supplier", StringComparison.OrdinalIgnoreCase)
                ? "supplier"
                : "customer";

            var resolved = await ImsApiClient.ResolveReportFormatAsync(transactionType, partyCode, partyKind)
                .ConfigureAwait(false);
            if (resolved?.Format is null)
                return null;

            var layout = ParseLayout(resolved.Format.LayoutJson);
            if (layout is null)
                return null;

            ReportLayoutBootstrap.EnsureElements(layout, transactionType);
            ApplyEffectivePage(layout, resolved.EffectivePage);

            return new ResolvedReportPrintModel
            {
                Format = resolved.Format,
                Layout = layout,
                EffectivePage = resolved.EffectivePage,
                PrintSettings = resolved.Format.PrintSettings ?? new BillFormatPrintSettings(),
                ResolveSource = resolved.Source
            };
        }
        catch
        {
            return null;
        }
    }

    private static ResolvedReportPrintModel? BuildPrintModel(ReportFormatResolveResultDto resolved)
    {
        var format = resolved.Format;
        if (format is null || format.SchemaVersion < 2)
            return null;

        var layout = ParseLayout(format.LayoutJson);
        if (layout is null || layout.Elements.Count == 0)
            return null;

        ApplyEffectivePage(layout, resolved.EffectivePage);

        return new ResolvedReportPrintModel
        {
            Format = format,
            Layout = layout,
            EffectivePage = resolved.EffectivePage,
            PrintSettings = format.PrintSettings ?? new BillFormatPrintSettings(),
            ResolveSource = resolved.Source
        };
    }

    public static ReportLayoutDocument? ParseLayout(JsonElement layoutJson)
    {
        if (layoutJson.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
            return null;

        try
        {
            var doc = layoutJson.Deserialize<ReportLayoutDocument>(ImsApiClient.SerializerOptions);
            if (doc?.Elements.Count > 0)
                return doc;
        }
        catch
        {
            /* try raw text */
        }

        try
        {
            return JsonSerializer.Deserialize<ReportLayoutDocument>(
                layoutJson.GetRawText(),
                ImsApiClient.SerializerOptions);
        }
        catch
        {
            return null;
        }
    }

    private static void ApplyEffectivePage(ReportLayoutDocument layout, EffectivePageDto? page)
    {
        if (page is null)
            return;

        layout.Page.WidthMm = page.WidthMm;
        layout.Page.HeightMm = page.HeightMm;
        if (page.MarginsMm is not null)
        {
            layout.Page.MarginsMm.Top = page.MarginsMm.Top;
            layout.Page.MarginsMm.Right = page.MarginsMm.Right;
            layout.Page.MarginsMm.Bottom = page.MarginsMm.Bottom;
            layout.Page.MarginsMm.Left = page.MarginsMm.Left;
        }
    }
}
