using System.Collections.ObjectModel;
using System.Windows.Input;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.ViewModels;

public sealed class GridColumnSettingsHost : ViewModelBase
{
    private string _selectedModuleKey = "sales_order";
    private string _statusMessage = string.Empty;
    private bool _isBusy;
    private bool _suppressColumnEvents;

    public GridColumnSettingsHost()
    {
        ColumnOptions = new ObservableCollection<GridColumnOptionViewModel>();
        ResetGridColumnsCommand = new RelayCommand(() => _ = ResetSelectedModuleAsync(), () => !IsBusy);
        SaveAsGlobalDefaultCommand = new RelayCommand(
            () => _ = SaveGlobalDefaultAsync(),
            () => AuthSession.IsAdministrator && !IsBusy);
        ResetGlobalDefaultCommand = new RelayCommand(
            () => _ = ResetGlobalDefaultAsync(),
            () => AuthSession.IsAdministrator && !IsBusy);

        _ = InitializeAsync();
    }

    private async Task InitializeAsync()
    {
        await LoadModuleChoicesFromApiAsync();
        _selectedModule = ModuleChoices.FirstOrDefault(m => m.Key == _selectedModuleKey)
                          ?? ModuleChoices.FirstOrDefault();
        if (_selectedModule is not null)
            _selectedModuleKey = _selectedModule.Key;
        OnPropertyChanged(nameof(SelectedModule));
        OnPropertyChanged(nameof(SelectedModuleKey));
        OnPropertyChanged(nameof(SelectedModuleTitle));
        await LoadModuleAsync(_selectedModuleKey);
    }

    public ObservableCollection<GridColumnModuleChoice> ModuleChoices { get; } = [];

    public ObservableCollection<GridColumnOptionViewModel> ColumnOptions { get; }

    public bool CanManageGlobalDefaults => AuthSession.IsAdministrator;

    private GridColumnModuleChoice? _selectedModule;

    public GridColumnModuleChoice? SelectedModule
    {
        get => _selectedModule;
        set
        {
            if (!SetProperty(ref _selectedModule, value) || value is null)
                return;

            SelectedModuleKey = value.Key;
        }
    }

    public string SelectedModuleKey
    {
        get => _selectedModuleKey;
        set
        {
            if (!SetProperty(ref _selectedModuleKey, value))
                return;

            _selectedModule = ModuleChoices.FirstOrDefault(m => m.Key == value);
            OnPropertyChanged(nameof(SelectedModule));
            OnPropertyChanged(nameof(SelectedModuleTitle));

            _ = LoadModuleAsync(value);
        }
    }

    public string SelectedModuleTitle => SelectedModule?.Title ?? SelectedModuleKey;

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

