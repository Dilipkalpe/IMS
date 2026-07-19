using System.IO;
using System.Net.Http;
using System.Net.Sockets;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;
using System.Collections.ObjectModel;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels;

public sealed class LoginViewModel : ViewModelBase
{
    private string _loginId = string.Empty;
    private string _password = string.Empty;
    private bool _rememberMe;
    private bool _showPassword;
    private bool _isDarkMode;
    private bool _isLoggingIn;
    private string? _errorMessage;
    private string _companyName = "your enterprise workspace";
    private string _companyTagline =
        "Inventory, billing, production, and finance — unified in one intelligent ERP.";
    private ObservableCollection<FinancialYearDto> _financialYears = [];
    private FinancialYearDto? _selectedFinancialYear;
    private bool _isLoadingFinancialYears = true;
    private bool _isApiConnected;
    private string? _licenseStatusMessage;
    private bool _showLicenseNotice;

    public LoginViewModel()
    {
        var settings = SettingsStore.Load();
        if (settings.RememberLogin && !string.IsNullOrWhiteSpace(settings.RememberedLoginId))
        {
            _loginId = settings.RememberedLoginId;
            _rememberMe = true;
        }

        _isDarkMode = settings.LoginDarkMode;

        LoginCommand = new RelayCommand(() => _ = LoginAsync(), () => IsInputEnabled);
        TogglePasswordCommand = new RelayCommand(() => ShowPassword = !ShowPassword);
        ToggleDarkModeCommand = new RelayCommand(() => IsDarkMode = !IsDarkMode);

        OnPropertyChanged(nameof(ApiLinkDisplay));
        OnPropertyChanged(nameof(DbNameDisplay));
        _ = LoadFinancialYearsAsync();
    }

    public string LoginId
    {
        get => _loginId;
        set
        {
            if (SetProperty(ref _loginId, value))
                ClearError();
        }
    }

    public string Password
    {
        get => _password;
        set
        {
            if (SetProperty(ref _password, value))
                ClearError();
        }
    }

    public bool RememberMe
    {
        get => _rememberMe;
        set => SetProperty(ref _rememberMe, value);
    }

    public bool ShowPassword
    {
        get => _showPassword;
        set
        {
            if (SetProperty(ref _showPassword, value))
                OnPropertyChanged(nameof(PasswordRevealGlyph));
        }
    }

    public string PasswordRevealGlyph => ShowPassword ? "\uED1A" : "\uE7B3";

    public bool IsDarkMode
    {
        get => _isDarkMode;
        set
        {
            if (!SetProperty(ref _isDarkMode, value))
                return;
            OnPropertyChanged(nameof(DarkModeToggleLabel));
            SettingsStore.Update(s => s.LoginDarkMode = value);
            DarkModeChanged?.Invoke(this, EventArgs.Empty);
        }
    }

    public bool IsLoggingIn
    {
        get => _isLoggingIn;
        private set
        {
            if (SetProperty(ref _isLoggingIn, value))
            {
                OnPropertyChanged(nameof(IsInputEnabled));
                (LoginCommand as RelayCommand)?.RaiseCanExecuteChanged();
            }
        }
    }

    public bool IsInputEnabled => !IsLoggingIn && !_isLoadingFinancialYears && FinancialYears.Count > 0;

    public string DarkModeToggleLabel => IsDarkMode ? "Light mode" : "Dark mode";

    public string? ErrorMessage
    {
        get => _errorMessage;
        private set
        {
            SetProperty(ref _errorMessage, value);
            OnPropertyChanged(nameof(HasError));
        }
    }

    public bool HasError => !string.IsNullOrWhiteSpace(ErrorMessage);

    public string? LicenseStatusMessage
    {
        get => _licenseStatusMessage;
        private set
        {
            if (SetProperty(ref _licenseStatusMessage, value))
                OnPropertyChanged(nameof(ShowLicenseNotice));
        }
    }

    public bool ShowLicenseNotice =>
        ShowLicenseNoticeCore && !string.IsNullOrWhiteSpace(LicenseStatusMessage);

    private bool ShowLicenseNoticeCore
    {
        get => _showLicenseNotice;
        set
        {
            if (SetProperty(ref _showLicenseNotice, value))
                OnPropertyChanged(nameof(ShowLicenseNotice));
        }
    }

