using System.ComponentModel;
using System.Windows;
using System.Windows.Threading;
using IMS.Helpers;

namespace IMS.Services;

/// <summary>Central exit flow: backup prompt, backup execution, then shutdown.</summary>
public static class ApplicationExitService
{
    public static async Task<bool> ConfirmExitAsync(Window? owner)
    {
        if (ApplicationState.IsShuttingDown)
            return true;

        return await ExitBackupCoordinator.TryExitAsync(SafeOwner(owner));
    }

    public static void RequestClose(Window window)
    {
        if (window is null)
            return;

        if (window is MainWindow main && !main.ExitConfirmed)
        {
            main.Close();
            return;
        }

        window.Close();
    }

    public static async Task HandleMainWindowClosingAsync(
        MainWindow window,
        CancelEventArgs e,
        Action prepareForShutdown)
    {
        try
        {
            if (window.ExitConfirmed || ApplicationState.IsShuttingDown)
            {
                ApplicationState.IsShuttingDown = true;
                prepareForShutdown();
                return;
            }

            var proceed = await ConfirmExitAsync(window).ConfigureAwait(true);
            if (!proceed)
                return;

            ScheduleShutdown(window, prepareForShutdown);
        }
        catch (Exception ex)
        {
            window.ExitConfirmed = false;
            ApplicationState.IsShuttingDown = false;

            MessageBox.Show(
                $"Could not complete the exit process:\n\n{ex.Message}\n\nThe application will stay open.",
                "Close Application",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
        }
    }

    /// <summary>
    /// Finish exit after the current <see cref="Window.Closing"/> handler returns (avoids re-entrant Close/ShowDialog).
    /// </summary>
    private static void ScheduleShutdown(MainWindow window, Action prepareForShutdown)
    {
        window.ExitConfirmed = true;
        ApplicationState.IsShuttingDown = true;
        prepareForShutdown();

        _ = window.Dispatcher.BeginInvoke(() =>
        {
            try
            {
                if (Application.Current is { } app)
                    app.Shutdown();
                else
                    window.Close();
            }
            catch
            {
                try
                {
                    window.Close();
                }
                catch
                {
                    // Window already closing — ignore.
                }
            }
        }, DispatcherPriority.ApplicationIdle);
    }

    internal static Window? SafeOwner(Window? owner) =>
        owner is { IsLoaded: true } ? owner : Application.Current?.MainWindow is { IsLoaded: true } mw ? mw : null;
}
