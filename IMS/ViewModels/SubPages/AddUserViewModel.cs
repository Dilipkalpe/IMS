using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.ViewModels.SubPages;

public sealed class AddUserViewModel : FormSubPageViewModel
{
    private static readonly string[] DefaultRoleOptions =
        ["Administrator", "Manager", "Sales", "Purchase", "Store", "Accounts", "Viewer"];

    public static async Task<IReadOnlyList<string>> GetRoleOptionsAsync()
    {
        try
        {
            if (ImsApiClient.IsAvailable && AuthSession.IsAdministrator)
            {
                var names = await ImsApiClient.GetActiveRoleNamesAsync();
                if (names.Count > 0)
                    return names;
            }
        }
        catch
        {
            // Fall back to built-in role names.
        }

        return DefaultRoleOptions;
    }

    private static readonly string[] DepartmentOptions =
        ["Administration", "Sales", "Purchase", "Inventory", "Finance", "Production"];

    private readonly MainViewModel _host;
    private readonly bool _isEdit;
    private readonly string _originalUsername = string.Empty;

    public AddUserViewModel(MainViewModel host, IReadOnlyList<string>? roleOptions = null) : base(
        host,
        parentTitle: "Users",
        pageTitle: "Add User",
        pageDescription: "Create a user with role and department access.",
        iconGlyph: "\uE77B",
        fields:
        [
            new("Username *", FormFieldKind.Text, "e.g. jsmith"),
            new("Full Name *", FormFieldKind.Text, "e.g. John Smith"),
            new("Password *", FormFieldKind.Text, "minimum 6 characters"),
            new("Role *", FormFieldKind.Combo, options: roleOptions ?? DefaultRoleOptions, defaultValue: "Viewer"),
            new("Department", FormFieldKind.Combo, options: DepartmentOptions, defaultValue: "Administration"),
            new("Email", FormFieldKind.Text, "user@company.com"),
            new("Status", FormFieldKind.Combo, options: ["Active", "Inactive"], defaultValue: "Active"),
            new("Barcode label printing", FormFieldKind.Boolean, defaultValue: "false")
        ])
    {
        _host = host;
        SaveCommand = new AsyncRelayCommand(SaveAsync);
    }

    public AddUserViewModel(MainViewModel host, MockRow existing, IReadOnlyList<string>? roleOptions = null) : base(
        host,
        parentTitle: "Users",
        pageTitle: "Edit User",
        pageDescription: "Update user role, department, and status.",
        iconGlyph: "\uE70F",
        fields:
        [
            new("Username *", FormFieldKind.Text, "e.g. jsmith", existing.Col1),
            new("Full Name *", FormFieldKind.Text, "e.g. John Smith"),
            new("Password", FormFieldKind.Text, "leave blank to keep existing"),
            new("Role *", FormFieldKind.Combo, options: roleOptions ?? DefaultRoleOptions, defaultValue: existing.Col2),
            new("Department", FormFieldKind.Combo, options: DepartmentOptions, defaultValue: existing.Col3 == "—" ? "Administration" : existing.Col3),
            new("Email", FormFieldKind.Text, "user@company.com"),
            new("Status", FormFieldKind.Combo, options: ["Active", "Inactive"], defaultValue: existing.Status ?? "Active"),
            new("Barcode label printing", FormFieldKind.Boolean, defaultValue: "false")
        ])
    {
        _host = host;
        _isEdit = true;
        _originalUsername = existing.Col1;
        SaveCommand = new AsyncRelayCommand(SaveAsync);
        _ = LoadUserAsync(existing.Col1);
    }

    private async Task LoadUserAsync(string username)
    {
        if (!ImsApiClient.IsAvailable)
            return;

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var user = await ImsApiClient.GetUserByUsernameAsync(username);
            if (user is null)
                return;

            SetFieldValue("Username *", user.Username);
            SetFieldValue("Full Name *", user.FullName);
            SetComboValue("Role *", user.Role);
            SetComboValue("Department", string.IsNullOrWhiteSpace(user.Department) ? "Administration" : user.Department);
            SetFieldValue("Email", user.Email ?? string.Empty);
            SetComboValue("Status", user.ActiveStatus ? "Active" : "Inactive");
            SetBarcodePermission(user.CanPrintBarcodeLabels);
        });
    }

    private void SetBarcodePermission(bool enabled)
    {
        var field = Fields.FirstOrDefault(f => f.Label == "Barcode label printing");
        if (field is not null)
            field.BoolValue = enabled;
    }

    private bool GetBarcodePermission() =>
        Fields.FirstOrDefault(f => f.Label == "Barcode label printing")?.BoolValue == true;

    private async Task SaveAsync()
    {
        var username = GetFieldValue("Username *");
        var fullName = GetFieldValue("Full Name *");
        var role = GetComboValue("Role *");
        var department = GetComboValue("Department");
        var email = GetFieldValue("Email");
        var password = GetFieldValue(_isEdit ? "Password" : "Password *");
        var status = GetComboValue("Status");
        var active = !string.Equals(status, "Inactive", StringComparison.OrdinalIgnoreCase);

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(fullName) || string.IsNullOrWhiteSpace(role))
        {
            MessageBox.Show("Username, full name, and role are required.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (!_isEdit && string.IsNullOrWhiteSpace(password))
        {
            MessageBox.Show("Password is required for new users.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (!string.IsNullOrWhiteSpace(password) && password.Length < 6)
        {
            MessageBox.Show("Password must be at least 6 characters.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (ImsApiClient.IsAvailable)
        {
            var ok = false;
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var dto = ApiDocumentMapper.FromUserForm(
                    username, fullName, role, department, email, password, active, GetBarcodePermission());
                if (_isEdit)
                    await ImsApiClient.UpdateUserByUsernameAsync(_originalUsername, dto);
                else
                    await ImsApiClient.CreateUserAsync(dto);

                ok = true;
            });
            if (!ok)
                return;
        }

        _host.GoBack();
    }

    private string GetFieldValue(string label) =>
        Fields.FirstOrDefault(f => f.Label == label)?.Value.Trim() ?? string.Empty;

    private void SetFieldValue(string label, string value)
    {
        var field = Fields.FirstOrDefault(f => f.Label == label);
        if (field is not null)
            field.Value = value;
    }

    private string GetComboValue(string label) =>
        Fields.FirstOrDefault(f => f.Label == label)?.SelectedOption ?? string.Empty;

    private void SetComboValue(string label, string value)
    {
        var field = Fields.FirstOrDefault(f => f.Label == label);
        if (field is not null)
            field.SelectedOption = value;
    }
}
