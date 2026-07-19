using System.Collections.ObjectModel;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.ViewModels;

public sealed class HubViewModel : ViewModelBase
{
    private readonly MainViewModel _host;
    private readonly HubDefinition _hub;
    private readonly Dictionary<string, object> _tabViewModels = new(StringComparer.Ordinal);
    private string _activeTabKey;
    private object? _currentTabContent;

    public HubViewModel(MainViewModel host, HubDefinition hub, string activeTabKey)
    {
        _host = host;
        _hub = hub;
        _activeTabKey = HubRegistry.ResolveHubTab(hub.HubNavKey, activeTabKey);
        Tabs = new ObservableCollection<HubTabViewModel>(
            hub.Tabs
                .Where(t => MenuPermissionSession.CanView(t.Key))
                .Select(t => new HubTabViewModel(t.Key, t.Title, t.IconGlyph, t.Description)));

        if (Tabs.Count == 0)
        {
            _activeTabKey = hub.DefaultTabKey;
        }
        else if (!Tabs.Any(t => string.Equals(t.Key, _activeTabKey, StringComparison.Ordinal)))
        {
            _activeTabKey = Tabs[0].Key;
        }

        SelectTabCommand = new RelayCommand(SelectTab, static p => p is string);
        ActivateTab(_activeTabKey);
    }

    public string HubNavKey => _hub.HubNavKey;
    public string HubTitle => _hub.SidebarTitle;
    public string ActiveTabKey => _activeTabKey;
    public ObservableCollection<HubTabViewModel> Tabs { get; }
    public RelayCommand SelectTabCommand { get; }

    public object? CurrentTabContent
    {
        get => _currentTabContent;
        private set => SetProperty(ref _currentTabContent, value);
    }

    public void SetActiveTab(string tabKey) => ActivateTab(HubRegistry.ResolveHubTab(_hub.HubNavKey, tabKey));

    private void SelectTab(object? parameter)
    {
        if (parameter is not string tabKey)
            return;

        ActivateTab(tabKey);
    }

    private void ActivateTab(string tabKey)
    {
        tabKey = HubRegistry.ResolveHubTab(_hub.HubNavKey, tabKey);
        if (!Tabs.Any(t => string.Equals(t.Key, tabKey, StringComparison.Ordinal)))
            tabKey = Tabs.FirstOrDefault()?.Key ?? _hub.DefaultTabKey;

        _activeTabKey = tabKey;
        foreach (var tab in Tabs)
            tab.IsSelected = string.Equals(tab.Key, tabKey, StringComparison.Ordinal);

        OnPropertyChanged(nameof(ActiveTabKey));

        if (!_tabViewModels.TryGetValue(tabKey, out var viewModel))
        {
            var navItem = _host.TryGetNavigationItem(tabKey);
            viewModel = navItem?.CreateViewModel(_host) ?? new object();
            _tabViewModels[tabKey] = viewModel;
        }

        CurrentTabContent = viewModel;
        _host.NotifyHubTabChanged(_hub.HubNavKey, tabKey);
        ApiListLoader.RefreshCurrentPage(viewModel);
    }
}
