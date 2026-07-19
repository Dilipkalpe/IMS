// DI registration — call from WPF App startup (Microsoft.Extensions.Hosting or manual)

using ERP.Reporting.Core;
using ERP.Reporting.Data.Repositories;
using ERP.Reporting.Print;
using Microsoft.Extensions.DependencyInjection;
using System.Data;
using Microsoft.Data.SqlClient;

namespace ERP.Reporting.UI;

public static class ReportingServiceCollectionExtensions
{
    public static IServiceCollection AddErpReporting(
        this IServiceCollection services,
        string sqlConnectionString)
    {
        services.AddSingleton<Func<IDbConnection>>(_ => () => new SqlConnection(sqlConnectionString));
        services.AddScoped<IReportFormatRepository, ReportFormatRepository>();
        services.AddSingleton<IPrintEngine, WpfPrintEngine>();

        // services.AddScoped<IReportLayoutRenderer, ReportLayoutRenderer>();
        // services.AddScoped<IFieldValueProvider, SqlFieldValueProvider>();
        // services.AddEnumerable<IElementRenderer>(); // text, image, table, barcode, ...

        return services;
    }
}

// Usage from sales invoice VM:
// var repo = _services.GetRequiredService<IReportFormatRepository>();
// var resolved = await repo.ResolveAsync(new ReportPrintContext("sales_invoice", customerCode, "customer", id, docNo));
// var layout = JsonSerializer.Deserialize<ReportLayoutDocument>(resolved.LayoutJson);
// var values = await _fieldProvider.GetValuesAsync(context, invoiceDto);
// var rendered = await _renderer.RenderAsync(layout, values, lineRows);
// _printEngine.ShowPreview(rendered, "Tax Invoice");
