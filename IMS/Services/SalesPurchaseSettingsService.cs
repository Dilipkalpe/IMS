using IMS.Models;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.Services;

public sealed class SalesPurchaseSettingsService
{
    private static readonly Lazy<SalesPurchaseSettingsService> Lazy = new(() => new SalesPurchaseSettingsService());
    public static SalesPurchaseSettingsService Instance => Lazy.Value;

    private SalesPurchaseSettings _current = new();

    public SalesPurchaseSettings Current => _current;

    public event EventHandler? SettingsChanged;

    public static void Initialize()
    {
        var local = SettingsStore.Load().SalesPurchase;
        Instance.Apply(local, persist: false, notify: false);
        _ = Instance.SyncFromApiAsync();
    }

    public void Apply(SalesPurchaseSettings settings, bool persist = true, bool notify = true)
    {
        _current = new SalesPurchaseSettings
        {
            SalesRateSource = settings.SalesRateSource
        };

        if (persist)
            SettingsStore.Update(s => s.SalesPurchase = Clone(_current));

        if (notify)
            SettingsChanged?.Invoke(this, EventArgs.Empty);
    }

    public async Task SyncFromApiAsync()
    {
        if (!await ImsApiClient.CheckHealthAsync())
            return;

        try
        {
            var dto = await ImsApiClient.GetSalesPurchaseSettingsAsync();
            if (dto is null)
                return;

            Apply(FromDto(dto), persist: true, notify: true);
        }
        catch
        {
            // Keep local settings when API is unavailable.
        }
    }

    public async Task<bool> SaveToApiAsync(SalesPurchaseSettings settings)
    {
        Apply(settings, persist: true, notify: true);

        if (!await ImsApiClient.CheckHealthAsync())
            return false;

        try
        {
            var saved = await ImsApiClient.UpdateSalesPurchaseSettingsAsync(ToDto(settings));
            if (saved is null)
                return false;

            Apply(FromDto(saved), persist: true, notify: true);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public static SalesPurchaseSettings FromDto(SalesPurchaseSettingsDto dto) => new()
    {
        SalesRateSource = ParseSource(dto.SalesRateSource)
    };

    public static SalesPurchaseSettingsDto ToDto(SalesPurchaseSettings settings) => new()
    {
        SalesRateSource = ToApiValue(settings.SalesRateSource)
    };

    public static SalesRateSource ParseSource(string? value) =>
        string.Equals(value, "purchase_invoice", StringComparison.OrdinalIgnoreCase)
            ? SalesRateSource.PurchaseInvoice
            : SalesRateSource.ProductMaster;

    public static string ToApiValue(SalesRateSource source) =>
        source == SalesRateSource.PurchaseInvoice ? "purchase_invoice" : "product_master";

    public static string GetDisplayName(SalesRateSource source) =>
        source == SalesRateSource.PurchaseInvoice
            ? "Purchase Invoice Sales Rate"
            : "Product Master Sales Rate";

    private static SalesPurchaseSettings Clone(SalesPurchaseSettings s) => new()
    {
        SalesRateSource = s.SalesRateSource
    };
}
