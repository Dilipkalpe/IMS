using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Windows;
using System.Windows.Data;
using System.Windows.Input;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.ViewModels.SubPages;

namespace IMS.ViewModels;

public sealed class RoleFormViewModel : SubPageViewModelBase
{
    private readonly RoleDto? _existing;
    private readonly Action _onSaved;
    private string _roleName = string.Empty;
    private bool _isActive = true;
    private bool _isBusy;
    private string _statusMessage = string.Empty;
    private string _menuFilterText = string.Empty;

    public RoleFormViewModel(MainViewModel host, RoleDto? existing, Action onSaved)
        : base(
            host,
            parentTitle: "Role Master",
            pageTitle: existing is null ? "Add Role" : "Edit Role",
            pageDescription: "Select menus and assign View / Add / Edit / Delete / Export permissions.",
            iconGlyph: "\uE72E")
    {
        _existing = existing;
        _onSaved = onSaved;
        PermissionRows = new ObservableCollection<RolePermissionRowViewModel>();
        PermissionRowsView = CollectionViewSource.GetDefaultView(PermissionRows);
        PermissionRowsView.Filter = FilterPermissionRow;

        SaveCommand = new AsyncRelayCommand(SaveAsync, () => !IsBusy);
        SelectAllViewCommand = new RelayCommand(SelectAllView, () => !IsBusy);
        ClearAllPermissionsCommand = new RelayCommand(ClearAllPermissions, () => !IsBusy);
        ClearMenuFilterCommand = new RelayCommand(
            () => MenuFilterText = string.Empty,
            () => !string.IsNullOrWhiteSpace(MenuFilterText));

        _ = LoadAsync();
    }

    public ObservableCollection<RolePermissionRowViewModel> PermissionRows { get; }
    public ICollectionView PermissionRowsView { get; }

    public string RoleName
    {
        get => _roleName;
        set => SetProperty(ref _roleName, value);
    }

    public bool IsActive
    {
        get => _isActive;
        set => SetProperty(ref _isActive, value);
    }

    public string MenuFilterText
    {
        get => _menuFilterText;
        set
        {
            if (!SetProperty(ref _menuFilterText, value))
                return;

            PermissionRowsView.Refresh();
            OnPropertyChanged(nameof(FilteredRowCount));
            (ClearMenuFilterCommand as RelayCommand)?.RaiseCanExecuteChanged();
        }
    }

    public int FilteredRowCount => PermissionRowsView.Cast<object>().Count();

    public bool IsEdit => _existing is not null;
    public bool IsSystemRole => _existing?.IsSystem == true;
    public bool CanEditRoleFields => !IsSystemRole;

    public bool IsBusy
    {
        get => _isBusy;
        private set
        {
            if (SetProperty(ref _isBusy, value))
            {
                (SaveCommand as AsyncRelayCommand)?.RaiseCanExecuteChanged();
                (SelectAllViewCommand as RelayCommand)?.RaiseCanExecuteChanged();
                (ClearAllPermissionsCommand as RelayCommand)?.RaiseCanExecuteChanged();
            }
        }
    }

    public string StatusMessage
    {
        get => _statusMessage;
        private set => SetProperty(ref _statusMessage, value);
    }

    public ICommand SelectAllViewCommand { get; }
    public ICommand ClearAllPermissionsCommand { get; }
    public ICommand ClearMenuFilterCommand { get; }

