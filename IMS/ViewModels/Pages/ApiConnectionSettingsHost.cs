using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.ViewModels;

public sealed class ApiConnectionSettingsHost : ViewModelBase
{
    private ApiEndpointProfileOption? _selectedProfile;
    private string _iisServerHost = "localhost";
    private string _customApiUrl = ApiEndpointProfiles.OnlineApiBaseUrl;
    private string _webAppUrl = string.Empty;
    private string _resolvedApiUrl = string.Empty;
    private string _statusMessage = string.Empty;
    private bool _isBusy;
    private bool _suppressSave;

    public ApiConnectionSettingsHost()
    {
        Profiles = new ObservableCollection<ApiEndpointProfileOption>(ApiEndpointProfiles.All);
        TestConnectionCommand = new RelayCommand(() => _ = TestConnectionAsync(), () => !IsBusy);
        SaveConnectionCommand = new RelayCommand(() => _ = SaveConnectionAsync(), () => !IsBusy);
        OpenWebAppCommand = new RelayCommand(OpenWebApp, () => !string.IsNullOrWhiteSpace(ResolvedWebAppUrl));

        LoadFromSettings();
    }

    public ObservableCollection<ApiEndpointProfileOption> Profiles { get; }

    public ApiEndpointProfileOption? SelectedProfile
    {
        get => _selectedProfile;
        set
        {
            if (!SetProperty(ref _selectedProfile, value))
                return;

            OnPropertyChanged(nameof(IsIisProfileSelected));
            OnPropertyChanged(nameof(IsCustomProfileSelected));
            OnPropertyChanged(nameof(ShowWebAppLink));
            RefreshResolvedUrls(persist: false);
        }
    }

    public bool IsIisProfileSelected =>
        string.Equals(SelectedProfile?.Id, ApiEndpointProfiles.IisId, StringComparison.OrdinalIgnoreCase);

    public bool IsCustomProfileSelected =>
        string.Equals(SelectedProfile?.Id, ApiEndpointProfiles.CustomId, StringComparison.OrdinalIgnoreCase);

    public bool IsOnlineProfileSelected =>
        string.Equals(SelectedProfile?.Id, ApiEndpointProfiles.OnlineId, StringComparison.OrdinalIgnoreCase);

    public string IisServerHost
    {
        get => _iisServerHost;
        set
        {
            if (!SetProperty(ref _iisServerHost, value))
                return;
            RefreshResolvedUrls(persist: !_suppressSave);
        }
    }

    public string CustomApiUrl
    {
        get => _customApiUrl;
        set
        {
            if (!SetProperty(ref _customApiUrl, value))
                return;
            RefreshResolvedUrls(persist: !_suppressSave);
        }
    }

    public string WebAppUrl
    {
        get => _webAppUrl;
        set
        {
            if (!SetProperty(ref _webAppUrl, value))
                return;
            OnPropertyChanged(nameof(ResolvedWebAppUrl));
            (OpenWebAppCommand as RelayCommand)?.RaiseCanExecuteChanged();
            if (!_suppressSave)
                SaveQuietly();
        }
    }

    public string ResolvedApiUrl
    {
        get => _resolvedApiUrl;
        private set => SetProperty(ref _resolvedApiUrl, value);
    }

    public string ResolvedWebAppUrl =>
        string.IsNullOrWhiteSpace(WebAppUrl)
            ? BuildPreviewWebAppUrl()
            : WebAppUrl.Trim().TrimEnd('/');

    public bool ShowWebAppLink =>
        IsOnlineProfileSelected || IsIisProfileSelected || !string.IsNullOrWhiteSpace(WebAppUrl);

    public string StatusMessage
    {
        get => _statusMessage;
        private set => SetProperty(ref _statusMessage, value);
    }

