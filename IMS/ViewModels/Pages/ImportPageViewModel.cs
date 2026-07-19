using System.Collections.ObjectModel;
using System.IO;
using System.Windows;
using System.Windows.Input;
using IMS.Helpers;
using IMS.Services;
using IMS.Services.Api;
using Microsoft.Win32;

namespace IMS.ViewModels;

public sealed class ImportPageViewModel : ViewModelBase
{
    private readonly MainViewModel _host;
    private string _selectedFilePath = string.Empty;
    private string _statusMessage;
    private bool _isBusy;
    private bool _importSucceeded;
    private string _summaryText = string.Empty;

    public ImportPageViewModel(
        MainViewModel host,
        string importTypeKey,
        string entityLabel,
        string targetNavKey,
        string targetSectionTitle)
    {
        _host = host;
        ImportTypeKey = importTypeKey;
        EntityLabel = entityLabel;
        TargetNavKey = targetNavKey;
        TargetSectionTitle = targetSectionTitle;
        PageTitle = $"Import {entityLabel}";
        PageDescription = $"Download the Excel format, fill {entityLabel.ToLowerInvariant()} data, upload the file, and import into the database.";
        TemplateFileName = $"IMS_{entityLabel.Replace(' ', '_')}_Import_Template.xlsx";
        _statusMessage = "Step 1: Download format  •  Step 2: Fill Excel  •  Step 3: Upload and import";

        ResultLines = new ObservableCollection<string>();

        DownloadTemplateCommand = new RelayCommand(() => _ = DownloadTemplateAsync(), () => !IsBusy);
        BrowseFileCommand = new RelayCommand(BrowseFile, () => !IsBusy);
        ImportDataCommand = new RelayCommand(() => _ = ImportDataAsync(), () => !IsBusy && !string.IsNullOrWhiteSpace(SelectedFilePath));
        GoToSectionCommand = new RelayCommand(GoToSection, () => ImportSucceeded);
    }

    public string ImportTypeKey { get; }
    public string EntityLabel { get; }
    public string TargetNavKey { get; }
    public string TargetSectionTitle { get; }
    public string PageTitle { get; }
    public string PageDescription { get; }
    public string TemplateFileName { get; }

    public ObservableCollection<string> ResultLines { get; }

