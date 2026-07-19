using System.ComponentModel;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;
using IMS.Helpers;
using IMS.Services;
using IMS.ViewModels;
using IMS.Services.Api;

namespace IMS;

public partial class App : Application
{
    private static int _errorDialogDepth;

    protected override void OnStartup(StartupEventArgs e)
    {
        // Login is a dialog; without this, closing it ends the app before MainWindow opens.
        ShutdownMode = ShutdownMode.OnExplicitShutdown;

        DispatcherUnhandledException += OnDispatcherUnhandledException;
        AppDomain.CurrentDomain.UnhandledException += OnAppDomainUnhandledException;
        TaskScheduler.UnobservedTaskException += OnUnobservedTaskException;
        FormKeyboardNavigation.Register();
        ThemeService.Initialize();
        PrintSettingsService.Initialize();
        SalesPurchaseSettingsService.Initialize();
        CommunicationSettingsService.Instance.Initialize();
        ImsApiClient.Initialize();
        base.OnStartup(e);

        if (!ApplicationShell.TryAuthenticate())
        {
            Shutdown();
            return;
        }

        ApplicationShell.ShowMainApplication();
    }

    protected override void OnSessionEnding(SessionEndingCancelEventArgs e)
    {
        if (MainWindow is not MainWindow mainWindow
            || mainWindow.ExitConfirmed
            || ApplicationState.IsShuttingDown)
        {
            base.OnSessionEnding(e);
            return;
        }

        e.Cancel = true;
        _ = ApplicationExitService.HandleMainWindowClosingAsync(
            mainWindow,
            new CancelEventArgs(),
            () =>
            {
                if (mainWindow.DataContext is MainViewModel main)
                    main.PrepareForShutdown();
            });
    }

    private static void OnDispatcherUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
    {
        if (ApplicationState.IsShuttingDown || _errorDialogDepth > 0)
        {
            e.Handled = true;
            return;
        }

        try
        {
            _errorDialogDepth++;
            MessageBox.Show(
                $"An unexpected error occurred:\n\n{e.Exception.Message}",
                "IMS",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
        }
        finally
        {
            _errorDialogDepth--;
        }

        e.Handled = true;
    }

    private static void OnAppDomainUnhandledException(object sender, UnhandledExceptionEventArgs e)
    {
        if (ApplicationState.IsShuttingDown || e.ExceptionObject is not Exception ex)
            return;

        ShowRuntimeError(ex);
    }

    private static void OnUnobservedTaskException(object? sender, UnobservedTaskExceptionEventArgs e)
    {
        if (ApplicationState.IsShuttingDown)
        {
            e.SetObserved();
            return;
        }

        var ex = e.Exception?.Flatten().InnerException ?? e.Exception;
        if (ex is not null)
            ShowRuntimeError(ex);

        e.SetObserved();
    }

    private static void ShowRuntimeError(Exception ex)
    {
        if (_errorDialogDepth > 0)
            return;

        try
        {
            _errorDialogDepth++;
            var dispatcher = Current?.Dispatcher;
            if (dispatcher is not null && !dispatcher.CheckAccess())
            {
                dispatcher.BeginInvoke(() => ShowRuntimeError(ex), DispatcherPriority.Normal);
                return;
            }

            MessageBox.Show(
                $"An unexpected error occurred:\n\n{ex.Message}",
                "IMS",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
        }
        finally
        {
            _errorDialogDepth--;
        }
    }
}
