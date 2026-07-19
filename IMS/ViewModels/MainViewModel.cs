using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Media;

using IMS.Models;

using IMS.Services;
using IMS.Services.Api;

using IMS.ViewModels.SubPages;



namespace IMS.ViewModels;



public sealed class MainViewModel : ViewModelBase

{

    public const string FavoritesSectionName = "Favorites";



    private readonly AppSettings _settings;

    private readonly Dictionary<string, NavigationItem> _itemsByKey;

    private readonly NavigationSectionViewModel _favoritesSection;

    private readonly Dictionary<string, string> _hubTabSelections = new(StringComparer.Ordinal);



    private object? _currentViewModel;

    private object? _parentViewModel;

    private NavigationItem? _selectedNavigation;

    private string _selectedSidebarKey = NavKeys.Dashboard;
    private bool _isSidebarCollapsed;

    private SalesEntryWorkspaceViewModelBase? _salesWorkspace;

    private PurchaseEntryWorkspaceViewModelBase? _purchaseWorkspace;



    public MainViewModel()

    {

        ImsApiClient.Initialize();
        AuthSession.RestoreToApiClient();
        _ = InitializeApiAsync();

        _settings = SettingsStore.Load();
        _isSidebarCollapsed = _settings.SidebarCollapsed;

        var items = FilterNavigationByPermissions(NavigationCatalog.Build());

        _itemsByKey = items.ToDictionary(i => i.Key, StringComparer.Ordinal);

        ApplyPinnedState(items);

        NavigationItems = new ObservableCollection<NavigationItem>(items);

        _favoritesSection = CreateFavoritesSection();

        NavigationSections = new ObservableCollection<NavigationSectionViewModel>(BuildSections(items));

        SidebarNavItems = new ObservableCollection<SidebarNavItemViewModel>(BuildSidebarItems());

        foreach (var hub in HubRegistry.All)

            _hubTabSelections[hub.HubNavKey] = hub.DefaultTabKey;



        NavigateCommand = new RelayCommand(Navigate, CanNavigate);

        NavigateSidebarCommand = new RelayCommand(NavigateSidebar, static p => p is SidebarNavItemViewModel);

        TogglePinCommand = new RelayCommand(TogglePin, static p => p is NavigationItem);

        GoBackCommand = new RelayCommand(GoBack, () => IsSubPage);

        MenuSearchResults = new ObservableCollection<NavigationItem>();

        ClearMenuSearchCommand = new RelayCommand(ClearMenuSearch, () => !string.IsNullOrWhiteSpace(MenuSearchText));

        NavigateFromMenuSearchCommand = new RelayCommand(NavigateFromMenuSearch, static p => p is NavigationItem);

        LogoutCommand = new RelayCommand(RequestLogout);
        ToggleSidebarCollapseCommand = new RelayCommand(ToggleSidebarCollapse);

        ThemeService.Instance.ThemeChanged += OnThemeChanged;

        ThemeBadgeText = ThemeService.Instance.Current.BadgeText;

        var initial = items.FirstOrDefault(i => i.Key == NavKeys.Dashboard)
                      ?? items.FirstOrDefault(i => MenuPermissionSession.CanView(i.Key))
                      ?? items.FirstOrDefault();
        if (initial is not null)
            NavigateToItem(initial);

    }



    public string ThemeBadgeText { get; private set; } = string.Empty;

    public ImageSource? SidebarLogo { get; private set; }

    public bool HasSidebarLogo => SidebarLogo is not null;

    public string SidebarTitle { get; private set; } = "IMS";

    public string SidebarSubtitle { get; private set; } = "Inventory + Production";

