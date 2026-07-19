using System.Collections.ObjectModel;
using System.IO;
using System.Windows;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using Microsoft.VisualBasic;
using Microsoft.Win32;

namespace IMS.ViewModels;

public sealed class SettingsViewModel : ViewModelBase
{
    public const string PurgeConfirmPhrase = ImsApiClient.PurgeConfirmPhrase;

    private readonly MainViewModel _host;
    private ThemeOptionViewModel? _selectedTheme;
    private PrintFormatOption? _selectedPrintFormat;
    private string _customWidthMm = "210";
    private string _customHeightMm = "148";
    private string _marginMm = "10";
    private string _dataSummaryText = "Connect to the API to see database record counts.";
    private string _dataStatusMessage = string.Empty;
    private bool _suppressApply;
    private bool _suppressPrintApply;
    private bool _isDataBusy;

    private string _editDeletePasswordStatus = "Sign in as an administrator to manage the edit/delete confirmation password.";
    private string _newEditDeletePassword = string.Empty;
    private string _confirmEditDeletePassword = string.Empty;
    private string _securityStatusMessage = string.Empty;
    private bool _isSecurityBusy;
    private bool _suppressSecurityLoad;
    private bool _requireEditDeleteConfirmation = true;
    private string _licenseStatusText = "Sign in as an administrator to manage the software license.";
    private string _licenseExtensionDays = "15";
    private string _licenseExtensionNote = string.Empty;
    private string _licenseActionMessage = string.Empty;
    private bool _isLicenseBusy;
    private int _selectedLicensePlanDays = 30;
    private string _selectedLicenseValidDays = "30";
    private LicenseTypeOption? _selectedLicenseType;
    private string _databaseBackupFolder = string.Empty;
    private ExitBackupPreferenceOption? _selectedExitBackupPreference;
    private string _backupSettingsStatusMessage = string.Empty;
    private bool _suppressBackupSettingsSave;

    public GridColumnSettingsHost GridColumns { get; } = new();
    public SalesPurchaseConfigurationHost SalesPurchase { get; } = new();
    public CommunicationSettingsHost Communication { get; } = new();
    public ApiConnectionSettingsHost ApiConnection { get; } = new();

    public SettingsViewModel(MainViewModel host)
    {
        _host = host;
        PageTitle = "Settings";
        PageDescription = "Application preferences, printing, appearance, and database maintenance.";
        IconGlyph = "\uE713";

        Themes = new ObservableCollection<ThemeOptionViewModel>(
            ThemeService.AllThemes.Select(t => new ThemeOptionViewModel(t)));

        PrintFormats =
        [
            new(PrintPaperFormat.A4, "A4", "210 × 297 mm — standard invoice"),
            new(PrintPaperFormat.A5, "A5", "148 × 210 mm — compact bill"),
            new(PrintPaperFormat.A3, "A3", "297 × 420 mm — large format"),
            new(PrintPaperFormat.Custom, "Custom", "Define your own paper width and height")
        ];

        RefreshDataSummaryCommand = new RelayCommand(() => _ = RefreshDataSummaryAsync(), () => !IsDataBusy);
        DeleteAllDataCommand = new RelayCommand(() => _ = DeleteAllDataAsync(), () => !IsDataBusy);
        UpdateEditDeletePasswordCommand = new RelayCommand(
            () => _ = UpdateEditDeletePasswordAsync(),
            () => CanManageEditDeletePassword && !IsSecurityBusy);
        RenewLicenseCommand = new RelayCommand(
            () => _ = ApplyLicenseAsync(),
            () => CanManageLicense && !IsLicenseBusy);
        ExtendLicenseCommand = new RelayCommand(
            () => _ = ExtendLicenseAsync(),
            () => CanManageLicense && !IsLicenseBusy && IsTrialLicenseSelected);
        ExtendLicenseQuickCommand = new RelayCommand(
            p => _ = ExtendLicenseQuickAsync(p),
            _ => CanManageLicense && !IsLicenseBusy && IsTrialLicenseSelected);
        SelectTrialDaysCommand = new RelayCommand(
            p => SelectTrialDays(p),
            _ => CanManageLicense && IsTrialLicenseSelected);
        BrowseBackupFolderCommand = new RelayCommand(BrowseBackupFolder);

        LicenseTypeOptions =
        [
            new("trial", "Trial", "Time-limited license. Set valid days (e.g. 15, 30, 45) and extend when needed."),
            new("permanent", "Permanent", "No expiry date — full access without renewal.")
        ];
        _selectedLicenseType = LicenseTypeOptions[0];

        ExitBackupPreferenceOptions =
        [
            new(ExitBackupPreference.AlwaysAsk, "Always ask",
                "Show Yes / No / Cancel every time you close the application."),
            new(ExitBackupPreference.AlwaysBackupBeforeExit, "Always backup before exit",
                "Create a backup automatically when closing — no prompt."),
            new(ExitBackupPreference.NeverAskAgain, "Never ask again",
                "Close immediately without prompting or creating a backup.")
        ];

        _suppressApply = true;
        SelectedTheme = Themes.First(t => t.Id == ThemeService.Instance.Current.Id);
        _suppressApply = false;

        LoadPrintSettings();
        LoadBackupSettings();
        _ = RefreshDataSummaryAsync();
        if (CanManageEditDeletePassword)
            _ = RefreshEditDeletePasswordStatusAsync();
        if (CanManageLicense)
            _ = RefreshLicenseStatusAsync();
    }

