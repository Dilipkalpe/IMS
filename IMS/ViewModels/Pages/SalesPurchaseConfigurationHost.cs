using IMS.Models;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.ViewModels;

public sealed class SalesPurchaseConfigurationHost : ViewModelBase
{
    private SalesRateSource _salesRateSource = SalesRateSource.ProductMaster;
    private string _statusMessage = string.Empty;
    private bool _suppressSave;

    public SalesPurchaseConfigurationHost()
    {
        _suppressSave = true;
        ApplyFromService(SalesPurchaseSettingsService.Instance.Current);
        _suppressSave = false;

        SalesPurchaseSettingsService.Instance.SettingsChanged += (_, _) =>
        {
            if (!IsUiAvailable)
                return;

            _suppressSave = true;
            ApplyFromService(SalesPurchaseSettingsService.Instance.Current);
            _suppressSave = false;
        };

        _ = LoadFromApiAsync();
    }

    public bool CanManageSettings => AuthSession.IsAdministrator;

    public bool UseProductMasterSalesRate
    {
        get => _salesRateSource == SalesRateSource.ProductMaster;
        set
        {
            if (!value)
                return;

            SelectSource(SalesRateSource.ProductMaster);
        }
    }

    public bool UsePurchaseInvoiceSalesRate
    {
        get => _salesRateSource == SalesRateSource.PurchaseInvoice;
        set
        {
            if (!value)
                return;

            SelectSource(SalesRateSource.PurchaseInvoice);
        }
    }

    private void SelectSource(SalesRateSource source)
    {
        if (_salesRateSource == source)
            return;

        ApplyFromService(new SalesPurchaseSettings { SalesRateSource = source });
        if (!_suppressSave)
            _ = SaveAsync(source);
    }

    public string StatusMessage
    {
        get => _statusMessage;
        private set => SetProperty(ref _statusMessage, value);
    }

    public string ActiveSourceSummary =>
        $"Active: {SalesPurchaseSettingsService.GetDisplayName(_salesRateSource)}";

    private async Task LoadFromApiAsync()
    {
        if (!IsUiAvailable)
            return;

        await SalesPurchaseSettingsService.Instance.SyncFromApiAsync();
        if (!IsUiAvailable)
            return;

        _suppressSave = true;
        ApplyFromService(SalesPurchaseSettingsService.Instance.Current);
        _suppressSave = false;
        StatusMessage = await ImsApiClient.CheckHealthAsync()
            ? "Settings loaded from server."
            : "API offline — using settings saved on this computer.";
    }

    private async Task SaveAsync(SalesRateSource source)
    {
        if (_suppressSave)
            return;

        if (!CanManageSettings)
        {
            StatusMessage = "Only administrators can change sales/purchase configuration.";
            ApplyFromService(SalesPurchaseSettingsService.Instance.Current);
            return;
        }

        var settings = new SalesPurchaseSettings { SalesRateSource = source };
        var savedRemote = await SalesPurchaseSettingsService.Instance.SaveToApiAsync(settings);
        StatusMessage = savedRemote
            ? "Sales rate source saved."
            : "Saved on this computer. API was offline — sync when the server is running.";
    }

    private void ApplyFromService(SalesPurchaseSettings settings)
    {
        _salesRateSource = settings.SalesRateSource;
        OnPropertyChanged(nameof(UseProductMasterSalesRate));
        OnPropertyChanged(nameof(UsePurchaseInvoiceSalesRate));
        OnPropertyChanged(nameof(ActiveSourceSummary));
    }
}
