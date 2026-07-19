using System.Printing;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Media;
using IMS.Models;
using IMS.Reporting.Core.Fields;
using IMS.Reporting.Data;
using IMS.Reporting.Engine;
using IMS.Reporting.Models;
using IMS.Reporting.Services;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.ViewModels.SubPages;

namespace IMS.Reporting.Print;

public static class ReportPrintEngine
{
    public static async Task ShowPreviewAsync(
        SalesOrderDto order,
        ResolvedReportPrintModel resolved,
        SalesEntryType? entryType = null,
        string partyLabel = "Customer")
    {
        await CompanyProfileService.RefreshAsync().ConfigureAwait(true);
        var registry = await LoadRegistryAsync(resolved.Format.TransactionType).ConfigureAwait(true);
        var ctx = BuildPrintContext(order, entryType, partyLabel);
        var fixedDoc = ReportLayoutRenderer.BuildFixedDocument(resolved.Layout, ctx, registry);
        var pageSize = ReportLayoutUnits.PageSizeDips(resolved.Layout.Page);
        var title = $"{ctx.DocumentTitle} — {ctx.Document.FormattedDocNo}";

        var window = new Window
        {
            Title = $"{title} (Canvas Preview)",
            WindowStartupLocation = WindowStartupLocation.CenterScreen,
            Owner = Application.Current?.MainWindow,
            Background = new SolidColorBrush(Color.FromRgb(226, 232, 240)),
            MinWidth = 420,
            MinHeight = 360,
            Width = Math.Min(pageSize.Width + 80, SystemParameters.WorkArea.Width * 0.95),
            Height = Math.Min(pageSize.Height + 140, SystemParameters.WorkArea.Height * 0.92)
        };

        var root = new DockPanel { LastChildFill = true };
        var toolbar = new DockPanel { Margin = new Thickness(12, 10, 12, 8) };
        DockPanel.SetDock(toolbar, Dock.Top);

        var buttons = new StackPanel { Orientation = Orientation.Horizontal };
        var printBtn = new Button { Content = "Print", Padding = new Thickness(18, 6, 18, 6), Margin = new Thickness(0, 0, 8, 0) };
        printBtn.Click += (_, _) => Print(order, resolved, showDialog: true, entryType, partyLabel);
        var closeBtn = new Button { Content = "Close", Padding = new Thickness(18, 6, 18, 6), IsCancel = true };
        closeBtn.Click += (_, _) => window.Close();
        buttons.Children.Add(printBtn);
        buttons.Children.Add(closeBtn);
        toolbar.Children.Add(buttons);

        var viewer = new DocumentViewer
        {
            Document = fixedDoc,
            Background = Brushes.White
        };

        root.Children.Add(toolbar);
        root.Children.Add(viewer);
        window.Content = root;
        window.ShowDialog();
    }

    public static bool Print(
        SalesOrderDto order,
        ResolvedReportPrintModel resolved,
        bool showDialog = true,
        SalesEntryType? entryType = null,
        string partyLabel = "Customer")
    {
        var registry = Task.Run(() => LoadRegistryAsync(resolved.Format.TransactionType))
            .ConfigureAwait(false)
            .GetAwaiter()
            .GetResult();
        var ctx = BuildPrintContext(order, entryType, partyLabel);
        var fixedDoc = ReportLayoutRenderer.BuildFixedDocument(resolved.Layout, ctx, registry);
        var pageSize = ReportLayoutUnits.PageSizeDips(resolved.Layout.Page);

        var printDialog = new PrintDialog();
        if (showDialog && printDialog.ShowDialog() != true)
            return false;

        try
        {
            var ticket = printDialog.PrintTicket ?? printDialog.PrintQueue?.DefaultPrintTicket;
            if (ticket is not null)
            {
                ticket.PageMediaSize = new PageMediaSize(pageSize.Width, pageSize.Height);
                printDialog.PrintTicket = ticket;
            }
        }
        catch
        {
            /* driver may reject custom size */
        }

        var copies = Math.Max(1, resolved.PrintSettings.NumberOfCopies);
        for (var i = 0; i < copies; i++)
        {
            printDialog.PrintDocument(
                fixedDoc.DocumentPaginator,
                $"{ctx.DocumentTitle} {ctx.Document.FormattedDocNo}");
        }

        return true;
    }

    private static ReportDocumentContext BuildPrintContext(
        SalesOrderDto order,
        SalesEntryType? entryType,
        string partyLabel)
    {
        var title = !string.IsNullOrWhiteSpace(order.DocumentTitle)
            ? order.DocumentTitle.Trim()
            : entryType is not null
                ? SalesEntryCatalog.GetPrintHeaderTitle(entryType.Value)
                : SalesEntryCatalog.GetPrintHeaderTitle(SalesEntryType.SalesOrder);

        return ReportFieldResolver.BuildContext(
            order,
            CompanyProfileService.Current,
            title,
            partyLabel);
    }

    private static async Task<IReadOnlyList<ReportFieldRegistryEntryDto>?> LoadRegistryAsync(string transactionType)
    {
        try
        {
            var response = await ImsApiClient.GetReportFieldRegistryAsync(transactionType).ConfigureAwait(false);
            return response?.Fields;
        }
        catch
        {
            return null;
        }
    }
}
