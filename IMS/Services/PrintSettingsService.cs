using System.Windows;
using IMS.Models;

namespace IMS.Services;

public sealed class PrintSettingsService
{
    private static readonly Lazy<PrintSettingsService> Lazy = new(() => new PrintSettingsService());
    public static PrintSettingsService Instance => Lazy.Value;

    private PrintSettingsService()
    {
        Current = new SalesOrderPrintSettings();
    }

    public SalesOrderPrintSettings Current { get; private set; }

    public event EventHandler? PrintSettingsChanged;

    public static void Initialize()
    {
        var settings = SettingsStore.Load();
        Instance.Apply(settings.SalesOrderPrint, persist: false);
    }

    public void Apply(SalesOrderPrintSettings settings, bool persist = true)
    {
        Current = new SalesOrderPrintSettings
        {
            PaperFormat = settings.PaperFormat,
            CustomWidthMm = ClampMm(settings.CustomWidthMm, 50, 1200),
            CustomHeightMm = ClampMm(settings.CustomHeightMm, 50, 1200),
            MarginMm = ClampMm(settings.MarginMm, 0, 50)
        };

        if (persist)
            SettingsStore.Update(s => s.SalesOrderPrint = Clone(Current));

        PrintSettingsChanged?.Invoke(this, EventArgs.Empty);
    }

    public (double WidthMm, double HeightMm) GetPageSizeMm() =>
        Current.PaperFormat switch
        {
            PrintPaperFormat.A4 => (210, 297),
            PrintPaperFormat.A5 => (148, 210),
            PrintPaperFormat.A3 => (297, 420),
            PrintPaperFormat.Custom => (Current.CustomWidthMm, Current.CustomHeightMm),
            _ => (210, 297)
        };

    public Size GetPageSizeDips()
    {
        var (w, h) = GetPageSizeMm();
        return new Size(MmToDip(w), MmToDip(h));
    }

    public Thickness GetPagePaddingDips() =>
        new(MmToDip(Current.MarginMm), MmToDip(Current.MarginMm), MmToDip(Current.MarginMm), MmToDip(Current.MarginMm));

    public PrintPageLayout GetPageLayout()
    {
        var pageSize = GetPageSizeDips();
        var padding = GetPagePaddingDips();
        var contentWidth = Math.Max(120, pageSize.Width - padding.Left - padding.Right);
        var (widthMm, heightMm) = GetPageSizeMm();
        return new PrintPageLayout(
            pageSize,
            padding,
            contentWidth,
            FormatDisplayName,
            $"{widthMm:0.#} × {heightMm:0.#} mm");
    }

    public string FormatDisplayName => Current.PaperFormat switch
    {
        PrintPaperFormat.A4 => "A4",
        PrintPaperFormat.A5 => "A5",
        PrintPaperFormat.A3 => "A3",
        PrintPaperFormat.Custom => "Custom",
        _ => "A4"
    };

    public string PageSizeSummary
    {
        get
        {
            var (w, h) = GetPageSizeMm();
            return $"{FormatDisplayName} — {w:0.#} × {h:0.#} mm (portrait)";
        }
    }

    public static double MmToDip(double mm) => mm * 96.0 / 25.4;

    public static double DipToMm(double dip) => dip * 25.4 / 96.0;

    private static double ClampMm(double value, double min, double max) =>
        Math.Clamp(value, min, max);

    private static SalesOrderPrintSettings Clone(SalesOrderPrintSettings s) => new()
    {
        PaperFormat = s.PaperFormat,
        CustomWidthMm = s.CustomWidthMm,
        CustomHeightMm = s.CustomHeightMm,
        MarginMm = s.MarginMm
    };
}

public readonly record struct PrintPageLayout(
    Size PageSizeDips,
    Thickness PagePaddingDips,
    double ContentWidthDips,
    string FormatName,
    string SizeLabel);