    public bool IsBusy
    {
        get => _isBusy;
        private set
        {
            if (!SetProperty(ref _isBusy, value))
                return;
            (TestConnectionCommand as RelayCommand)?.RaiseCanExecuteChanged();
            (SaveConnectionCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }
    }

    public ICommand TestConnectionCommand { get; }
    public ICommand SaveConnectionCommand { get; }
    public ICommand OpenWebAppCommand { get; }

    public void LoadFromSettings()
    {
        _suppressSave = true;
        try
        {
            var settings = SettingsStore.Load();
            SelectedProfile = Profiles.FirstOrDefault(p =>
                string.Equals(p.Id, settings.ApiEndpointProfile, StringComparison.OrdinalIgnoreCase))
                ?? Profiles.First();

            IisServerHost = string.IsNullOrWhiteSpace(settings.IisServerHost)
                ? "localhost"
                : settings.IisServerHost;
            CustomApiUrl = string.IsNullOrWhiteSpace(settings.ApiBaseUrl)
                ? ApiEndpointProfiles.OnlineApiBaseUrl
                : settings.ApiBaseUrl;
            WebAppUrl = settings.WebAppBaseUrl ?? string.Empty;
            RefreshResolvedUrls(persist: false);
        }
        finally
        {
            _suppressSave = false;
        }
    }

    private void RefreshResolvedUrls(bool persist)
    {
        var preview = BuildPreviewSettings();
        ResolvedApiUrl = ApiEndpointProfiles.ResolveApiBaseUrl(preview);
        OnPropertyChanged(nameof(ResolvedWebAppUrl));
        OnPropertyChanged(nameof(ShowWebAppLink));
        (OpenWebAppCommand as RelayCommand)?.RaiseCanExecuteChanged();

        if (persist)
            SaveQuietly();
    }

    private AppSettings BuildPreviewSettings() =>
        new()
        {
            ApiEndpointProfile = SelectedProfile?.Id ?? ApiEndpointProfiles.OnlineId,
            IisServerHost = IisServerHost,
            ApiBaseUrl = CustomApiUrl,
            WebAppBaseUrl = WebAppUrl
        };

    private string BuildPreviewWebAppUrl()
    {
        if (IsOnlineProfileSelected || IsIisProfileSelected)
            return ApiEndpointProfiles.ResolveWebAppUrl(BuildPreviewSettings());

        return string.Empty;
    }

    private void SaveQuietly()
    {
        ApiConfiguration.SaveConnection(BuildPreviewSettings());
        StatusMessage = "Connection settings saved.";
    }

    private async Task SaveConnectionAsync()
    {
        IsBusy = true;
        StatusMessage = string.Empty;
        try
        {
            SaveQuietly();
            ImsApiClient.Initialize();
            var ok = await ImsApiClient.CheckHealthAsync();
            StatusMessage = ok
                ? $"Saved. API is online at {ResolvedApiUrl}."
                : $"Saved, but the API is not reachable at {ResolvedApiUrl}. Check IIS site IMSWebAPI or start the local API.";
        }
        catch (Exception ex)
        {
            StatusMessage = ex.Message;
        }
        finally
        {
            IsBusy = false;
        }
    }

    private async Task TestConnectionAsync()
    {
        IsBusy = true;
        StatusMessage = "Testing connection…";
        try
        {
            ApiConfiguration.SaveConnection(BuildPreviewSettings());
            ImsApiClient.Initialize();

            var ok = await ImsApiClient.CheckHealthAsync();
            StatusMessage = ok
                ? $"Connected to {ResolvedApiUrl}."
                : $"Cannot reach {ResolvedApiUrl}. For IIS, confirm sites IMSWebAPI and IMSWebApp are started.";
        }
        catch (Exception ex)
        {
            StatusMessage = ex.Message;
        }
        finally
        {
            IsBusy = false;
        }
    }

    private void OpenWebApp()
    {
        var url = ResolvedWebAppUrl;
        if (string.IsNullOrWhiteSpace(url))
            return;

        Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
    }
}
