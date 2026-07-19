using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.ViewModels.SubPages;

public abstract class SalesEntryWorkspaceViewModelBase : ViewModelBase
{
    private readonly MainViewModel _host;
    private int _nextDocNo;
    private SalesEntryTabViewModel? _selectedTab;
    private SalesEntryFormViewModelBase? _lastPrintedOrder;

    protected SalesEntryWorkspaceViewModelBase(MainViewModel host, SalesEntryType entryType)
    {
        _host = host;
        EntryType = entryType;
        Definition = SalesEntryCatalog.Get(entryType);
        _nextDocNo = Definition.InitialDocNo;
        Tabs = new ObservableCollection<SalesEntryTabViewModel>();
        AddNewTabCommand = new RelayCommand(AddNewTab);
        CloseAllCommand = new RelayCommand(() => _host.GoBack(), () => Tabs.Count > 0);
    }

    public SalesEntryType EntryType { get; }
    public SalesEntryDefinition Definition { get; }
    public string NewTabButtonText => $"+ {Definition.NewDocButtonText}";

    public ObservableCollection<SalesEntryTabViewModel> Tabs { get; }

    public SalesEntryTabViewModel? SelectedTab
    {
        get => _selectedTab;
        set
        {
            if (!SetProperty(ref _selectedTab, value))
                return;
            OnPropertyChanged(nameof(ActiveOrder));
            OnPropertyChanged(nameof(OpenTabCountLabel));
        }
    }

    public SalesEntryFormViewModelBase? ActiveOrder => SelectedTab?.Order;

    public string OpenTabCountLabel => Tabs.Count == 0
        ? Definition.CounterLabel
        : $"{Definition.CounterLabel} ({Tabs.Count} open)";

    public ICommand AddNewTabCommand { get; }
    public ICommand CloseAllCommand { get; }

    protected MainViewModel Host => _host;

    protected abstract SalesEntryFormViewModelBase CreateForm(int docNo);

    public void AddNewTab() => _ = AddNewTabAsync();

    /// <summary>Opens a new bill tab, then closes the saved order tab (avoids empty workspace / GoBack).</summary>
    public async Task ContinueWithNextBillAsync(SalesEntryFormViewModelBase order)
    {
        await AddNewTabAsync();
        var tab = Tabs.FirstOrDefault(t => ReferenceEquals(t.Order, order));
        if (tab is not null)
            CloseTab(tab);
    }

    protected virtual async Task<int> GetNextDocNoFromApiAsync()
    {
        var next = await ImsApiClient.GetNextDocumentNumberAsync(ApiDocumentMapper.ToApiType(EntryType));
        return next.DocNo;
    }

    private async Task AddNewTabAsync()
    {
        var docNo = _nextDocNo;
        if (ImsApiClient.IsAvailable)
        {
            try
            {
                docNo = await GetNextDocNoFromApiAsync();
                _nextDocNo = docNo + 1;
            }
            catch
            {
                docNo = _nextDocNo++;
            }
        }
        else
        {
            docNo = _nextDocNo++;
        }

        AddTab(CreateForm(docNo));
    }

    protected void AddTab(SalesEntryFormViewModelBase order)
    {
        var tab = new SalesEntryTabViewModel(order, SelectTab, CloseTab);
        Tabs.Add(tab);
        SelectTab(tab);
        OnPropertyChanged(nameof(OpenTabCountLabel));
    }

    public void CloseOrder(SalesEntryFormViewModelBase order)
    {
        var tab = Tabs.FirstOrDefault(t => ReferenceEquals(t.Order, order));
        if (tab is not null)
            CloseTab(tab);
    }

    public void RegisterPrinted(SalesEntryFormViewModelBase order)
    {
        _lastPrintedOrder = order;
        OnPropertyChanged(nameof(CanPrintPrevious));
        CommandManager.InvalidateRequerySuggested();
    }

    public bool CanPrintPrevious => _lastPrintedOrder is not null;

    public void PrintPrevious()
    {
        if (_lastPrintedOrder is null)
        {
            MessageBox.Show("No previous document has been printed yet.", "Print", MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }

        _ = PrintPreviousAsync();
    }

    private async Task PrintPreviousAsync()
    {
        if (_lastPrintedOrder is null)
            return;

        if (await SalesOrderPrintService.PrintAsync(_lastPrintedOrder).ConfigureAwait(true))
            RegisterPrinted(_lastPrintedOrder);
    }

    private void SelectTab(SalesEntryTabViewModel tab)
    {
        foreach (var t in Tabs)
            t.IsSelected = ReferenceEquals(t, tab);
        SelectedTab = tab;
    }

    private void CloseTab(SalesEntryTabViewModel tab)
    {
        Tabs.Remove(tab);

        if (Tabs.Count == 0)
        {
            SelectedTab = null;
            OnPropertyChanged(nameof(OpenTabCountLabel));
            _host.GoBack();
            return;
        }

        if (ReferenceEquals(SelectedTab, tab))
            SelectTab(Tabs[^1]);

        OnPropertyChanged(nameof(OpenTabCountLabel));
    }
}
