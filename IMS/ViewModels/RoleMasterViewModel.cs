using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Input;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels;

public sealed class RoleMasterViewModel : ViewModelBase
{
    private readonly MainViewModel _host;
    private RoleDto? _selectedRole;
    private bool _isBusy;
    private string _statusMessage = string.Empty;

    public RoleMasterViewModel(MainViewModel host)
    {
        _host = host;
        Roles = new ObservableCollection<RoleDto>();

        RefreshCommand = new RelayCommand(() => _ = LoadAsync(), () => !IsBusy);
        AddCommand = new RelayCommand(() => OpenForm(null), () => !IsBusy && CanManageRoles);
        EditCommand = new RelayCommand(() => OpenForm(SelectedRole), () => !IsBusy && SelectedRole is not null && CanManageRoles);
        DeleteCommand = new RelayCommand(() => _ = DeleteSelectedAsync(),
            () => !IsBusy && SelectedRole is not null && !SelectedRole.IsSystem && CanManageRoles);
        ToggleActiveCommand = new RelayCommand(() => _ = ToggleActiveAsync(),
            () => !IsBusy && SelectedRole is not null && !SelectedRole.IsSystem && CanManageRoles);

        _ = LoadAsync();
    }

    public string Title => "Roles & Permissions";
    public string Description => "Define roles and assign menu permissions (View, Add, Edit, Delete, Export).";

    public ObservableCollection<RoleDto> Roles { get; }

    public bool CanManageRoles => MenuPermissionSession.CanManageRoles;

    public bool HasRoles => Roles.Count > 0;

    public bool ShowEmptyState => !IsBusy && !HasRoles;

    public RoleDto? SelectedRole
    {
        get => _selectedRole;
        set
        {
            if (SetProperty(ref _selectedRole, value))
            {
                RaiseCommandStates();
                OnPropertyChanged(nameof(ToggleActiveButtonText));
            }
        }
    }

    public string ToggleActiveButtonText =>
        SelectedRole?.IsActive == false ? "Activate" : "Deactivate";

    public bool IsBusy
    {
        get => _isBusy;
        private set
        {
            if (SetProperty(ref _isBusy, value))
            {
                RaiseCommandStates();
                OnPropertyChanged(nameof(ShowEmptyState));
            }
        }
    }

    public string StatusMessage
    {
        get => _statusMessage;
        private set => SetProperty(ref _statusMessage, value);
    }

    public ICommand RefreshCommand { get; }
    public ICommand AddCommand { get; }
    public ICommand EditCommand { get; }
    public ICommand DeleteCommand { get; }
    public ICommand ToggleActiveCommand { get; }

    public void EditSelectedRole()
    {
        if (SelectedRole is not null && CanManageRoles)
            OpenForm(SelectedRole);
    }

    private void RaiseCommandStates()
    {
        (RefreshCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (AddCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (EditCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (DeleteCommand as RelayCommand)?.RaiseCanExecuteChanged();
        (ToggleActiveCommand as RelayCommand)?.RaiseCanExecuteChanged();
    }

    private async Task LoadAsync()
    {
        if (IsBusy)
            return;

        IsBusy = true;
        try
        {
            StatusMessage = "Loading roles…";
            var items = await ImsApiClient.GetRolesAsync();
            Roles.Clear();
            foreach (var role in items.OrderBy(r => r.RoleName))
                Roles.Add(role);

            SelectedRole = Roles.FirstOrDefault(r => r.Id == SelectedRole?.Id) ?? Roles.FirstOrDefault();
            OnPropertyChanged(nameof(HasRoles));
            OnPropertyChanged(nameof(ShowEmptyState));
            StatusMessage = Roles.Count == 0
                ? "No roles defined. Click Add role to create one."
                : $"{Roles.Count} role(s) loaded.";
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

    private void OpenForm(RoleDto? role)
    {
        _host.NavigateToSubPage(new RoleFormViewModel(_host, role, () => _ = LoadAsync()));
    }

    private async Task DeleteSelectedAsync()
    {
        if (SelectedRole is null)
            return;

        var confirm = MessageBox.Show(
            $"Delete role \"{SelectedRole.RoleName}\"?\n\nUsers assigned to this role must be reassigned first.",
            "Confirm delete",
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);
        if (confirm != MessageBoxResult.Yes)
            return;

        if (IsBusy)
            return;

        IsBusy = true;
        try
        {
            await ImsApiClient.DeleteRoleAsync(SelectedRole.Id);
            await LoadAsync();
        }
        catch (Exception ex)
        {
            MessageBox.Show(ex.Message, "Delete role", MessageBoxButton.OK, MessageBoxImage.Error);
        }
        finally
        {
            IsBusy = false;
        }
    }

    private async Task ToggleActiveAsync()
    {
        if (SelectedRole is null)
            return;

        if (IsBusy)
            return;

        IsBusy = true;
        try
        {
            await ImsApiClient.SetRoleActiveAsync(SelectedRole.Id, !SelectedRole.IsActive);
            await LoadAsync();
        }
        catch (Exception ex)
        {
            MessageBox.Show(ex.Message, "Role status", MessageBoxButton.OK, MessageBoxImage.Error);
        }
        finally
        {
            IsBusy = false;
        }
    }
}
