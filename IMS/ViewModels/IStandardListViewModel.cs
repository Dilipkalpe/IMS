using System.Collections.ObjectModel;

using System.Windows.Input;

using IMS.Models;

using IMS.Services;



namespace IMS.ViewModels;



public interface IStandardListViewModel

{

    string PageTitle { get; }

    string ModuleKey { get; }

    IReadOnlyList<ListColumnDef> AllColumns { get; }

    IReadOnlyList<string> VisibleColumnKeys { get; }

    ObservableCollection<StandardListRow> GridRows { get; }

    ObservableCollection<MockStat> Stats { get; }

    IReadOnlyList<SubPageAction> SubPageActions { get; }



    string SearchText { get; set; }

    string? StatusFilter { get; set; }

    IReadOnlyList<string>? StatusFilterOptions { get; }

    string? SearchToolTip { get; }

    string StatusMessage { get; }

    string EmptyStateMessage { get; }

    string LoadingSubtitle { get; }

    string CurrentSortField { get; }

    string CurrentSortDir { get; }



    bool ShowListContent { get; }

    /// <summary>Alias for <see cref="ShowInitialLoadingOverlay"/> (first paint).</summary>
    bool ShowLoadingOverlay { get; }

    bool ShowInitialLoadingOverlay { get; }

    bool ShowBusyOverlay { get; }

    bool IsListBusy { get; }

    string BusyLoadingSubtitle { get; }

    bool ShowEmptyState { get; }

    bool CanExportData { get; }

    bool ShowStatusFilter { get; }

    bool ShowViewAction { get; }

    bool ShowPrintAction { get; }

    bool ShowEditAction { get; }

    bool ShowDesignLayoutAction { get; }

    bool ShowDeleteAction { get; }

    bool ShowBomAction { get; }

    bool ShowBarcodeLabelAction { get; }



    IReadOnlyList<int> PageSizeOptions { get; }

    int SelectedPageSize { get; set; }

    int CurrentPage { get; set; }

    int TotalPages { get; }

    string PageInfo { get; }



    ICommand RefreshCommand { get; }

    ICommand ManageColumnsCommand { get; }

    ICommand ExportDataCommand { get; }

    ICommand SortColumnCommand { get; }

    ICommand ClearFiltersCommand { get; }

    ICommand? ViewRowCommand { get; }

    ICommand? EditRowCommand { get; }

    ICommand? DeleteRowCommand { get; }

    ICommand? PrintRowCommand { get; }

    ICommand? BomRowCommand { get; }

    ICommand? BarcodeLabelRowCommand { get; }

    ICommand FirstPageCommand { get; }

    ICommand PreviousPageCommand { get; }

    ICommand NextPageCommand { get; }

    ICommand LastPageCommand { get; }



    event EventHandler? ColumnVisibilityChanged;



    void ApplySort(string field);

    bool IsColumnVisible(string key);

}

