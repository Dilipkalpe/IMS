using System.Globalization;
using System.IO;
using System.Net.Http;
using System.Windows;
using System.Windows.Documents;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.Services;

public static class PayrollPayslipPrintService
{
    public static void ShowPreview(PayslipReportDto report, string companyName = "IMS Company")
    {
        var doc = BuildDocument(report, companyName);
        InventoryReportPrintHelper.ShowPreview($"Payslip {report.Payslip?.PayslipNo}", doc);
    }

    public static void Print(PayslipReportDto report, string companyName = "IMS Company")
    {
        var doc = BuildDocument(report, companyName);
        var dlg = new System.Windows.Controls.PrintDialog();
        if (dlg.ShowDialog() != true)
            return;
        doc.PageWidth = dlg.PrintableAreaWidth;
        doc.PageHeight = dlg.PrintableAreaHeight;
        doc.ColumnWidth = dlg.PrintableAreaWidth;
        dlg.PrintDocument(((IDocumentPaginatorSource)doc).DocumentPaginator, "Payslip");
    }

    public static async Task OpenHtmlInBrowserAsync(string periodMonth, string employeeCode, int? runNo = null)
    {
        var query = $"periodMonth={Uri.EscapeDataString(periodMonth)}&employeeCode={Uri.EscapeDataString(employeeCode)}";
        if (runNo is int n)
            query += $"&runNo={n}";
        var url = $"{ApiConfiguration.BaseUrl.TrimEnd('/')}/api/payroll-reports/payslip-html?{query}";
        var path = Path.Combine(Path.GetTempPath(), $"payslip-{employeeCode}-{periodMonth}.html");
        using var client = new HttpClient();
        var html = await client.GetStringAsync(url);
        await File.WriteAllTextAsync(path, html);
        System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(path) { UseShellExecute = true });
    }

    private static FlowDocument BuildDocument(PayslipReportDto report, string companyName)
    {
        var p = report.Payslip!;
        var earn = p.Earnings;
        var ded = p.Deductions;
        var doc = InventoryReportPrintHelper.CreateDocument(
            companyName,
            $"Salary Payslip — {report.PeriodMonth} · Run #{report.RunNo}",
            520,
            fontSize: 11);

        void AddSection(string title)
        {
            var pgh = new Paragraph(new System.Windows.Documents.Run(title)) { FontWeight = FontWeights.Bold, Margin = new Thickness(0, 12, 0, 4) };
            doc.Blocks.Add(pgh);
        }

        void AddLine(string label, string value)
        {
            doc.Blocks.Add(new Paragraph(new System.Windows.Documents.Run($"{label}: {value}")) { Margin = new Thickness(0, 2, 0, 2) });
        }

        var typeLabel = !string.IsNullOrWhiteSpace(p.EmployeeTypeLabel)
            ? p.EmployeeTypeLabel
            : PayrollEmployeeFormFields.ToDisplayEmployeeType(p.EmployeeType);
        AddLine("Employee", $"{p.EmployeeCode} — {p.EmployeeName}");
        AddLine("Employee Type", typeLabel);
        AddLine("Department", p.Department ?? "—");
        AddLine("Paid days / Hours / OT", $"{p.PaidDays:N1} / {p.WorkedHours:N1} / {p.OtHours:N1}");

        AddSection("Earnings");
        AddLine("Basic", Format(earn?.Basic));
        AddLine("HRA", Format(earn?.Hra));
        AddLine("Allowances", Format(earn?.Allowances));
        AddLine("Bonus", Format(earn?.Bonus));
        AddLine("Overtime", Format(earn?.Overtime));
        AddLine("Gross", Format(earn?.Gross));

        AddSection("Deductions");
        AddLine("PF", Format(ded?.Pf));
        AddLine("ESI", Format(ded?.Esi));
        AddLine("Professional Tax", Format(ded?.ProfessionalTax));
        AddLine("TDS", Format(ded?.Tds));
        AddLine("Total deductions", Format(ded?.Total));

        var net = new Paragraph(new System.Windows.Documents.Run($"Net pay: ₹ {p.NetPay:N2}"))
        {
            FontWeight = FontWeights.Bold,
            FontSize = 14,
            Margin = new Thickness(0, 16, 0, 0)
        };
        doc.Blocks.Add(net);
        doc.Blocks.Add(new Paragraph(new System.Windows.Documents.Run($"Payslip No: {p.PayslipNo}")) { FontSize = 10, Foreground = System.Windows.Media.Brushes.Gray });

        return doc;
    }

    private static string Format(decimal? v) =>
        (v ?? 0).ToString("N2", CultureInfo.InvariantCulture);
}
