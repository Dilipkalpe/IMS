using System.Windows;
using IMS.Models;
using IMS.Views;

namespace IMS.Services;

public static class ExitBackupCoordinator
{
    private const string DialogTitle = "Database Backup";

    public static async Task<bool> TryExitAsync(Window? owner)
    {
        owner = ApplicationExitService.SafeOwner(owner);

        if (DatabaseBackupService.IsBackupInProgress)
        {
            MessageBox.Show(
                owner,
                "A database backup is still running. Please wait for it to finish.",
                DialogTitle,
                MessageBoxButton.OK,
                MessageBoxImage.Information);
            return false;
        }

        var settings = SettingsStore.Load();
        return settings.ExitBackupPreference switch
        {
            ExitBackupPreference.NeverAskAgain => true,
            ExitBackupPreference.AlwaysBackupBeforeExit => await RunMandatoryBackupAsync(owner),
            _ => await PromptAndHandleAsync(owner)
        };
    }

    private static async Task<bool> PromptAndHandleAsync(Window? owner)
    {
        var choice = ExitConfirmWindow.ShowDialog(owner);
        return choice switch
        {
            ExitConfirmChoice.BackupAndClose => await RunBackupAndCloseAsync(owner),
            ExitConfirmChoice.CloseWithoutBackup => true,
            _ => false
        };
    }

    private static async Task<bool> RunMandatoryBackupAsync(Window? owner) =>
        await RunBackupAndCloseAsync(owner);

    private static async Task<bool> RunBackupAndCloseAsync(Window? owner)
    {
        BackupProgressWindow? progress = null;
        try
        {
            progress = new BackupProgressWindow(owner);
            progress.Show();
            var reporter = new Progress<string>(progress.Report);
            var result = await DatabaseBackupService.RunBackupAsync(reporter);
            SafeClose(progress);

            MessageBox.Show(
                owner,
                $"Database backup completed successfully.\n\nFile: {result.FileName}\nLocation: {result.FilePath}",
                DialogTitle,
                MessageBoxButton.OK,
                MessageBoxImage.Information);
            return true;
        }
        catch (Exception ex)
        {
            if (progress is not null)
                SafeClose(progress);
            return await HandleBackupFailureAsync(owner, ex);
        }
    }

    private static void SafeClose(Window? window)
    {
        if (window is null)
            return;

        try
        {
            window.Close();
        }
        catch
        {
            // Window may already be closing.
        }
    }

    private static Task<bool> HandleBackupFailureAsync(Window? owner, Exception ex)
    {
        var message = ex switch
        {
            Api.ApiException apiEx => apiEx.Message,
            InvalidOperationException opEx => opEx.Message,
            _ => ex.Message
        };

        var choice = BackupFailureExitWindow.ShowDialog(owner, message);
        return Task.FromResult(choice == ExitConfirmChoice.CloseWithoutBackup);
    }
}