    public string CompanyName
    {
        get => _companyName;
        private set => SetProperty(ref _companyName, value);
    }

    public string CompanyTagline
    {
        get => _companyTagline;
        private set => SetProperty(ref _companyTagline, value);
    }

    public bool IsApiConnected
    {
        get => _isApiConnected;
        private set
        {
            if (!SetProperty(ref _isApiConnected, value))
                return;
            OnPropertyChanged(nameof(ApiStatusText));
            OnPropertyChanged(nameof(ApiLinkDisplay));
        }
    }

    public string ApiStatusText => IsApiConnected ? "API Connected" : "API Not Connected";

    public string ConnectionProfileDisplay
    {
        get
        {
            ApiConfiguration.LoadFromSettings();
            return ApiEndpointProfiles.All.FirstOrDefault(p =>
                string.Equals(p.Id, ApiConfiguration.EndpointProfileId, StringComparison.OrdinalIgnoreCase))?.DisplayName
                ?? "Online API (production)";
        }
    }

    public ObservableCollection<FinancialYearDto> FinancialYears
    {
        get => _financialYears;
        private set
        {
            if (SetProperty(ref _financialYears, value))
            {
                OnPropertyChanged(nameof(IsInputEnabled));
                (LoginCommand as RelayCommand)?.RaiseCanExecuteChanged();
            }
        }
    }

    public FinancialYearDto? SelectedFinancialYear
    {
        get => _selectedFinancialYear;
        set
        {
            if (SetProperty(ref _selectedFinancialYear, value))
            {
                ClearError();
                OnPropertyChanged(nameof(DbNameDisplay));
            }
        }
    }

    public string ApiLinkDisplay
    {
        get
        {
            ApiConfiguration.LoadFromSettings();
            return ApiConfiguration.BaseUrl;
        }
    }

    public string DbNameDisplay =>
        string.IsNullOrWhiteSpace(SelectedFinancialYear?.DatabaseName)
            ? "—"
            : SelectedFinancialYear.DatabaseName.Trim();

    public ICommand LoginCommand { get; }
    public ICommand TogglePasswordCommand { get; }
    public ICommand ToggleDarkModeCommand { get; }

    public event EventHandler? LoginSucceeded;
    public event EventHandler? DarkModeChanged;

    private void ClearError() => ErrorMessage = null;

    private static bool IsLicenseExpiredApiError(string message) =>
        message.Contains("license", StringComparison.OrdinalIgnoreCase)
        && message.Contains("expir", StringComparison.OrdinalIgnoreCase);

    private static string StripHttpStatusPrefix(string message) =>
        System.Text.RegularExpressions.Regex.Replace(message.Trim(), @"^\d{3}\s+", string.Empty);

    private static string FormatLoginApiError(string message) => StripHttpStatusPrefix(message);

    private static bool IsNetworkFailure(Exception ex)
    {
        for (var current = ex; current is not null; current = current.InnerException)
        {
            if (current is HttpRequestException or IOException or SocketException)
                return true;
            if (current is TaskCanceledException tce && !tce.CancellationToken.IsCancellationRequested)
                return true;
        }

        return false;
    }

    public void PrepareLogin(string loginId, string password)
    {
        LoginId = loginId;
        Password = password;
    }

