using System.Net.Http;
using System.Windows;
using IMS.Services.Api;

namespace IMS.Services;

public static class EditDeleteGuard
{
    private static bool? _cachedConfirmationRequired;
    private static DateTime _cacheExpiresUtc = DateTime.MinValue;
    private static readonly TimeSpan PolicyCacheTtl = TimeSpan.FromSeconds(30);

    public static void InvalidatePolicyCache() => _cachedConfirmationRequired = null;

    public static async Task<bool> IsConfirmationRequiredAsync()
    {
        if (_cachedConfirmationRequired.HasValue && DateTime.UtcNow < _cacheExpiresUtc)
            return _cachedConfirmationRequired.Value;

        try
        {
            if (!await ImsApiClient.CheckHealthAsync())
            {
                _cachedConfirmationRequired = true;
                _cacheExpiresUtc = DateTime.UtcNow.Add(PolicyCacheTtl);
                return true;
            }

            var policy = await ImsApiClient.GetEditDeleteConfirmationPolicyAsync();
            var required = policy?.ConfirmationRequired ?? true;
            _cachedConfirmationRequired = required;
            _cacheExpiresUtc = DateTime.UtcNow.Add(PolicyCacheTtl);
            return required;
        }
        catch
        {
            _cachedConfirmationRequired = true;
            _cacheExpiresUtc = DateTime.UtcNow.Add(PolicyCacheTtl);
            return true;
        }
    }

    public static Task<bool> AuthorizeEditAsync(string module, string recordKey, string recordLabel) =>
        AuthorizeAsync("edit", module, recordKey, recordLabel);

    public static Task<bool> AuthorizeDeleteAsync(string module, string recordKey, string recordLabel) =>
        AuthorizeAsync("delete", module, recordKey, recordLabel);

    public static bool ConfirmDelete(string module, string recordKey, string recordLabel)
    {
        var label = string.IsNullOrWhiteSpace(recordLabel) ? recordKey : recordLabel;
        if (string.IsNullOrWhiteSpace(label))
            label = "this record";

        var message = string.IsNullOrWhiteSpace(module)
            ? $"Are you sure you want to delete \"{label}\"?\n\nThis action cannot be undone."
            : $"Are you sure you want to delete \"{label}\" from {module}?\n\nThis action cannot be undone.";

        var result = MessageBox.Show(
            message,
            "Confirm Delete",
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);

        return result == MessageBoxResult.Yes;
    }

    public static async Task<bool> AuthorizeAsync(
        string action,
        string module,
        string recordKey,
        string recordLabel)
    {
        if (string.Equals(action, "delete", StringComparison.OrdinalIgnoreCase)
            && !ConfirmDelete(module, recordKey, recordLabel))
            return false;

        if (!await IsConfirmationRequiredAsync())
            return true;

        var actionTitle = string.Equals(action, "delete", StringComparison.OrdinalIgnoreCase)
            ? "Confirm delete"
            : "Confirm edit";

        var label = string.IsNullOrWhiteSpace(recordLabel) ? recordKey : recordLabel;
        var description = string.Equals(action, "delete", StringComparison.OrdinalIgnoreCase)
            ? $"Enter the confirmation password to delete \"{label}\" ({recordKey}) in {module}."
            : $"Enter the confirmation password to edit \"{label}\" ({recordKey}) in {module}.";

        var owner = Application.Current?.MainWindow;
        var dialog = new ConfirmationPasswordWindow(actionTitle, description)
        {
            Owner = owner?.IsLoaded == true ? owner : null
        };

        if (dialog.ShowDialog() != true)
            return false;

        if (string.IsNullOrWhiteSpace(dialog.Password))
        {
            MessageBox.Show(
                "Confirmation password is required.",
                "Access denied",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return false;
        }

        try
        {
            var authorized = await ImsApiClient.VerifyEditDeletePasswordAsync(
                dialog.Password,
                action,
                module,
                recordKey);

            if (authorized)
                return true;

            MessageBox.Show(
                "Incorrect confirmation password. Edit/delete was not allowed.",
                "Access denied",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
            return false;
        }
        catch (ApiException ex)
        {
            MessageBox.Show(
                ex.Message,
                "Verification failed",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
            return false;
        }
        catch (HttpRequestException ex)
        {
            MessageBox.Show(
                ex.Message,
                "API unavailable",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
            return false;
        }
    }
}