    public string PageTitle { get; }
    public string PageDescription { get; }
    public string IconGlyph { get; }

    public ObservableCollection<ThemeOptionViewModel> Themes { get; }
    public IReadOnlyList<PrintFormatOption> PrintFormats { get; }

    public string DataSummaryText
    {
        get => _dataSummaryText;
        private set => SetProperty(ref _dataSummaryText, value);
    }

    public string DataStatusMessage
    {
        get => _dataStatusMessage;
        private set => SetProperty(ref _dataStatusMessage, value);
    }

    public bool IsDataBusy
    {
        get => _isDataBusy;
        private set
        {
            if (!SetProperty(ref _isDataBusy, value))
                return;
            (RefreshDataSummaryCommand as RelayCommand)?.RaiseCanExecuteChanged();
            (DeleteAllDataCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }
    }

    public ICommand RefreshDataSummaryCommand { get; }
    public ICommand DeleteAllDataCommand { get; }
    public ICommand UpdateEditDeletePasswordCommand { get; }
    public ICommand RenewLicenseCommand { get; }
    public ICommand ExtendLicenseCommand { get; }
    public ICommand ExtendLicenseQuickCommand { get; }
    public ICommand SelectTrialDaysCommand { get; }
    public ICommand BrowseBackupFolderCommand { get; }

    public IReadOnlyList<ExitBackupPreferenceOption> ExitBackupPreferenceOptions { get; }

    public string DatabaseBackupFolder
    {
        get => _databaseBackupFolder;
        set
        {
            if (!SetProperty(ref _databaseBackupFolder, value))
                return;

            OnPropertyChanged(nameof(ResolvedBackupFolder));
            if (!_suppressBackupSettingsSave)
                SaveBackupSettings();
        }
    }

    public ExitBackupPreferenceOption? SelectedExitBackupPreference
    {
        get => _selectedExitBackupPreference;
        set
        {
            if (!SetProperty(ref _selectedExitBackupPreference, value))
                return;

            OnPropertyChanged(nameof(ResolvedBackupFolder));
            if (!_suppressBackupSettingsSave)
                SaveBackupSettings();
        }
    }

    public string ResolvedBackupFolder =>
        DatabaseBackupSettings.ResolveBackupFolder(new AppSettings
        {
            DatabaseBackupFolder = DatabaseBackupFolder,
            ExitBackupPreference = SelectedExitBackupPreference?.Value ?? ExitBackupPreference.AlwaysAsk
        });

    public string BackupSettingsStatusMessage
    {
        get => _backupSettingsStatusMessage;
        private set => SetProperty(ref _backupSettingsStatusMessage, value);
    }

    public bool CanManageEditDeletePassword => AuthSession.IsAdministrator;

    public bool CanManageLicense => AuthSession.IsAdministrator;

    public IReadOnlyList<int> LicensePlanOptions { get; } = [15, 30, 45];

    public IReadOnlyList<LicenseTypeOption> LicenseTypeOptions { get; }

    public LicenseTypeOption? SelectedLicenseType
    {
        get => _selectedLicenseType;
        set
        {
            if (!SetProperty(ref _selectedLicenseType, value))
                return;
            OnPropertyChanged(nameof(IsTrialLicenseSelected));
            OnPropertyChanged(nameof(IsPermanentLicenseSelected));
            (ExtendLicenseCommand as RelayCommand)?.RaiseCanExecuteChanged();
            (ExtendLicenseQuickCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }
    }

    public bool IsTrialLicenseSelected =>
        string.Equals(SelectedLicenseType?.Value, "trial", StringComparison.OrdinalIgnoreCase);

    public bool IsPermanentLicenseSelected => !IsTrialLicenseSelected;

    public int SelectedLicensePlanDays
    {
        get => _selectedLicensePlanDays;
        set
        {
            if (!SetProperty(ref _selectedLicensePlanDays, value))
                return;
            SelectedLicenseValidDays = value.ToString();
        }
    }

    public string SelectedLicenseValidDays
    {
        get => _selectedLicenseValidDays;
        set => SetProperty(ref _selectedLicenseValidDays, value);
    }

    public string LicenseStatusText
    {
        get => _licenseStatusText;
        private set => SetProperty(ref _licenseStatusText, value);
    }

    public string LicenseExtensionDays
    {
        get => _licenseExtensionDays;
        set => SetProperty(ref _licenseExtensionDays, value);
    }

    public string LicenseExtensionNote
    {
        get => _licenseExtensionNote;
        set => SetProperty(ref _licenseExtensionNote, value);
    }

    public string LicenseActionMessage
    {
        get => _licenseActionMessage;
        private set => SetProperty(ref _licenseActionMessage, value);
    }

    public bool IsLicenseBusy
    {
        get => _isLicenseBusy;
        private set
        {
            if (!SetProperty(ref _isLicenseBusy, value))
                return;
            (RenewLicenseCommand as RelayCommand)?.RaiseCanExecuteChanged();
            (ExtendLicenseCommand as RelayCommand)?.RaiseCanExecuteChanged();
            (ExtendLicenseQuickCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }
    }

    public bool RequireEditDeleteConfirmation
    {
        get => _requireEditDeleteConfirmation;
        set
        {
            if (!SetProperty(ref _requireEditDeleteConfirmation, value) || _suppressSecurityLoad)
                return;

            _ = SaveConfirmationRequiredAsync(value);
        }
    }

    public string EditDeletePasswordStatus
    {
        get => _editDeletePasswordStatus;
        private set => SetProperty(ref _editDeletePasswordStatus, value);
    }

    public string NewEditDeletePassword
    {
        get => _newEditDeletePassword;
        set => SetProperty(ref _newEditDeletePassword, value);
    }

    public string ConfirmEditDeletePassword
    {
        get => _confirmEditDeletePassword;
        set => SetProperty(ref _confirmEditDeletePassword, value);
    }

    public string SecurityStatusMessage
    {
        get => _securityStatusMessage;
        private set => SetProperty(ref _securityStatusMessage, value);
    }

    public bool IsSecurityBusy
    {
        get => _isSecurityBusy;
        private set
        {
            if (!SetProperty(ref _isSecurityBusy, value))
                return;
            (UpdateEditDeletePasswordCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }
    }

    public ThemeOptionViewModel? SelectedTheme
    {
        get => _selectedTheme;
        set
        {
            if (!SetProperty(ref _selectedTheme, value) || value is null || _suppressApply)
                return;

            ThemeService.Instance.ApplyTheme(value.Id);
        }
    }

    public PrintFormatOption? SelectedPrintFormat
    {
        get => _selectedPrintFormat;
        set
        {
            if (!SetProperty(ref _selectedPrintFormat, value) || value is null)
                return;

            OnPropertyChanged(nameof(IsCustomFormat));
            OnPropertyChanged(nameof(PrintFormatSummary));
            if (!_suppressPrintApply)
                SavePrintSettings();
        }
    }

    public bool IsCustomFormat => SelectedPrintFormat?.Format == PrintPaperFormat.Custom;

    public string CustomWidthMm
    {
        get => _customWidthMm;
        set
        {
            if (!SetProperty(ref _customWidthMm, value))
                return;

            OnPropertyChanged(nameof(PrintFormatSummary));
            if (!_suppressPrintApply)
                SavePrintSettings();
        }
    }

    public string CustomHeightMm
    {
        get => _customHeightMm;
        set
        {
            if (!SetProperty(ref _customHeightMm, value))
                return;

            OnPropertyChanged(nameof(PrintFormatSummary));
            if (!_suppressPrintApply)
                SavePrintSettings();
        }
    }

    public string MarginMm
    {
        get => _marginMm;
        set
        {
            if (!SetProperty(ref _marginMm, value))
                return;

            if (!_suppressPrintApply)
                SavePrintSettings();
        }
    }

    public string ActiveThemeSummary =>
        $"Active theme: {ThemeService.Instance.Current.DisplayName}";

    public string PrintFormatSummary => PrintSettingsService.Instance.PageSizeSummary;

    public void SyncSelectedTheme()
    {
        var match = Themes.FirstOrDefault(t => t.Id == ThemeService.Instance.Current.Id);
        if (match is null)
            return;

        _suppressApply = true;
        SelectedTheme = match;
        _suppressApply = false;
        OnPropertyChanged(nameof(ActiveThemeSummary));
    }

    private async Task RefreshLicenseStatusAsync()
    {
        if (!CanManageLicense || !IsUiAvailable)
            return;

        IsLicenseBusy = true;
        LicenseActionMessage = string.Empty;
        try
        {
            if (!await ImsApiClient.CheckHealthAsync())
            {
                LicenseStatusText = "API is offline. Start the API to view license status.";
                return;
            }

            var status = await ImsApiClient.GetSoftwareLicenseAdminDetailsAsync();
            if (status is null)
            {
                LicenseStatusText = "Could not load software license status.";
                return;
            }

            SelectedLicensePlanDays = LicensePlanOptions.Contains(status.PlanDays)
                ? status.PlanDays
                : status.PlanDays > 0 ? status.PlanDays : 30;
            SelectedLicenseValidDays = status.PlanDays > 0
                ? status.PlanDays.ToString()
                : SelectedLicensePlanDays.ToString();

            var typeValue = string.IsNullOrWhiteSpace(status.LicenseType) ? "trial" : status.LicenseType;
            SelectedLicenseType = LicenseTypeOptions.FirstOrDefault(
                option => string.Equals(option.Value, typeValue, StringComparison.OrdinalIgnoreCase))
                ?? LicenseTypeOptions[0];

            if (status.IsPermanent)
            {
                LicenseStatusText = $"{status.Message} Activated {FormatLicenseDate(status.ActivatedAt)}.";
                return;
            }

            var expiry = FormatLicenseDate(status.ExpiresAt);
            var activated = FormatLicenseDate(status.ActivatedAt);
            var extensions = status.TotalExtensionDays > 0
                ? $" Total extensions: {status.TotalExtensionDays} day(s)."
                : string.Empty;

            LicenseStatusText = status.IsExpired
                ? $"Trial license expired on {expiry}. Valid days: {status.PlanDays} (activated {activated}).{extensions} Apply a new trial or switch to permanent below."
                : $"{status.Message} Valid days: {status.PlanDays} (activated {activated}).{extensions}";
        }
        catch (Exception ex)
        {
            LicenseStatusText = "Failed to load software license status.";
            LicenseActionMessage = ex.Message;
        }
        finally
        {
            if (IsUiAvailable)
                IsLicenseBusy = false;
        }
    }

    private static string FormatLicenseDate(string? iso) =>
        DateTime.TryParse(iso, out var value) ? value.ToString("dd MMM yyyy") : "—";

    private async Task ApplyLicenseAsync()
    {
        if (!CanManageLicense || !IsUiAvailable)
            return;

        var licenseType = SelectedLicenseType?.Value ?? "trial";
        if (!await ImsApiClient.CheckHealthAsync())
        {
            LicenseActionMessage = "API is offline. Start the API before applying the license.";
            return;
        }

        int? planDays = null;
        if (string.Equals(licenseType, "trial", StringComparison.OrdinalIgnoreCase))
        {
            if (!int.TryParse(SelectedLicenseValidDays?.Trim(), out var days) || days < 1)
            {
                LicenseActionMessage = "Enter valid days as a positive number for the trial license.";
                return;
            }

            planDays = days;
        }

        IsLicenseBusy = true;
        LicenseActionMessage = string.Empty;
        try
        {
            await ImsApiClient.SetSoftwareLicenseAsync(licenseType, planDays);
            LicenseActionMessage = string.Equals(licenseType, "permanent", StringComparison.OrdinalIgnoreCase)
                ? "Permanent license applied."
                : $"Trial license applied for {planDays} day(s).";
            await RefreshLicenseStatusAsync();
        }
        catch (Exception ex)
        {
            LicenseActionMessage = ex.Message;
        }
        finally
        {
            if (IsUiAvailable)
                IsLicenseBusy = false;
        }
    }

    private async Task ExtendLicenseAsync()
    {
        if (!CanManageLicense || !IsUiAvailable || !IsTrialLicenseSelected)
            return;

        if (!int.TryParse(LicenseExtensionDays?.Trim(), out var days) || days < 1)
        {
            LicenseActionMessage = "Enter extension days as a positive number.";
            return;
        }

        if (!await ImsApiClient.CheckHealthAsync())
        {
            LicenseActionMessage = "API is offline. Start the API before extending the license.";
            return;
        }

        IsLicenseBusy = true;
        LicenseActionMessage = string.Empty;
        try
        {
            await ImsApiClient.ExtendSoftwareLicenseAsync(days, LicenseExtensionNote?.Trim());
            LicenseActionMessage = $"Trial license extended by {days} day(s).";
            LicenseExtensionNote = string.Empty;
            await RefreshLicenseStatusAsync();
        }
        catch (Exception ex)
        {
            LicenseActionMessage = ex.Message;
        }
        finally
        {
            if (IsUiAvailable)
                IsLicenseBusy = false;
        }
    }

    private Task ExtendLicenseQuickAsync(object? parameter)
    {
        var days = parameter switch
        {
            int value => value,
            string text when int.TryParse(text, out var parsed) => parsed,
            _ => 0
        };
        if (days < 1)
            return Task.CompletedTask;

        LicenseExtensionDays = days.ToString();
        return ExtendLicenseAsync();
    }

    private void SelectTrialDays(object? parameter)
    {
        var days = parameter switch
        {
            int value => value,
            string text when int.TryParse(text, out var parsed) => parsed,
            _ => 0
        };
        if (days < 1)
            return;

        SelectedLicensePlanDays = days;
        SelectedLicenseValidDays = days.ToString();
    }

    private async Task RefreshEditDeletePasswordStatusAsync()
    {
        if (!CanManageEditDeletePassword || !IsUiAvailable)
            return;

        IsSecurityBusy = true;
        SecurityStatusMessage = string.Empty;
        try
        {
            if (!await ImsApiClient.CheckHealthAsync())
            {
                EditDeletePasswordStatus = "API is offline. Start the API to view confirmation password settings.";
                return;
            }

            var status = await ImsApiClient.GetEditDeletePasswordStatusAsync();
            if (status is null)
            {
                EditDeletePasswordStatus = "Could not load confirmation password status.";
                return;
            }

            _suppressSecurityLoad = true;
            RequireEditDeleteConfirmation = status.ConfirmationRequired;
            _suppressSecurityLoad = false;

            var updated = string.IsNullOrWhiteSpace(status.UpdatedAt)
                ? "unknown time"
                : status.UpdatedAt;
            var by = string.IsNullOrWhiteSpace(status.UpdatedBy) ? "system" : status.UpdatedBy;
            var mode = status.ConfirmationRequired
                ? "Password is required on every edit and delete across all pages."
                : "Password prompt is off — edit and delete work without confirmation.";
            EditDeletePasswordStatus = status.Configured
                ? $"{mode} Password last updated {updated} by {by}."
                : $"{mode} Confirmation password is not configured yet.";
        }
        catch (Exception ex)
        {
            EditDeletePasswordStatus = "Failed to load confirmation password status.";
            SecurityStatusMessage = ex.Message;
        }
        finally
        {
            if (IsUiAvailable)
                IsSecurityBusy = false;
        }
    }

    private async Task SaveConfirmationRequiredAsync(bool required)
    {
        if (!CanManageEditDeletePassword || !IsUiAvailable)
            return;

        if (!await ImsApiClient.CheckHealthAsync())
        {
            SecurityStatusMessage = "API is offline. Could not save confirmation setting.";
            _suppressSecurityLoad = true;
            RequireEditDeleteConfirmation = !required;
            _suppressSecurityLoad = false;
            return;
        }

        IsSecurityBusy = true;
        SecurityStatusMessage = string.Empty;
        try
        {
            await ImsApiClient.UpdateEditDeleteSecuritySettingsAsync(confirmationRequired: required);
            SecurityStatusMessage = required
                ? "Confirmation password is now required for all edit and delete actions."
                : "Confirmation password prompt is disabled. Edit and delete will not ask for a password.";
            await RefreshEditDeletePasswordStatusAsync();
        }
        catch (Exception ex)
        {
            SecurityStatusMessage = ex.Message;
            _suppressSecurityLoad = true;
            RequireEditDeleteConfirmation = !required;
            _suppressSecurityLoad = false;
        }
        finally
        {
            if (IsUiAvailable)
                IsSecurityBusy = false;
        }
    }

    private async Task UpdateEditDeletePasswordAsync()
    {
        if (!CanManageEditDeletePassword || !IsUiAvailable)
            return;

        var password = NewEditDeletePassword?.Trim() ?? string.Empty;
        var confirm = ConfirmEditDeletePassword?.Trim() ?? string.Empty;

        if (password.Length < 6)
        {
            SecurityStatusMessage = "Password must be at least 6 characters.";
            return;
        }

        if (!string.Equals(password, confirm, StringComparison.Ordinal))
        {
            SecurityStatusMessage = "Password and confirmation do not match.";
            return;
        }

        if (!await ImsApiClient.CheckHealthAsync())
        {
            SecurityStatusMessage = "API is offline. Start the API before updating the password.";
            return;
        }

        IsSecurityBusy = true;
        SecurityStatusMessage = string.Empty;
        try
        {
            await ImsApiClient.UpdateEditDeleteSecuritySettingsAsync(newPassword: password);
            NewEditDeletePassword = string.Empty;
            ConfirmEditDeletePassword = string.Empty;
            SecurityStatusMessage = "Edit/delete confirmation password updated successfully.";
            EditDeleteGuard.InvalidatePolicyCache();
            await RefreshEditDeletePasswordStatusAsync();
        }
        catch (Exception ex)
        {
            SecurityStatusMessage = ex.Message;
        }
        finally
        {
            if (IsUiAvailable)
                IsSecurityBusy = false;
        }
    }

    private async Task RefreshDataSummaryAsync()
    {
        if (!IsUiAvailable)
            return;

        IsDataBusy = true;
        DataStatusMessage = string.Empty;
        try
        {
            if (!await ImsApiClient.CheckHealthAsync())
            {
                DataSummaryText = "API is offline. Start the API to view or delete database records.";
                return;
            }

            var summary = await ImsApiClient.GetDataSummaryAsync();
            if (summary is null)
            {
                DataSummaryText = "Could not load database summary.";
                return;
            }

            var lines = summary.Collections
                .Where(c => c.Value.Count > 0)
                .OrderByDescending(c => c.Value.Count)
                .Select(c => $"• {c.Value.Label}: {c.Value.Count:N0}")
                .ToList();

            DataSummaryText = lines.Count > 0
                ? $"Total records in database: {summary.TotalRecords:N0}\n\n" + string.Join("\n", lines)
                : "Database is empty — no business records found.";
        }
        catch (ApiException ex) when (ex.Message.Contains("404", StringComparison.Ordinal))
        {
            DataSummaryText = "Delete-all-data API is not available on the running server.";
            DataStatusMessage = "Restart the API: open a terminal in the api folder and run npm run dev:once";
        }
        catch (Exception ex)
        {
            DataSummaryText = "Failed to load database summary.";
            DataStatusMessage = ex.Message;
        }
        finally
        {
            if (IsUiAvailable)
                IsDataBusy = false;
        }
    }

    private async Task DeleteAllDataAsync()
    {
        if (!IsUiAvailable)
            return;

        if (!await ImsApiClient.CheckHealthAsync())
        {
            MessageBox.Show(
                Application.Current?.MainWindow,
                "Cannot reach the API. Start the API before deleting data.",
                "API Offline",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return;
        }

        var warning = MessageBox.Show(
            Application.Current?.MainWindow,
            "This permanently deletes ALL data in the IMS MongoDB database:\n\n" +
            "• Products, accounts, warehouses, masters\n" +
            "• Sales & purchase documents (orders, invoices, GRN, returns)\n" +
            "• Vouchers, cash/bank entries, company profile, users\n" +
            "• Document number counters\n\n" +
            "This cannot be undone. Continue?",
            "Delete all data",
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning,
            MessageBoxResult.No);

        if (warning != MessageBoxResult.Yes)
            return;

        var typed = Interaction.InputBox(
            $"Type exactly:\n{PurgeConfirmPhrase}",
            "Confirm delete all data",
            string.Empty);

        if (!string.Equals(typed.Trim(), PurgeConfirmPhrase, StringComparison.Ordinal))
        {
            DataStatusMessage = "Delete cancelled — confirmation phrase did not match.";
            return;
        }

        IsDataBusy = true;
        try
        {
            var result = await ImsApiClient.DeleteAllDataAsync(PurgeConfirmPhrase);
            if (result is null)
            {
                DataStatusMessage = "Delete failed — no response from API.";
                return;
            }

            DataStatusMessage = $"{result.Message} ({result.TotalDeleted:N0} records removed.)";
            DataSummaryText = "Database is empty — no business records found.";

            MessageBox.Show(
                Application.Current?.MainWindow,
                $"{result.Message}\n\n{result.TotalDeleted:N0} records were deleted.\n\n" +
                "Run npm run seed in the api folder if you want sample data again.",
                "Delete complete",
                MessageBoxButton.OK,
                MessageBoxImage.Information);

            _host.NavigateByKey(NavKeys.Dashboard);
        }
        catch (ApiException ex) when (ex.Message.Contains("404", StringComparison.Ordinal))
        {
            DataStatusMessage = "API returned Not Found. Restart the API (npm run dev:once in the api folder), then try again.";
            MessageBox.Show(
                Application.Current?.MainWindow,
                "The delete-all-data endpoint was not found.\n\n" +
                "Stop any old API process and restart:\n" +
                "  cd api\n" +
                "  npm run dev:once\n\n" +
                "Then open Settings and try again.",
                "Restart API required",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
        }
        catch (Exception ex)
        {
            DataStatusMessage = $"Delete failed: {ex.Message}";
        }
        finally
        {
            if (IsUiAvailable)
                IsDataBusy = false;
        }
    }

    private void LoadPrintSettings()
    {
        var print = PrintSettingsService.Instance.Current;

        _suppressPrintApply = true;
        SelectedPrintFormat = PrintFormats.First(f => f.Format == print.PaperFormat);
        CustomWidthMm = print.CustomWidthMm.ToString("0.#");
        CustomHeightMm = print.CustomHeightMm.ToString("0.#");
        MarginMm = print.MarginMm.ToString("0.#");
        _suppressPrintApply = false;
        OnPropertyChanged(nameof(PrintFormatSummary));
    }

    private void LoadBackupSettings()
    {
        var settings = SettingsStore.Load();
        _suppressBackupSettingsSave = true;
        DatabaseBackupFolder = string.IsNullOrWhiteSpace(settings.DatabaseBackupFolder)
            ? DatabaseBackupSettings.DefaultBackupFolder
            : settings.DatabaseBackupFolder.Trim();
        SelectedExitBackupPreference = ExitBackupPreferenceOptions.First(o => o.Value == settings.ExitBackupPreference);
        _suppressBackupSettingsSave = false;
        OnPropertyChanged(nameof(ResolvedBackupFolder));
    }

    private void SaveBackupSettings()
    {
        try
        {
            var folder = DatabaseBackupFolder.Trim();
            if (!string.IsNullOrWhiteSpace(folder))
                DatabaseBackupService.EnsureWritableBackupFolder(folder);

            SettingsStore.Update(s =>
            {
                s.DatabaseBackupFolder = folder;
                s.ExitBackupPreference = SelectedExitBackupPreference?.Value ?? ExitBackupPreference.AlwaysAsk;
            });
            BackupSettingsStatusMessage = "Backup settings saved.";
        }
        catch (Exception ex)
        {
            BackupSettingsStatusMessage = ex.Message;
        }
    }

    private void BrowseBackupFolder()
    {
        var dialog = new OpenFolderDialog
        {
            Title = "Select database backup folder",
            InitialDirectory = Directory.Exists(ResolvedBackupFolder)
                ? ResolvedBackupFolder
                : DatabaseBackupSettings.DefaultBackupFolder
        };

        if (dialog.ShowDialog() != true)
            return;

        DatabaseBackupFolder = dialog.FolderName;
    }

    private void SavePrintSettings()
    {
        if (SelectedPrintFormat is null)
            return;

        if (!double.TryParse(CustomWidthMm, out var customW))
            customW = 210;
        if (!double.TryParse(CustomHeightMm, out var customH))
            customH = 148;
        if (!double.TryParse(MarginMm, out var margin))
            margin = 10;

        PrintSettingsService.Instance.Apply(new SalesOrderPrintSettings
        {
            PaperFormat = SelectedPrintFormat.Format,
            CustomWidthMm = customW,
            CustomHeightMm = customH,
            MarginMm = margin
        });
        OnPropertyChanged(nameof(PrintFormatSummary));
    }
}

public sealed class ThemeOptionViewModel
{
    public ThemeOptionViewModel(ThemeDefinition definition)
    {
        Id = definition.Id;
        DisplayName = definition.DisplayName;
        Description = definition.Description;
        PreviewColor = definition.Palette.Primary;
    }

    public AppThemeId Id { get; }
    public string DisplayName { get; }
    public string Description { get; }
    public string PreviewColor { get; }
}

public sealed class PrintFormatOption(PrintPaperFormat format, string displayName, string description)
{
    public PrintPaperFormat Format { get; } = format;
    public string DisplayName { get; } = displayName;
    public string Description { get; } = description;
}

public sealed class ExitBackupPreferenceOption(ExitBackupPreference value, string displayName, string description)
{
    public ExitBackupPreference Value { get; } = value;
    public string DisplayName { get; } = displayName;
    public string Description { get; } = description;
}

public sealed class LicenseTypeOption(string value, string displayName, string description)
{
    public string Value { get; } = value;
    public string DisplayName { get; } = displayName;
    public string Description { get; } = description;
}
