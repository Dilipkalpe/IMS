using System.Collections.ObjectModel;
using System.Windows;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels;

public sealed class RolePermissionRowViewModel : ViewModelBase
{
    private bool _syncing;
    private bool _canView;
    private bool _canAdd;
    private bool _canEdit;
    private bool _canDelete;
    private bool _canExport;

    public RolePermissionRowViewModel(
        string menuKey,
        string menuName,
        int indent,
        bool isSection,
        RolePermissionRowViewModel? parent)
    {
        MenuKey = menuKey;
        MenuName = menuName;
        Indent = indent;
        IsSection = isSection;
        Parent = parent;
        Children = new ObservableCollection<RolePermissionRowViewModel>();
        if (parent is not null)
            parent.Children.Add(this);
    }

    public string MenuKey { get; }
    public string MenuName { get; }
    public int Indent { get; }
    public bool IsSection { get; }
    public RolePermissionRowViewModel? Parent { get; }
    public ObservableCollection<RolePermissionRowViewModel> Children { get; }

    public Thickness MenuNameMargin => new(Indent * 18, 0, 0, 0);

    public FontWeight MenuNameWeight => IsSection ? FontWeights.SemiBold : FontWeights.Normal;

    public bool CanSetDetailPermissions => !IsSection;

    public bool? ViewCheckState
    {
        get
        {
            if (Children.Count == 0)
                return CanView;

            if (Children.All(c => c.CanView))
                return true;

            if (Children.All(c => !c.CanView))
                return false;

            return null;
        }
        set
        {
            if (value == true)
                CanView = true;
            else if (value == false)
                CanView = false;
        }
    }

    public bool CanView
    {
        get => _canView;
        set => SetCanView(value, cascadeToChildren: true);
    }

    public bool CanAdd
    {
        get => _canAdd;
        set
        {
            if (!SetProperty(ref _canAdd, value))
                return;

            if (value && !CanView)
                SetCanView(true, cascadeToChildren: false);
        }
    }

    public bool CanEdit
    {
        get => _canEdit;
        set
        {
            if (!SetProperty(ref _canEdit, value))
                return;

            if (value && !CanView)
                SetCanView(true, cascadeToChildren: false);
        }
    }

    public bool CanDelete
    {
        get => _canDelete;
        set
        {
            if (!SetProperty(ref _canDelete, value))
                return;

            if (value && !CanView)
                SetCanView(true, cascadeToChildren: false);
        }
    }

    public bool CanExport
    {
        get => _canExport;
        set
        {
            if (!SetProperty(ref _canExport, value))
                return;

            if (value && !CanView)
                SetCanView(true, cascadeToChildren: false);
        }
    }

    public void ApplyPermission(MenuPermissionDto? permission, bool notifyOnly = false)
    {
        _syncing = true;
        if (notifyOnly)
        {
            _canView = permission?.CanView == true;
            _canAdd = permission?.CanAdd == true;
            _canEdit = permission?.CanEdit == true;
            _canDelete = permission?.CanDelete == true;
            _canExport = permission?.CanExport == true;
            OnPropertyChanged(nameof(CanView));
            OnPropertyChanged(nameof(CanAdd));
            OnPropertyChanged(nameof(CanEdit));
            OnPropertyChanged(nameof(CanDelete));
            OnPropertyChanged(nameof(CanExport));
            OnPropertyChanged(nameof(ViewCheckState));
        }
        else
        {
            SetCanView(permission?.CanView == true, cascadeToChildren: false);
            CanAdd = permission?.CanAdd == true;
            CanEdit = permission?.CanEdit == true;
            CanDelete = permission?.CanDelete == true;
            CanExport = permission?.CanExport == true;
        }

        _syncing = false;
    }

    public void SyncFromChildren()
    {
        if (Children.Count == 0)
            return;

        _syncing = true;
        var allView = Children.All(c => c.CanView);
        var anyView = Children.Any(c => c.CanView);

        _canView = allView;
        OnPropertyChanged(nameof(CanView));

        if (!anyView)
        {
            _canAdd = false;
            _canEdit = false;
            _canDelete = false;
            _canExport = false;
            OnPropertyChanged(nameof(CanAdd));
            OnPropertyChanged(nameof(CanEdit));
            OnPropertyChanged(nameof(CanDelete));
            OnPropertyChanged(nameof(CanExport));
        }

        OnPropertyChanged(nameof(ViewCheckState));
        _syncing = false;
        Parent?.SyncFromChildren();
    }

    public void ClearPermissions()
    {
        SetCanView(false, cascadeToChildren: true);
    }

    public void GrantViewToSubtree()
    {
        SetCanView(true, cascadeToChildren: true);
    }

    public MenuPermissionDto ToDto() => new()
    {
        MenuKey = MenuKey,
        CanView = CanView,
        CanAdd = CanAdd,
        CanEdit = CanEdit,
        CanDelete = CanDelete,
        CanExport = CanExport
    };

    private void SetCanView(bool value, bool cascadeToChildren)
    {
        if (!SetProperty(ref _canView, value))
            return;

        if (_syncing)
            return;

        _syncing = true;
        if (!value)
        {
            _canAdd = false;
            _canEdit = false;
            _canDelete = false;
            _canExport = false;
            OnPropertyChanged(nameof(CanAdd));
            OnPropertyChanged(nameof(CanEdit));
            OnPropertyChanged(nameof(CanDelete));
            OnPropertyChanged(nameof(CanExport));
        }

        if (cascadeToChildren)
        {
            foreach (var child in Children)
                child.SetCanView(value, cascadeToChildren: true);
        }

        OnPropertyChanged(nameof(ViewCheckState));
        Parent?.SyncFromChildren();
        _syncing = false;
    }
}