    private async Task LoginAsync()
    {
        ErrorMessage = null;

        if (string.IsNullOrWhiteSpace(LoginId))
        {
            ErrorMessage = "Enter your employee ID or email address.";
            return;
        }

        if (string.IsNullOrWhiteSpace(Password))
        {
            ErrorMessage = "Enter your password.";
            return;
        }

        if (SelectedFinancialYear is null)
        {
            ErrorMessage = "Select a financial year.";
            return;
        }

        IsLoggingIn = true;
        try
        {
            ApiConfiguration.LoadFromSettings();
            ImsApiClient.Initialize();

            var available = await ImsApiClient.CheckHealthAsync();
            IsApiConnected = available;
            if (!available)
            {
                ErrorMessage =
                    $"Cannot reach the API at {ApiConfiguration.BaseUrl}. " +
                    "Check Settings → API connection (use IIS — IMSWebAPI if deployed on IIS) or start the local API.";
                return;
            }

            var response = await ImsApiClient.LoginAsync(LoginId.Trim(), Password, SelectedFinancialYear.Id);
            AuthSession.Set(response);
            EditDeleteGuard.InvalidatePolicyCache();
            _ = GridColumnPreferenceService.PreloadAllModulesAsync();

            if (!string.IsNullOrWhiteSpace(response.Company?.BusinessName))
                CompanyName = response.Company.BusinessName;
            if (!string.IsNullOrWhiteSpace(response.Company?.Tagline))
                CompanyTagline = response.Company.Tagline;

            SettingsStore.Update(s =>
            {
                s.RememberLogin = RememberMe;
                s.RememberedLoginId = RememberMe ? LoginId.Trim() : null;
            });

            if (IsDarkMode)
                ThemeService.Instance.ApplyTheme(AppThemeId.MidnightIndigo, persist: false);

            RaiseLoginSucceeded();
        }
        catch (Exception ex)
        {
            if (IsNetworkFailure(ex))
            {
                IsApiConnected = false;
                ErrorMessage =
                    $"Cannot reach the API at {ApiConfiguration.BaseUrl}. " +
                    "Check Settings → API connection or confirm IIS site IMSWebAPI is running.";
            }
            else if (ex is ApiException apiEx)
            {
                ErrorMessage = FormatLoginApiError(apiEx.Message);
                if (IsLicenseExpiredApiError(apiEx.Message))
                {
                    ShowLicenseNoticeCore = true;
                    LicenseStatusMessage =
                        StripHttpStatusPrefix(apiEx.Message) +
                        " Only an administrator can sign in to renew or extend the license.";
                }
            }
            else
            {
                ErrorMessage = ex.Message;
            }
        }
        finally
        {
            IsLoggingIn = false;
        }
    }

    private void RaiseLoginSucceeded()
    {
        var dispatcher = Application.Current?.Dispatcher;
        if (dispatcher is null || dispatcher.CheckAccess())
        {
            LoginSucceeded?.Invoke(this, EventArgs.Empty);
            return;
        }

        dispatcher.Invoke(() => LoginSucceeded?.Invoke(this, EventArgs.Empty), DispatcherPriority.Normal);
    }

    private async Task LoadFinancialYearsAsync()
    {
        _isLoadingFinancialYears = true;
        OnPropertyChanged(nameof(IsInputEnabled));
        try
        {
            ApiConfiguration.LoadFromSettings();
            ImsApiClient.Initialize();

            var ok = await ImsApiClient.CheckHealthAsync();
            IsApiConnected = ok;
            if (!ok)
                return;

            await LoadLicenseStatusAsync();

            var years = await ImsApiClient.GetFinancialYearsAsync();
            var active = years.Where(y => y.IsActive).ToList();
            await Application.Current.Dispatcher.InvokeAsync(() =>
            {
                FinancialYears = new ObservableCollection<FinancialYearDto>(active);
                SelectedFinancialYear = FinancialYears.LastOrDefault();
                OnPropertyChanged(nameof(ApiLinkDisplay));
                OnPropertyChanged(nameof(ConnectionProfileDisplay));
                OnPropertyChanged(nameof(DbNameDisplay));
            }, DispatcherPriority.Background);
        }
        catch
        {
            IsApiConnected = false;
            // Ignore — login will surface API connectivity errors.
        }
        finally
        {
            _isLoadingFinancialYears = false;
            OnPropertyChanged(nameof(IsInputEnabled));
            (LoginCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }
    }

    private async Task LoadLicenseStatusAsync()
    {
        try
        {
            var license = await ImsApiClient.GetSoftwareLicenseStatusAsync();
            if (license is null)
            {
                LicenseStatusMessage = null;
                ShowLicenseNoticeCore = false;
                return;
            }

            if (license.IsPermanent)
            {
                LicenseStatusMessage = null;
                ShowLicenseNoticeCore = false;
                return;
            }

            if (license.IsExpired)
            {
                LicenseStatusMessage =
                    $"{license.Message} Only an administrator can sign in to renew or extend the license.";
                ShowLicenseNoticeCore = true;
                return;
            }

            if (license.IsExpiringSoon)
            {
                LicenseStatusMessage = license.Message;
                ShowLicenseNoticeCore = true;
                return;
            }

            LicenseStatusMessage = null;
            ShowLicenseNoticeCore = false;
        }
        catch
        {
            LicenseStatusMessage = null;
            ShowLicenseNoticeCore = false;
        }
    }
}