    public string SelectedFilePath
    {
        get => _selectedFilePath;
        set
        {
            if (!SetProperty(ref _selectedFilePath, value))
                return;
            (ImportDataCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }
    }

    public string StatusMessage
    {
        get => _statusMessage;
        private set => SetProperty(ref _statusMessage, value);
    }

    public string SummaryText
    {
        get => _summaryText;
        private set => SetProperty(ref _summaryText, value);
    }

    public bool IsBusy
    {
        get => _isBusy;
        private set
        {
            if (!SetProperty(ref _isBusy, value))
                return;
            (DownloadTemplateCommand as RelayCommand)?.RaiseCanExecuteChanged();
            (BrowseFileCommand as RelayCommand)?.RaiseCanExecuteChanged();
            (ImportDataCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }
    }

    public bool ImportSucceeded
    {
        get => _importSucceeded;
        private set
        {
            if (!SetProperty(ref _importSucceeded, value))
                return;
            (GoToSectionCommand as RelayCommand)?.RaiseCanExecuteChanged();
            OnPropertyChanged(nameof(ShowGoToSection));
        }
    }

    public bool ShowGoToSection => ImportSucceeded;

    public ICommand DownloadTemplateCommand { get; }
    public ICommand BrowseFileCommand { get; }
    public ICommand ImportDataCommand { get; }
    public ICommand GoToSectionCommand { get; }

    private async Task DownloadTemplateAsync()
    {
        if (!IsUiAvailable)
            return;

        IsBusy = true;
        try
        {
            byte[]? bytes = null;
            var source = "bundled";

            if (await ImsApiClient.CheckHealthAsync())
            {
                try
                {
                    bytes = await ImsApiClient.DownloadImportTemplateAsync(ImportTypeKey);
                    if (bytes is { Length: > 0 })
                        source = "API";
                }
                catch (ApiException ex) when (ex.Message.Contains("404", StringComparison.Ordinal))
                {
                    // Older API without import routes — fall back to bundled templates.
                }
            }

            bytes ??= await ImportTemplateService.ReadBundledTemplateAsync(ImportTypeKey);
            if (bytes is null or { Length: 0 })
            {
                StatusMessage = "Template file not found. Rebuild the app or restart the API (npm run dev:once in the api folder).";
                return;
            }

            var dialog = new SaveFileDialog
            {
                Title = $"Save {EntityLabel} import template",
                FileName = TemplateFileName,
                Filter = "Excel workbook (*.xlsx)|*.xlsx",
                DefaultExt = ".xlsx"
            };

            if (dialog.ShowDialog() != true)
            {
                StatusMessage = "Download cancelled.";
                return;
            }

            await File.WriteAllBytesAsync(dialog.FileName, bytes);
            StatusMessage = source == "API"
                ? $"Template saved: {dialog.FileName}"
                : $"Template saved (offline copy): {dialog.FileName}";
        }
        catch (Exception ex)
        {
            StatusMessage = $"Download failed: {ex.Message}";
        }
        finally
        {
            if (IsUiAvailable)
                IsBusy = false;
        }
    }

    private void BrowseFile()
    {
        if (!IsUiAvailable)
            return;

        var dialog = new OpenFileDialog
        {
            Title = $"Select {EntityLabel} Excel file",
            Filter = "Excel workbook (*.xlsx)|*.xlsx|Excel 97-2003 (*.xls)|*.xls",
            DefaultExt = ".xlsx"
        };

        if (dialog.ShowDialog() == true)
        {
            SelectedFilePath = dialog.FileName;
            StatusMessage = $"Selected file: {Path.GetFileName(dialog.FileName)}";
        }
    }

    private async Task ImportDataAsync()
    {
        if (!IsUiAvailable)
            return;

        if (!await EnsureApiAsync())
            return;

        IsBusy = true;
        ImportSucceeded = false;
        ResultLines.Clear();
        SummaryText = string.Empty;

        try
        {
            StatusMessage = "Importing data…";
            var result = await ImsApiClient.ImportExcelAsync(ImportTypeKey, SelectedFilePath);
            if (result is null)
            {
                StatusMessage = "No response from import API.";
                return;
            }

            SummaryText = $"Imported: {result.Imported}  •  Failed: {result.Failed}";
            StatusMessage = result.Success
                ? $"Import completed. Open {TargetSectionTitle} to view imported records."
                : "Import finished with errors. Review details below.";

            foreach (var doc in result.Documents.Take(20))
                ResultLines.Add($"✓ {doc}");

            foreach (var err in result.Errors.Take(20))
                ResultLines.Add($"Row {err.Row}: {err.Message}");

            ImportSucceeded = result.Imported > 0;

            if (result.Imported > 0 && result.Failed == 0)
                GoToSection();
        }
        catch (Exception ex)
        {
            StatusMessage = $"Import failed: {ex.Message}";
            ResultLines.Add(ex.Message);
        }
        finally
        {
            if (IsUiAvailable)
            {
                IsBusy = false;
                OnPropertyChanged(nameof(ShowGoToSection));
            }
        }
    }

    private void GoToSection()
    {
        if (!IsUiAvailable)
            return;

        _host.NavigateByKey(TargetNavKey);
    }

    private static async Task<bool> EnsureApiAsync()
    {
        if (!IsUiAvailable)
            return false;

        if (await ImsApiClient.CheckHealthAsync())
            return true;

        if (!IsUiAvailable)
            return false;

        MessageBox.Show(
            Application.Current?.MainWindow,
            "Cannot reach the API. Start the API (npm run dev in the api folder) and try again.",
            "API Offline",
            MessageBoxButton.OK,
            MessageBoxImage.Warning);
        return false;
    }
}