            (ResetGridColumnsCommand as RelayCommand)?.RaiseCanExecuteChanged();
            (SaveAsGlobalDefaultCommand as RelayCommand)?.RaiseCanExecuteChanged();
            (ResetGlobalDefaultCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }
    }

    public ICommand ResetGridColumnsCommand { get; }
    public ICommand SaveAsGlobalDefaultCommand { get; }
    public ICommand ResetGlobalDefaultCommand { get; }

    private static string NormalizeModuleKey(string? moduleKey) =>
        string.IsNullOrWhiteSpace(moduleKey)
            ? "sales_order"
            : moduleKey.Trim().ToLowerInvariant();

    private static string FormatApiError(Exception ex) =>
        ex.Message.Contains("Invalid module key", StringComparison.OrdinalIgnoreCase)
            ? "This module is not supported by the running API. Stop the API process and restart: cd api, then npm run dev:once"
            : ex.Message;

    private async Task LoadModuleChoicesFromApiAsync()
    {
        ModuleChoices.Clear();

        if (AuthSession.IsAuthenticated && await ImsApiClient.CheckHealthAsync())
        {
            try
            {
                var response = await ImsApiClient.GetGridColumnModulesAsync();
                if (response?.Modules is { Count: > 0 })
                {
                    foreach (var module in response.Modules)
                    {
                        if (string.IsNullOrWhiteSpace(module.Key))
                            continue;
                        ModuleChoices.Add(new GridColumnModuleChoice(
                            NormalizeModuleKey(module.Key),
                            string.IsNullOrWhiteSpace(module.Title)
                                ? SalesGridColumnCatalog.GetModuleTitle(module.Key)
                                : module.Title));
                    }

                    return;
                }
            }
            catch
            {
                // Fall back to local catalog below.
            }
        }

        foreach (var key in SalesGridColumnCatalog.AllModuleKeys)
            ModuleChoices.Add(new GridColumnModuleChoice(key, SalesGridColumnCatalog.GetModuleTitle(key)));
    }

    private async Task LoadModuleAsync(string moduleKey)
    {
        if (!IsUiAvailable)
            return;

        moduleKey = NormalizeModuleKey(moduleKey);
        IsBusy = true;
        StatusMessage = string.Empty;
        try
        {
            if (!AuthSession.IsAuthenticated)
            {
                StatusMessage = "Sign in to manage column visibility.";
                PopulateFromKeys(SalesGridColumnCatalog.GetDefaultVisibleKeys(moduleKey));
                return;
            }

            if (!await ImsApiClient.CheckHealthAsync())
            {
                StatusMessage = "API is offline. Showing default columns.";
                PopulateFromKeys(SalesGridColumnCatalog.GetDefaultVisibleKeys(moduleKey));
                return;
            }

            var prefs = await ImsApiClient.GetGridColumnPreferencesAsync(moduleKey);
            if (prefs is null)
            {
                StatusMessage = "Could not load column settings.";
                PopulateFromKeys(SalesGridColumnCatalog.GetDefaultVisibleKeys(moduleKey));
                return;
            }

            var visible = SalesGridColumnCatalog.NormalizeVisibleKeys(prefs.VisibleColumnKeys, moduleKey);
            PopulateFromApi(prefs, visible);

            var source = prefs.HasUserOverride
                ? "your saved preferences"
                : prefs.HasGlobalDefault
                    ? "organization default"
                    : "system default";
            StatusMessage = $"{SelectedModuleTitle}: showing columns from {source}.";
        }
        catch (Exception ex)
        {
            StatusMessage = FormatApiError(ex);
            PopulateFromKeys(SalesGridColumnCatalog.GetDefaultVisibleKeys(moduleKey));
        }
        finally
        {
            if (IsUiAvailable)
                IsBusy = false;
        }
    }

    private void PopulateFromApi(Services.Api.Dtos.GridColumnPreferencesDto prefs, IReadOnlyList<string> visible)
    {
        var visibleSet = visible.ToHashSet(StringComparer.Ordinal);
        var columns = prefs.Columns.Count > 0
            ? prefs.Columns
            : SalesGridColumnCatalog.Columns.Select(c =>
                new Services.Api.Dtos.GridColumnDefinitionDto
                {
                    Key = c.Key,
                    Header = c.Header,
                    Mandatory = c.Mandatory,
                    DefaultVisible = c.DefaultVisible
                }).ToList();

        _suppressColumnEvents = true;
        ColumnOptions.Clear();
        foreach (var col in columns)
        {
            ColumnOptions.Add(new GridColumnOptionViewModel(
                col.Key,
                col.Header,
                col.Mandatory,
                visibleSet.Contains(col.Key),
                o => RequestSave()));
        }

        _suppressColumnEvents = false;
    }

    private void PopulateFromKeys(IReadOnlyList<string> visible)
    {
        var moduleKey = NormalizeModuleKey(SelectedModuleKey);
        var visibleSet = visible.ToHashSet(StringComparer.Ordinal);
        _suppressColumnEvents = true;
        ColumnOptions.Clear();
        foreach (var col in SalesGridColumnCatalog.GetColumnsForModule(moduleKey))
        {
            ColumnOptions.Add(new GridColumnOptionViewModel(
                col.Key,
                col.Header,
                col.Mandatory,
                visibleSet.Contains(col.Key),
                o => RequestSave()));
        }

        _suppressColumnEvents = false;
    }

    private void RequestSave()
    {
        if (_suppressColumnEvents)
            return;

        _ = SaveCurrentModuleAsync();
    }

    private void OnColumnVisibilityChanged(GridColumnOptionViewModel option)
    {
        RequestSave();
    }

    private async Task SaveCurrentModuleAsync()
    {
        if (!AuthSession.IsAuthenticated || !IsUiAvailable)
            return;

        var keys = ColumnOptions.Where(c => c.IsVisible).Select(c => c.Key).ToList();
        var moduleKey = NormalizeModuleKey(SelectedModuleKey);
        try
        {
            if (!await ImsApiClient.CheckHealthAsync())
            {
                StatusMessage = "API is offline — column change not saved.";
                return;
            }

            await GridColumnPreferenceService.SaveVisibleKeysAsync(moduleKey, keys);
            StatusMessage = $"{SelectedModuleTitle}: column visibility saved.";
        }
        catch (Exception ex)
        {
            StatusMessage = FormatApiError(ex);
        }
    }

    private async Task ResetSelectedModuleAsync()
    {
        if (!AuthSession.IsAuthenticated || !IsUiAvailable)
            return;

        var moduleKey = NormalizeModuleKey(SelectedModuleKey);
        IsBusy = true;
        try
        {
            await GridColumnPreferenceService.ResetToDefaultAsync(moduleKey);
            await LoadModuleAsync(moduleKey);
            StatusMessage = $"{SelectedModuleTitle}: reset to default columns.";
        }
        catch (Exception ex)
        {
            StatusMessage = FormatApiError(ex);
        }
        finally
        {
            if (IsUiAvailable)
                IsBusy = false;
        }
    }

    private async Task SaveGlobalDefaultAsync()
    {
        if (!CanManageGlobalDefaults || !IsUiAvailable)
            return;

        var moduleKey = NormalizeModuleKey(SelectedModuleKey);
        var keys = ColumnOptions.Where(c => c.IsVisible).Select(c => c.Key).ToList();
        IsBusy = true;
        try
        {
            await ImsApiClient.SaveGlobalGridColumnDefaultsAsync(moduleKey, keys);
            GridColumnPreferenceService.NotifyPreferencesChanged(moduleKey);
            StatusMessage = $"{SelectedModuleTitle}: saved as organization default for new users.";
        }
        catch (Exception ex)
        {
            StatusMessage = FormatApiError(ex);
        }
        finally
        {
            if (IsUiAvailable)
                IsBusy = false;
        }
    }

    private async Task ResetGlobalDefaultAsync()
    {
        if (!CanManageGlobalDefaults || !IsUiAvailable)
            return;

        var moduleKey = NormalizeModuleKey(SelectedModuleKey);
        IsBusy = true;
        try
        {
            await ImsApiClient.ResetGlobalGridColumnDefaultsAsync(moduleKey);
            await LoadModuleAsync(moduleKey);
            StatusMessage = $"{SelectedModuleTitle}: organization default reset.";
        }
        catch (Exception ex)
        {
            StatusMessage = FormatApiError(ex);
        }
        finally
        {
            if (IsUiAvailable)
                IsBusy = false;
        }
    }
}
