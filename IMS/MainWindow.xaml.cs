using System.ComponentModel;
using System.Windows;
using System.Windows.Input;
using IMS.Helpers;
using IMS.Services;
using IMS.ViewModels;

namespace IMS;

public partial class MainWindow : Window
{
    private bool _isFullScreen;
    private WindowState _restoreWindowState;
    private WindowStyle _restoreWindowStyle;
    private ResizeMode _restoreResizeMode;

    public MainWindow()
    {
        InitializeComponent();
        Loaded += (_, _) => WindowLayoutHelper.ApplyStartupMaximized(this);
    }

    internal bool ExitConfirmed { get; set; }

    private void MainWindow_OnPreviewKeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.F11)
        {
            WindowLayoutHelper.ToggleFullScreen(this, ref _isFullScreen,
                ref _restoreWindowState, ref _restoreWindowStyle, ref _restoreResizeMode);
            e.Handled = true;
            return;
        }

        if (e.Key == Key.Escape && _isFullScreen)
        {
            WindowLayoutHelper.ExitFullScreen(this, ref _isFullScreen,
                _restoreWindowState, _restoreWindowStyle, _restoreResizeMode);
            e.Handled = true;
        }
    }

    protected override void OnClosing(CancelEventArgs e)
    {
        if (ExitConfirmed)
        {
            base.OnClosing(e);
            return;
        }

        e.Cancel = true;

        _ = ApplicationExitService.HandleMainWindowClosingAsync(
            this,
            e,
            () =>
            {
                if (DataContext is MainViewModel main)
                    main.PrepareForShutdown();
            });
    }
}
