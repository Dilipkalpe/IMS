using System.Windows;
using IMS.Helpers;
using IMS.Services.Api;
using IMS.ViewModels;

namespace IMS.Services;

/// <summary>Login gate and main ERP shell (dashboard-first).</summary>
public static class ApplicationShell
{
    public static bool TryAuthenticate()
    {
        var login = new LoginWindow();
        var ok = login.ShowDialog() == true && AuthSession.IsAuthenticated;
        return ok;
    }

    public static void ShowMainApplication()
    {
        ApiConfiguration.LoadFromSettings();
        ImsApiClient.Initialize();
        AuthSession.RestoreToApiClient();

        var main = new MainWindow();
        WindowLayoutHelper.ApplyStartupMaximized(main);

        if (Application.Current is { } app)
            app.MainWindow = main;

        main.Closed += (_, _) =>
        {
            if (ApplicationState.IsSigningOut)
                return;

            if (Application.Current is { } application && !application.Dispatcher.HasShutdownStarted)
                application.Shutdown();
        };

        main.Loaded += (_, _) =>
        {
            if (main.DataContext is MainViewModel vm)
                vm.NavigateByKey(NavKeys.Dashboard);

            main.Activate();
            main.Focus();
        };

        main.Show();
    }

    public static void SignOutAndReturnToLogin(MainWindow main)
    {
        var confirm = MessageBox.Show(
            "Sign out and return to the login screen?",
            "Sign Out",
            MessageBoxButton.YesNo,
            MessageBoxImage.Question);
        if (confirm != MessageBoxResult.Yes)
            return;

        if (main.DataContext is MainViewModel vm)
            vm.PrepareForShutdown();

        AuthSession.Clear();
        ApplicationState.IsSigningOut = true;
        main.ExitConfirmed = true;
        main.Close();
        ApplicationState.IsSigningOut = false;

        if (!TryAuthenticate())
        {
            Application.Current.Shutdown();
            return;
        }

        ShowMainApplication();
    }
}