    private async Task LoadAsync()
    {
        if (IsBusy)
            return;

        IsBusy = true;
        try
        {
            StatusMessage = "Loading menus…";
            RoleDetailResponseDto detail;
            if (_existing is not null)
            {
                detail = await ImsApiClient.GetRoleAsync(_existing.Id);
                RoleName = detail.Role?.RoleName ?? _existing.RoleName;
                IsActive = detail.Role?.IsActive ?? _existing.IsActive;
            }
            else
            {
                var tree = await ImsApiClient.GetMenuTreeAsync();
                detail = new RoleDetailResponseDto { Menus = tree.Menus };
            }

            BuildRows(detail.Menus, detail.Permissions);
            StatusMessage = $"{PermissionRows.Count} menu row(s) loaded.";
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

    private void BuildRows(IReadOnlyList<MenuMasterDto> menus, IReadOnlyList<MenuPermissionDto> permissions)
    {
        PermissionRows.Clear();
        var permByKey = permissions.ToDictionary(p => p.MenuKey, StringComparer.OrdinalIgnoreCase);
        var allRows = new List<RolePermissionRowViewModel>();

        foreach (var menu in menus)
            AppendMenu(menu, 0, null, permByKey, allRows);

        foreach (var row in allRows)
        {
            permByKey.TryGetValue(row.MenuKey, out var perm);
            row.ApplyPermission(perm, notifyOnly: true);
            PermissionRows.Add(row);
        }

        SyncAllParents();
        PermissionRowsView.Refresh();
        OnPropertyChanged(nameof(FilteredRowCount));
    }

    private static void AppendMenu(
        MenuMasterDto menu,
        int indent,
        RolePermissionRowViewModel? parent,
        IReadOnlyDictionary<string, MenuPermissionDto> permByKey,
        ICollection<RolePermissionRowViewModel> allRows)
    {
        var row = new RolePermissionRowViewModel(menu.MenuKey, menu.MenuName, indent, menu.IsSection, parent);
        allRows.Add(row);
        foreach (var child in menu.Children.OrderBy(c => c.MenuOrder).ThenBy(c => c.MenuName))
            AppendMenu(child, indent + 1, row, permByKey, allRows);
    }

    private void SyncAllParents()
    {
        foreach (var row in PermissionRows.OrderByDescending(r => r.Indent))
        {
            if (row.Children.Count > 0)
                row.SyncFromChildren();
        }
    }

    private bool FilterPermissionRow(object item)
    {
        if (item is not RolePermissionRowViewModel row)
            return false;

        var filter = MenuFilterText.Trim();
        if (filter.Length == 0)
            return true;

        if (row.MenuName.Contains(filter, StringComparison.OrdinalIgnoreCase))
            return true;

        return RowOrDescendantMatches(row, filter);
    }

    private static bool RowOrDescendantMatches(RolePermissionRowViewModel row, string filter)
    {
        foreach (var child in row.Children)
        {
            if (child.MenuName.Contains(filter, StringComparison.OrdinalIgnoreCase))
                return true;

            if (RowOrDescendantMatches(child, filter))
                return true;
        }

        return false;
    }

    private void SelectAllView()
    {
        foreach (var row in PermissionRows.Where(r => r.Parent is null))
            row.GrantViewToSubtree();

        SyncAllParents();
    }

    private void ClearAllPermissions()
    {
        foreach (var row in PermissionRows.Where(r => r.Parent is null))
            row.ClearPermissions();

        SyncAllParents();
    }

    private async Task SaveAsync()
    {
        var name = RoleName.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            MessageBox.Show("Role name is required.", "Validation", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        var permissions = PermissionRows
            .Select(r => r.ToDto())
            .Where(p => p.CanView || p.CanAdd || p.CanEdit || p.CanDelete || p.CanExport)
            .ToList();

        if (!permissions.Any(p => p.CanView && !IsSectionRow(p.MenuKey)))
        {
            MessageBox.Show("At least one menu View permission must be selected.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        var body = new RoleSaveRequestDto
        {
            RoleName = name,
            IsActive = IsActive,
            Permissions = permissions
        };

        if (IsBusy)
            return;

        IsBusy = true;
        try
        {
            if (_existing is null)
                await ImsApiClient.CreateRoleAsync(body);
            else
                await ImsApiClient.UpdateRoleAsync(_existing.Id, body);

            _onSaved();
            Host.GoBack();
        }
        catch (Exception ex)
        {
            MessageBox.Show(ex.Message, "Save role", MessageBoxButton.OK, MessageBoxImage.Error);
        }
        finally
        {
            IsBusy = false;
        }
    }

    private static bool IsSectionRow(string menuKey) =>
        menuKey.StartsWith("section-", StringComparison.OrdinalIgnoreCase);
}