    public void RefreshCompanyBranding()
    {
        UiThread.Run(() =>
        {
            var company = CompanyProfileService.Current;
            SidebarLogo = CompanyLogoHelper.CreateImageSource(company.LogoImage);
            SidebarTitle = string.IsNullOrWhiteSpace(company.BusinessName)
                ? "IMS"
                : company.BusinessName.Trim();
            SidebarSubtitle = string.IsNullOrWhiteSpace(company.LogoText)
                ? "Inventory + Production"
                : company.LogoText.Trim();
            OnPropertyChanged(nameof(SidebarLogo));
            OnPropertyChanged(nameof(HasSidebarLogo));
            OnPropertyChanged(nameof(SidebarTitle));
            OnPropertyChanged(nameof(SidebarSubtitle));
        });
    }



    public ObservableCollection<NavigationItem> NavigationItems { get; }

    public ObservableCollection<NavigationSectionViewModel> NavigationSections { get; }

    public ObservableCollection<SidebarNavItemViewModel> SidebarNavItems { get; }

    public ObservableCollection<NavigationItem> MenuSearchResults { get; }

    private string _menuSearchText = string.Empty;

    public string MenuSearchText
    {
        get => _menuSearchText;
        set
        {
            if (!SetProperty(ref _menuSearchText, value))
                return;

            RefreshMenuSearch();
            OnPropertyChanged(nameof(IsMenuSearchActive));
            OnPropertyChanged(nameof(ShowNavigationMenu));
            OnPropertyChanged(nameof(ShowMenuSearchEmpty));
            (ClearMenuSearchCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }
    }

    public bool IsMenuSearchActive => !string.IsNullOrWhiteSpace(MenuSearchText);

    public bool ShowNavigationMenu => !IsMenuSearchActive;

    public bool ShowMenuSearchEmpty => IsMenuSearchActive && MenuSearchResults.Count == 0;

    public bool ShowFavoritesSection => _favoritesSection.Items.Count > 0;

    public bool IsSidebarCollapsed
    {
        get => _isSidebarCollapsed;
        set
        {
            if (!SetProperty(ref _isSidebarCollapsed, value))
                return;

            _settings.SidebarCollapsed = value;
            SettingsStore.Save(_settings);
            OnPropertyChanged(nameof(SidebarWidth));
        }
    }

    public double SidebarWidth => IsSidebarCollapsed ? 56 : 260;

    public object? CurrentViewModel

    {

        get => _currentViewModel;

        private set => ApplyCurrentViewModel(value);

    }



    public NavigationItem? SelectedNavigation

    {

        get => _selectedNavigation;

        set

        {

            if (value is null)

                return;

            NavigateToItem(value);

        }

    }



    public string? SelectedNavigationKey => _selectedNavigation?.Key;

    public string SelectedSidebarKey => _selectedSidebarKey;



    public bool IsDashboard => !IsSubPage && string.Equals(_selectedSidebarKey, NavKeys.Dashboard, StringComparison.Ordinal);



    public bool IsSubPage => CurrentViewModel is SubPageViewModelBase
        or SalesEntryWorkspaceViewModelBase
        or PurchaseEntryWorkspaceViewModelBase;



    public bool IsSalesCounter => CurrentViewModel is SalesEntryWorkspaceViewModelBase;

    public bool IsEntryWorkspace => CurrentViewModel is SalesEntryWorkspaceViewModelBase
        or PurchaseEntryWorkspaceViewModelBase;

    /// <summary>Edge-to-edge layout like Dashboard (no app header bar, no content host padding).</summary>
    public bool UsesFullPageLayout =>
        IsDashboard
        || IsSubPage
        || IsEntryWorkspace
        || CurrentViewModel is MockPageViewModel
        || CurrentViewModel is SalesOrdersViewModel
        || CurrentViewModel is IStandardReportViewModel
        || CurrentViewModel is DashboardViewModel
        || CurrentViewModel is ImportPageViewModel;

    public string HeaderTitle

    {

        get

        {

            if (CurrentViewModel is SalesEntryWorkspaceViewModelBase salesWorkspace)

            {

                var docLabel = salesWorkspace.SelectedTab?.TabTitle ?? "New";

                return FormatWorkspaceHeader(salesWorkspace.Definition.NavTitle, docLabel);

            }

            if (CurrentViewModel is PurchaseEntryWorkspaceViewModelBase purchaseWorkspace)

            {

                var docLabel = purchaseWorkspace.SelectedTab?.TabTitle ?? "New";

                return FormatWorkspaceHeader(purchaseWorkspace.Definition.NavTitle, docLabel);

            }

            if (CurrentViewModel is SubPageViewModelBase sub)

                return FormatWorkspaceHeader(sub.ParentTitle, sub.PageTitle);

            if (HubRegistry.IsHubNavKey(_selectedSidebarKey))

            {

                if (_hubTabSelections.TryGetValue(_selectedSidebarKey, out var tabKey))

                {

                    var tabTitle = HubRegistry.GetHubTabTitle(_selectedSidebarKey, tabKey);

                    if (!string.IsNullOrWhiteSpace(tabTitle))

                        return tabTitle;

                }

            }

            if (string.Equals(_selectedSidebarKey, NavKeys.Dashboard, StringComparison.Ordinal))

                return "Overview";

            return _selectedNavigation?.Title ?? "Overview";

        }

    }



    public string? SubPageTitle => null;



    public RelayCommand NavigateCommand { get; }

    public RelayCommand NavigateSidebarCommand { get; }

    public RelayCommand TogglePinCommand { get; }

    public RelayCommand GoBackCommand { get; }

    public RelayCommand ClearMenuSearchCommand { get; }

    public RelayCommand NavigateFromMenuSearchCommand { get; }

    public RelayCommand LogoutCommand { get; }

    public RelayCommand ToggleSidebarCollapseCommand { get; }

    public NavigationItem? TryGetNavigationItem(string key) =>
        _itemsByKey.GetValueOrDefault(key);

    internal void NotifyHubTabChanged(string hubNavKey, string tabKey)
    {
        _hubTabSelections[hubNavKey] = tabKey;

        if (_itemsByKey.TryGetValue(tabKey, out var navItem))
            _selectedNavigation = navItem;

        OnPropertyChanged(nameof(SelectedNavigationKey));
        OnPropertyChanged(nameof(HeaderTitle));
    }

    public void OpenSalesOrderWorkspace() => OpenSalesWorkspace(SalesEntryType.SalesOrder);

    public void OpenSalesOrderForEdit(string formattedDocNo)
    {
        _parentViewModel ??= CurrentViewModel;

        if (_salesWorkspace is null || _salesWorkspace.EntryType != SalesEntryType.SalesOrder)
        {
            _salesWorkspace = SalesEntryWorkspaceFactory.Create(this, SalesEntryType.SalesOrder);
            CurrentViewModel = _salesWorkspace;
        }
        else if (CurrentViewModel is not SalesEntryWorkspaceViewModelBase)
        {
            CurrentViewModel = _salesWorkspace;
        }

        if (_salesWorkspace is SalesOrderWorkspaceViewModel salesOrderWorkspace)
            salesOrderWorkspace.AddEditTab(formattedDocNo);

        OnPropertyChanged(nameof(HeaderTitle));
        OnPropertyChanged(nameof(SubPageTitle));
    }

    public void OpenDeliveryChallanWorkspace() => OpenSalesWorkspace(SalesEntryType.DeliveryChallan);

    public void OpenSalesInvoiceWorkspace() => OpenSalesWorkspace(SalesEntryType.SalesInvoice);

    public void OpenSalesReturnWorkspace() => OpenSalesWorkspace(SalesEntryType.SalesReturn);

    public void OpenSalesDocumentForEdit(SalesEntryType entryType, string formattedDocNo)
    {
        _parentViewModel ??= CurrentViewModel;

        if (_salesWorkspace is null || _salesWorkspace.EntryType != entryType)
        {
            _salesWorkspace = SalesEntryWorkspaceFactory.Create(this, entryType);
            CurrentViewModel = _salesWorkspace;
        }
        else if (CurrentViewModel is not SalesEntryWorkspaceViewModelBase)
        {
            CurrentViewModel = _salesWorkspace;
        }

        switch (_salesWorkspace)
        {
            case DeliveryChallanWorkspaceViewModel dc:
                dc.AddEditTab(formattedDocNo);
                break;
            case SalesInvoiceWorkspaceViewModel inv:
                inv.AddEditTab(formattedDocNo);
                break;
            case SalesReturnWorkspaceViewModel sr:
                sr.AddEditTab(formattedDocNo);
                break;
        }

        OnPropertyChanged(nameof(HeaderTitle));
        OnPropertyChanged(nameof(SubPageTitle));
    }

    public void OpenPurchaseOrderWorkspace() => OpenPurchaseWorkspace(PurchaseEntryType.PurchaseOrder);

    public void OpenGrnWorkspace() => OpenPurchaseWorkspace(PurchaseEntryType.Grn);

    public void OpenPurchaseInvoiceWorkspace() => OpenPurchaseWorkspace(PurchaseEntryType.PurchaseInvoice);

    public void OpenPurchaseReturnWorkspace() => OpenPurchaseWorkspace(PurchaseEntryType.PurchaseReturn);

    public void OpenPurchaseWorkspace(PurchaseEntryType entryType) => OpenPurchaseWorkspaceInternal(entryType);

    public void OpenPurchaseDocumentForEdit(PurchaseEntryType entryType, string formattedDocNo)
    {
        _parentViewModel ??= CurrentViewModel;

        if (_purchaseWorkspace is null || _purchaseWorkspace.EntryType != entryType)
        {
            _purchaseWorkspace = PurchaseEntryWorkspaceFactory.Create(this, entryType);
            CurrentViewModel = _purchaseWorkspace;
        }
        else if (CurrentViewModel is not PurchaseEntryWorkspaceViewModelBase)
        {
            CurrentViewModel = _purchaseWorkspace;
        }

        switch (_purchaseWorkspace)
        {
            case PurchaseOrderWorkspaceViewModel po:
                po.AddEditTab(formattedDocNo);
                break;
            case GrnWorkspaceViewModel grn:
                grn.AddEditTab(formattedDocNo);
                break;
            case PurchaseInvoiceWorkspaceViewModel pi:
                pi.AddEditTab(formattedDocNo);
                break;
            case PurchaseReturnWorkspaceViewModel pr:
                pr.AddEditTab(formattedDocNo);
                break;
        }

        OnPropertyChanged(nameof(HeaderTitle));
        OnPropertyChanged(nameof(SubPageTitle));
    }

    public void RefreshPurchaseDocumentList(PurchaseEntryType entryType) =>
        RefreshPurchaseDocumentListPage(ResolveContentHost(_parentViewModel ?? CurrentViewModel), entryType);

    private static void RefreshPurchaseDocumentListPage(object? viewModel, PurchaseEntryType? onlyType = null)
    {
        if (viewModel is PurchaseOrdersViewModel po
            && (onlyType is null or PurchaseEntryType.PurchaseOrder))
            ApiListLoader.RefreshPurchaseDocuments(po, PurchaseEntryType.PurchaseOrder);
        else if (viewModel is PurchaseGrnsViewModel grn
            && (onlyType is null or PurchaseEntryType.Grn))
            ApiListLoader.RefreshPurchaseDocuments(grn, PurchaseEntryType.Grn);
        else if (viewModel is PurchaseInvoicesViewModel pi
            && (onlyType is null or PurchaseEntryType.PurchaseInvoice))
            ApiListLoader.RefreshPurchaseDocuments(pi, PurchaseEntryType.PurchaseInvoice);
        else if (viewModel is PurchaseReturnsViewModel pr
            && (onlyType is null or PurchaseEntryType.PurchaseReturn))
            ApiListLoader.RefreshPurchaseDocuments(pr, PurchaseEntryType.PurchaseReturn);
    }

    private void OpenSalesWorkspace(SalesEntryType entryType)
    {
        _parentViewModel ??= CurrentViewModel;

        if (_salesWorkspace is null || _salesWorkspace.EntryType != entryType)
        {
            _salesWorkspace = SalesEntryWorkspaceFactory.Create(this, entryType);
            CurrentViewModel = _salesWorkspace;
        }
        else if (CurrentViewModel is not SalesEntryWorkspaceViewModelBase)
        {
            CurrentViewModel = _salesWorkspace;
        }

        _salesWorkspace.AddNewTab();
        OnPropertyChanged(nameof(HeaderTitle));
        OnPropertyChanged(nameof(SubPageTitle));
    }

    private void OpenPurchaseWorkspaceInternal(PurchaseEntryType entryType)
    {
        _parentViewModel ??= CurrentViewModel;

        if (_purchaseWorkspace is null || _purchaseWorkspace.EntryType != entryType)
        {
            _purchaseWorkspace = PurchaseEntryWorkspaceFactory.Create(this, entryType);
            CurrentViewModel = _purchaseWorkspace;
        }
        else if (CurrentViewModel is not PurchaseEntryWorkspaceViewModelBase)
        {
            CurrentViewModel = _purchaseWorkspace;
        }

        _purchaseWorkspace.AddNewTab();
        OnPropertyChanged(nameof(HeaderTitle));
        OnPropertyChanged(nameof(SubPageTitle));
    }



    public void NavigateToSubPage(SubPageViewModelBase subPage)

    {

        _parentViewModel ??= CurrentViewModel;

        CurrentViewModel = subPage;

        GoBackCommand.RaiseCanExecuteChanged();

    }

    public void OpenReceiptVoucherForInvoice(InvoicePaymentSeed seed, Action? onPaymentRecorded = null)
    {
        NavigateToSubPage(new ReceiptVoucherEntryViewModel(this, seed, onPaymentRecorded));
    }

    public void OpenPaymentVoucherForInvoice(InvoicePaymentSeed seed, Action? onPaymentRecorded = null)
    {
        NavigateToSubPage(new PaymentVoucherEntryViewModel(this, seed, onPaymentRecorded));
    }



    public void GoBack()

    {

        if (_parentViewModel is null)

            return;



        if (CurrentViewModel is SalesEntryWorkspaceViewModelBase)

            _salesWorkspace = null;

        if (CurrentViewModel is PurchaseEntryWorkspaceViewModelBase)

            _purchaseWorkspace = null;



        var returningTo = _parentViewModel;
        ApplyCurrentViewModel(returningTo);

        _parentViewModel = null;

        if (returningTo is MockPageViewModel listPage)
            listPage.ReloadFromApi();
        else if (returningTo is IPageViewLoadAware loadAware)
            loadAware.OnPageViewLoaded();
        else if (returningTo is HubViewModel hub)
            ApiListLoader.RefreshCurrentPage(hub.CurrentTabContent);

        GoBackCommand.RaiseCanExecuteChanged();

    }

    /// <summary>Refreshes DC / Invoice / Return list when returning from workspace or after save.</summary>
    public void RefreshSalesDocumentList(SalesEntryType entryType) =>
        RefreshSalesDocumentListPage(ResolveContentHost(_parentViewModel ?? CurrentViewModel), entryType);

    private static void RefreshSalesDocumentListPage(object? viewModel, SalesEntryType? onlyType = null)
    {
        if (viewModel is DeliveryChallansViewModel dc
            && (onlyType is null or SalesEntryType.DeliveryChallan))
            _ = dc.EnsureApiLoadAsync(force: true);
        else if (viewModel is SalesInvoicesViewModel inv
            && (onlyType is null or SalesEntryType.SalesInvoice))
            _ = inv.EnsureApiLoadAsync(force: true);
        else if (viewModel is SalesReturnsViewModel sr
            && (onlyType is null or SalesEntryType.SalesReturn))
            _ = sr.EnsureApiLoadAsync(force: true);
    }



    private static bool CanNavigate(object? parameter) => parameter is NavigationItem;



    private void Navigate(object? parameter)

    {

        if (parameter is NavigationItem item)

            NavigateToItem(item);

    }

    private void NavigateSidebar(object? parameter)
    {
        if (parameter is not SidebarNavItemViewModel sidebarItem)
            return;

        if (string.Equals(sidebarItem.Key, NavKeys.Dashboard, StringComparison.Ordinal))
        {
            if (_itemsByKey.TryGetValue(NavKeys.Dashboard, out var dashboard))
                NavigateToItem(dashboard);
            return;
        }

        if (HubRegistry.IsHubNavKey(sidebarItem.Key))
            NavigateToHub(sidebarItem.Key);
    }

    private void NavigateToItem(NavigationItem item)

    {
        if (!MenuPermissionSession.CanView(item.Key))
        {
            System.Windows.MessageBox.Show(
                "You do not have permission to open this screen.",
                "Access denied",
                System.Windows.MessageBoxButton.OK,
                System.Windows.MessageBoxImage.Warning);
            return;
        }

        if (HubRegistry.IsHubModuleNavKey(item.Key))
        {
            var hub = HubRegistry.GetHubForModuleNavKey(item.Key)!;
            _hubTabSelections[hub.HubNavKey] = HubRegistry.ResolveHubTab(hub.HubNavKey, item.Key);
            NavigateToHub(hub.HubNavKey, item.Key);
            _selectedNavigation = item;
            OnPropertyChanged(nameof(SelectedNavigation));
            OnPropertyChanged(nameof(SelectedNavigationKey));
            return;
        }

        if (string.Equals(item.Key, NavKeys.Dashboard, StringComparison.Ordinal))
        {
            NavigateToDashboard(item);
            return;
        }

        _selectedNavigation = item;
        _selectedSidebarKey = item.Key;

        OnPropertyChanged(nameof(SelectedNavigation));
        OnPropertyChanged(nameof(SelectedNavigationKey));
        OnPropertyChanged(nameof(SelectedSidebarKey));

        _parentViewModel = null;
        _salesWorkspace = null;
        _purchaseWorkspace = null;

        ApplyCurrentViewModel(item.CreateViewModel(this));
        ApiListLoader.RefreshCurrentPage(CurrentViewModel);

    }

    private void NavigateToDashboard(NavigationItem item)
    {
        _selectedNavigation = item;
        _selectedSidebarKey = NavKeys.Dashboard;

        OnPropertyChanged(nameof(SelectedNavigation));
        OnPropertyChanged(nameof(SelectedNavigationKey));
        OnPropertyChanged(nameof(SelectedSidebarKey));

        _parentViewModel = null;
        _salesWorkspace = null;
        _purchaseWorkspace = null;

        ApplyCurrentViewModel(item.CreateViewModel(this));
        ApiListLoader.RefreshCurrentPage(CurrentViewModel);
    }

    private void NavigateToHub(string hubNavKey, string? tabKey = null)
    {
        var hub = HubRegistry.GetHub(hubNavKey);
        if (hub is null)
            return;

        tabKey = HubRegistry.ResolveHubTab(hubNavKey, tabKey ?? _hubTabSelections.GetValueOrDefault(hubNavKey, hub.DefaultTabKey));
        _hubTabSelections[hubNavKey] = tabKey;
        _selectedSidebarKey = hubNavKey;

        if (_itemsByKey.TryGetValue(tabKey, out var navItem))
            _selectedNavigation = navItem;

        OnPropertyChanged(nameof(SelectedNavigation));
        OnPropertyChanged(nameof(SelectedNavigationKey));
        OnPropertyChanged(nameof(SelectedSidebarKey));

        _parentViewModel = null;
        _salesWorkspace = null;
        _purchaseWorkspace = null;

        if (CurrentViewModel is HubViewModel existing
            && string.Equals(existing.HubNavKey, hubNavKey, StringComparison.Ordinal))
        {
            existing.SetActiveTab(tabKey);
            OnPropertyChanged(nameof(HeaderTitle));
            return;
        }

        ApplyCurrentViewModel(new HubViewModel(this, hub, tabKey));

    }

    private void ApplyCurrentViewModel(object? viewModel)

    {

        _currentViewModel = viewModel;

        OnPropertyChanged(nameof(CurrentViewModel));

        OnPropertyChanged(nameof(IsSubPage));

        OnPropertyChanged(nameof(IsDashboard));

        OnPropertyChanged(nameof(UsesFullPageLayout));

        OnPropertyChanged(nameof(IsSalesCounter));

        OnPropertyChanged(nameof(IsEntryWorkspace));

        OnPropertyChanged(nameof(HeaderTitle));

        OnPropertyChanged(nameof(SubPageTitle));

        GoBackCommand.RaiseCanExecuteChanged();

    }

    private void NavigateFromMenuSearch(object? parameter)
    {
        if (parameter is not NavigationItem item)
            return;

        SelectedNavigation = item;
        MenuSearchText = string.Empty;
    }

    private void ClearMenuSearch() => MenuSearchText = string.Empty;

    private void ToggleSidebarCollapse() => IsSidebarCollapsed = !IsSidebarCollapsed;

    private void RefreshMenuSearch()
    {
        MenuSearchResults.Clear();
        var term = MenuSearchText.Trim();
        if (term.Length == 0)
            return;

        foreach (var item in NavigationItems
                     .Where(i => MenuItemMatches(i, term))
                     .OrderBy(i => i.Section, StringComparer.OrdinalIgnoreCase)
                     .ThenBy(i => i.Title, StringComparer.OrdinalIgnoreCase))
        {
            MenuSearchResults.Add(item);
        }

        OnPropertyChanged(nameof(ShowMenuSearchEmpty));
    }

    private static bool MenuItemMatches(NavigationItem item, string term) =>
        item.Title.Contains(term, StringComparison.OrdinalIgnoreCase)
        || item.Section.Contains(term, StringComparison.OrdinalIgnoreCase)
        || item.Description.Contains(term, StringComparison.OrdinalIgnoreCase)
        || item.Key.Contains(term, StringComparison.OrdinalIgnoreCase);

    public void NavigateByKey(string key)
    {
        if (_itemsByKey.TryGetValue(key, out var item))
        {
            SelectedNavigation = item;
            return;
        }

        if (HubRegistry.IsHubNavKey(key))
            NavigateToHub(key);
    }



    private void TogglePin(object? parameter)

    {

        if (parameter is not NavigationItem item)

            return;



        item.IsPinned = !item.IsPinned;

        if (item.IsPinned)

        {

            if (!_settings.PinnedNavKeys.Contains(item.Key, StringComparer.Ordinal))

                _settings.PinnedNavKeys.Add(item.Key);

            AddToFavorites(item);

        }

        else

        {

            _settings.PinnedNavKeys.RemoveAll(k => string.Equals(k, item.Key, StringComparison.Ordinal));

            RemoveFromFavorites(item);

        }



        PersistNavigationSettings();
        OnPropertyChanged(nameof(ShowFavoritesSection));

    }



    private void ApplyPinnedState(IEnumerable<NavigationItem> items)

    {

        var pinned = new HashSet<string>(_settings.PinnedNavKeys, StringComparer.Ordinal);

        foreach (var item in items)

            item.IsPinned = pinned.Contains(item.Key);

    }



    private NavigationSectionViewModel CreateFavoritesSection() =>

        new(FavoritesSectionName, isFavorites: true) { IsExpanded = true };



    private List<NavigationSectionViewModel> BuildSections(IReadOnlyList<NavigationItem> items)

    {

        SyncFavoritesFromPins();

        return [_favoritesSection];

    }

    private List<SidebarNavItemViewModel> BuildSidebarItems()
    {
        var sidebarItems = new List<SidebarNavItemViewModel>();

        if (_itemsByKey.ContainsKey(NavKeys.Dashboard))
        {
            sidebarItems.Add(new SidebarNavItemViewModel
            {
                Key = NavKeys.Dashboard,
                Title = "Overview",
                IconGlyph = "\uE80F",
                Description = "KPIs, charts, and operational snapshot across your organization.",
                IsHub = false
            });
        }

        foreach (var hub in HubRegistry.All)
        {
            if (!hub.Tabs.Any(t => MenuPermissionSession.CanView(t.Key)))
                continue;

            sidebarItems.Add(new SidebarNavItemViewModel
            {
                Key = hub.HubNavKey,
                Title = hub.SidebarTitle,
                IconGlyph = hub.SidebarIconGlyph,
                Description = hub.SidebarDescription,
                IsHub = true
            });
        }

        return sidebarItems;
    }



    private void SyncFavoritesFromPins()

    {

        _favoritesSection.Items.Clear();

        foreach (var key in _settings.PinnedNavKeys)

        {

            if (_itemsByKey.TryGetValue(key, out var item))

                _favoritesSection.Items.Add(item);

        }

    }



    private void AddToFavorites(NavigationItem item)

    {

        if (_favoritesSection.Items.Contains(item))

            return;

        _favoritesSection.Items.Add(item);

        _favoritesSection.IsExpanded = true;
        OnPropertyChanged(nameof(ShowFavoritesSection));

    }



    private void RemoveFromFavorites(NavigationItem item)
    {
        _favoritesSection.Items.Remove(item);
        OnPropertyChanged(nameof(ShowFavoritesSection));
    }



    private void PersistNavigationSettings() => SettingsStore.Save(_settings);



    public void PrepareForShutdown() =>
        ThemeService.Instance.ThemeChanged -= OnThemeChanged;

    private void RequestLogout()
    {
        if (Application.Current?.MainWindow is MainWindow main)
            ApplicationShell.SignOutAndReturnToLogin(main);
    }

    private void OnThemeChanged(object? sender, EventArgs e)
    {
        if (!IsUiAvailable)
            return;

        ThemeBadgeText = ThemeService.Instance.Current.BadgeText;

        OnPropertyChanged(nameof(ThemeBadgeText));



        if (CurrentViewModel is SettingsViewModel settings)

        {

            settings.SyncSelectedTheme();

            return;

        }



        if (CurrentViewModel is SubPageViewModelBase
            or SalesEntryWorkspaceViewModelBase
            or PurchaseEntryWorkspaceViewModelBase)

            return;



        if (_selectedNavigation is not null)

        {

            if (HubRegistry.IsHubModuleNavKey(_selectedNavigation.Key))

            {

                var hub = HubRegistry.GetHubForModuleNavKey(_selectedNavigation.Key)!;

                NavigateToHub(hub.HubNavKey, _selectedNavigation.Key);

            }

            else

                NavigateToItem(_selectedNavigation);

        }

    }

    private async Task InitializeApiAsync()
    {
        if (!IsUiAvailable)
            return;

        AuthSession.RestoreToApiClient();

        if (!await ImsApiClient.CheckHealthAsync())
            return;

        if (!IsUiAvailable)
            return;

        await CompanyProfileService.RefreshAsync();
        RefreshCompanyBranding();

        ApiListLoader.RefreshCurrentPage(CurrentViewModel is HubViewModel hub
            ? hub.CurrentTabContent
            : CurrentViewModel);
    }

    private static List<NavigationItem> FilterNavigationByPermissions(IReadOnlyList<NavigationItem> items)
    {
        if (AuthSession.IsAdministrator)
            return items.ToList();

        return items.Where(i => MenuPermissionSession.CanView(i.Key)).ToList();
    }

    private static object? ResolveContentHost(object? viewModel)
    {
        if (viewModel is HubViewModel hub)
            return hub.CurrentTabContent;

        return viewModel;
    }

    private static string FormatWorkspaceHeader(string moduleTitle, string documentLabel) =>
        $"{moduleTitle} >> {documentLabel}";

}
