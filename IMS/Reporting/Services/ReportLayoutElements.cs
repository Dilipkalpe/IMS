using IMS.Reporting.Models;

namespace IMS.Reporting.Services;

/// <summary>Shared canvas element factories for standard report layouts.</summary>
public static class ReportLayoutElements
{
    public const string PrimaryBrand = "#5c4033";
    public const string MutedLabel = "#64748b";
    public const string PanelBg = "#f8fafc";

    public static ReportElementDefinition Logo(string id, double x, double y, double w, double h) =>
        new()
        {
            Id = id,
            Name = "Company logo",
            Type = "companyLogo",
            XMm = x,
            YMm = y,
            WidthMm = w,
            HeightMm = h,
            ZIndex = 4,
            Style = new ReportElementStyle { FontSizePt = 18 }
        };

    public static ReportElementDefinition Label(
        string id, string text, double x, double y, double w, double h, string weight = "normal") =>
        new()
        {
            Id = id,
            Name = text,
            Type = "text",
            XMm = x,
            YMm = y,
            WidthMm = w,
            HeightMm = h,
            ZIndex = 1,
            Style = new ReportElementStyle { FontSizePt = 8, FontWeight = weight, Foreground = MutedLabel },
            Binding = new ReportElementBinding { Value = text }
        };

    public static ReportElementDefinition Dynamic(
        string id,
        string name,
        string fieldKey,
        double x,
        double y,
        double w,
        double h,
        double fontPt,
        string weight = "normal",
        string align = "left",
        string? foreground = null)
    {
        var style = new ReportElementStyle
        {
            FontSizePt = fontPt,
            FontWeight = weight,
            TextAlign = align
        };
        if (!string.IsNullOrWhiteSpace(foreground))
            style.Foreground = foreground;

        return new ReportElementDefinition
        {
            Id = id,
            Name = name,
            Type = "dynamicText",
            XMm = x,
            YMm = y,
            WidthMm = w,
            HeightMm = h,
            ZIndex = 2,
            Binding = new ReportElementBinding { FieldKey = fieldKey, Token = $"{{{{{fieldKey}}}}}" },
            Style = style
        };
    }

    public static ReportElementDefinition HLine(string id, double x, double y, double w) =>
        new()
        {
            Id = id,
            Type = "line",
            Name = "Line",
            XMm = x,
            YMm = y,
            WidthMm = w,
            HeightMm = 0.4,
            ZIndex = 0,
            Style = new ReportElementStyle { BorderThicknessMm = 0.35 }
        };

    public static ReportElementDefinition Box(string id, double x, double y, double w, double h) =>
        new()
        {
            Id = id,
            Name = "Panel",
            Type = "rectangle",
            XMm = x,
            YMm = y,
            WidthMm = w,
            HeightMm = h,
            ZIndex = 0,
            Style = new ReportElementStyle { BorderThicknessMm = 0.35, Background = PanelBg }
        };

    public static ReportElementDefinition DataTable(
        string id,
        double x,
        double y,
        double w,
        double h,
        IReadOnlyList<ReportTableColumnDefinition> columns,
        bool showTotalsRow = true) =>
        new()
        {
            Id = id,
            Name = "Item table",
            Type = "table",
            XMm = x,
            YMm = y,
            WidthMm = w,
            HeightMm = h,
            ZIndex = 3,
            Binding = new ReportElementBinding { FieldKey = "itemTable", DataSource = "lines" },
            Table = new ReportTableSettings
            {
                ShowHeader = true,
                ShowTotalsRow = showTotalsRow,
                RowHeightMm = 5.5,
                HeaderBackground = PrimaryBrand,
                HeaderForeground = "#ffffff",
                Columns = columns.ToList()
            }
        };

    public static ReportTableColumnDefinition Col(string key, string header, double widthMm, string align = "left") =>
        new()
        {
            Key = key,
            Header = header,
            WidthMm = widthMm,
            Align = align,
            Visible = true
        };
}
