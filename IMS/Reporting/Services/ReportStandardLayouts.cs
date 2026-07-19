using IMS.Reporting.Models;



namespace IMS.Reporting.Services;



/// <summary>Professional default canvas layouts (schema v2) for all transaction types.</summary>

public static class ReportStandardLayouts

{

    public const double ContentWidthMm = 190;



    public static void ApplyStandard(ReportLayoutDocument layout, string transactionType)

    {

        layout.SchemaVersion = 2;

        layout.Theme = new ReportThemeSettings

        {

            FontFamily = "Segoe UI",

            BaseFontSizePt = 10,

            PrimaryColor = ReportLayoutElements.PrimaryBrand,

            TextColor = "#0f172a",

            BorderColor = "#94a3b8"

        };

        layout.Options = new ReportLayoutOptions

        {

            ShowLogo = true,

            ShowGst = true,

            ShowAmountInWords = true,

            Watermark = "original"

        };



        layout.Elements = string.Equals(transactionType, "sales_invoice", StringComparison.OrdinalIgnoreCase)

            ? ReportTaxInvoiceLayout.BuildElements()

            : ReportProfessionalLayout.Build(transactionType);

    }



    public static List<ReportElementDefinition> BuildElements(string transactionType) =>

        string.Equals(transactionType, "sales_invoice", StringComparison.OrdinalIgnoreCase)

            ? ReportTaxInvoiceLayout.BuildElements()

            : ReportProfessionalLayout.Build(transactionType);

}


