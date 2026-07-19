using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Input;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.Views;

namespace IMS.ViewModels;

public sealed class FinancialYearManagementViewModel : ViewModelBase
{
    private readonly MainViewModel _host;
    private FinancialYearDto? _selectedYear;
    private bool _isBusy;
    private string _statusMessage = string.Empty;

    public FinancialYearManagementViewModel(MainViewModel host)
    {
        _host = host;
        Years = new ObservableCollection<FinancialYearDto>();

        RefreshCommand = new RelayCommand(() => _ = LoadAsync(), () => !IsBusy);
        CreateYearCommand = new RelayCommand(() => OpenCreateDialog(), () => !IsBusy && AuthSession.IsAdministrator);
        YearEndCommand = new RelayCommand(() => OpenYearEndDialog(), () => !IsBusy && AuthSession.IsAdministrator && SelectedYear is not null);
        DeleteYearCommand = new RelayCommand(() => _ = DeleteSelectedYearAsync(),
            () => !IsBusy && AuthSession.IsAdministrator && SelectedYear is not null);

        _ = LoadAsync();
    }

    public string Title => "Financial Year Management";
    public string Description =>
        "Create and close financial years. Login uses the selected financial year to isolate transaction data per database.";

    public ObservableCollection<FinancialYearDto> Years { get; }

    public FinancialYearDto? SelectedYear
    {
        get => _selectedYear;
        set
        {
            if (SetProperty(ref _selectedYear, value))
            {
                (YearEndCommand as RelayCommand)?.RaiseCanExecuteChanged();
                (DeleteYearCommand as RelayCommand)?.RaiseCanExecuteChanged();
            }
        }
    }

    public bool IsBusy
    {
        get => _isBusy;
        private set
        {
            if (SetProperty(ref _isBusy, value))
            {
                (RefreshCommand as RelayCommand)?.RaiseCanExecuteChanged();
                (CreateYearCommand as RelayCommand)?.RaiseCanExecuteChanged();
                (YearEndCommand as RelayCommand)?.RaiseCanExecuteChanged();
                (DeleteYearCommand as RelayCommand)?.RaiseCanExecuteChanged();
            }
        }
    }

    public string StatusMessage
    {
        get => _statusMessage;
        private set => SetProperty(ref _statusMessage, value);
    }

    public ICommand RefreshCommand { get; }
    public ICommand CreateYearCommand { get; }
    public ICommand YearEndCommand { get; }
    public ICommand DeleteYearCommand { get; }

    private async Task LoadAsync()
    {
        if (IsBusy) return;
        IsBusy = true;
        try
        {
            StatusMessage = "Loading financial years…";
            var years = await ImsApiClient.GetFinancialYearsAsync();
            Years.Clear();
            foreach (var y in years.OrderBy(x => x.StartDate))
                Years.Add(y);
            SelectedYear = Years.LastOrDefault();
            StatusMessage = Years.Count == 0 ? "No financial years configured." : $"{Years.Count} financial year(s) loaded.";
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

    private void OpenCreateDialog()
    {
        var dlg = new CreateFinancialYearWindow
        {
            Owner = Application.Current?.MainWindow
        };

        if (dlg.ShowDialog() != true)
            return;

        _ = CreateFinancialYearAsync(dlg.FinancialYearName, dlg.StartDate, dlg.EndDate);
    }

    private async Task CreateFinancialYearAsync(string name, DateTime start, DateTime end)
    {
        if (IsBusy) return;
        IsBusy = true;
        try
        {
            StatusMessage = "Creating financial year…";
            await ImsApiClient.CreateFinancialYearAsync(name, start, end);
            await LoadAsync();
            StatusMessage = "Financial year created.";
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

    private void OpenYearEndDialog()
    {
        if (SelectedYear is null) return;

        var dlg = new YearEndClosingWindow(SelectedYear)
        {
            Owner = Application.Current?.MainWindow
        };

        if (dlg.ShowDialog() != true)
            return;

        _ = RunYearEndAsync(SelectedYear.Id, dlg.ToFinancialYearName, dlg.ToStartDate, dlg.ToEndDate);
    }

    private async Task RunYearEndAsync(string fromYearId, string toName, DateTime toStart, DateTime toEnd)
    {
        if (IsBusy) return;
        IsBusy = true;
        try
        {
            StatusMessage = "Running year-end closing…";
            var result = await ImsApiClient.RunYearEndAsync(fromYearId, toName, toStart, toEnd);
            await LoadAsync();
            var payload = result.Result;
            StatusMessage = payload is null
                ? "Year-end completed."
                : $"Year-end completed. Opening balances: {payload.OpeningBalancesMigrated}, Stock items: {payload.OpeningStockMigrated}.";
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

    private async Task DeleteSelectedYearAsync()
    {
        if (SelectedYear is null || IsBusy)
            return;

        var confirm = MessageBox.Show(
            $"Delete financial year '{SelectedYear.FinancialYearName}' and drop database '{SelectedYear.DatabaseName}'?\n\nThis cannot be undone.",
            "Delete Financial Year",
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);

        if (confirm != MessageBoxResult.Yes)
            return;

        IsBusy = true;
        try
        {
            StatusMessage = "Deleting financial year…";
            await ImsApiClient.DeleteFinancialYearAsync(SelectedYear.Id);
            await LoadAsync();
            StatusMessage = "Financial year deleted.";
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
}

