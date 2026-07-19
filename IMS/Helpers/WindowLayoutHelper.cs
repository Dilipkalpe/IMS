using System.Windows;

namespace IMS.Helpers;

public static class WindowLayoutHelper
{
    /// <summary>Fills the monitor work area (taskbar excluded), maximized.</summary>
    public static void ApplyStartupMaximized(Window window)
    {
        var area = SystemParameters.WorkArea;
        window.WindowStartupLocation = WindowStartupLocation.Manual;
        window.Left = area.Left;
        window.Top = area.Top;
        window.Width = area.Width;
        window.Height = area.Height;
        window.WindowState = WindowState.Maximized;
    }

    /// <summary>Centers the login dialog and scales it to the current screen.</summary>
    public static void ApplyLoginDialogSize(Window window, double designWidth = 1100, double designHeight = 780)
    {
        var area = SystemParameters.WorkArea;
        window.Width = Math.Min(designWidth, area.Width * 0.92);
        window.Height = Math.Min(designHeight, area.Height * 0.92);
        window.Left = area.Left + (area.Width - window.Width) / 2;
        window.Top = area.Top + (area.Height - window.Height) / 2;
        window.WindowStartupLocation = WindowStartupLocation.Manual;
    }

    public static void EnterFullScreen(Window window, ref bool isFullScreen,
        ref WindowState restoreState, ref WindowStyle restoreStyle, ref ResizeMode restoreResize)
    {
        if (isFullScreen)
            return;

        restoreState = window.WindowState;
        restoreStyle = window.WindowStyle;
        restoreResize = window.ResizeMode;

        window.WindowStyle = WindowStyle.None;
        window.ResizeMode = ResizeMode.NoResize;
        window.WindowState = WindowState.Maximized;
        isFullScreen = true;
    }

    public static void ExitFullScreen(Window window, ref bool isFullScreen,
        WindowState restoreState, WindowStyle restoreStyle, ResizeMode restoreResize)
    {
        if (!isFullScreen)
            return;

        window.WindowStyle = restoreStyle;
        window.ResizeMode = restoreResize;
        window.WindowState = restoreState == WindowState.Minimized ? WindowState.Normal : restoreState;
        if (window.WindowState == WindowState.Normal)
            ApplyStartupMaximized(window);

        isFullScreen = false;
    }

    public static void ToggleFullScreen(Window window, ref bool isFullScreen,
        ref WindowState restoreState, ref WindowStyle restoreStyle, ref ResizeMode restoreResize)
    {
        if (isFullScreen)
            ExitFullScreen(window, ref isFullScreen, restoreState, restoreStyle, restoreResize);
        else
            EnterFullScreen(window, ref isFullScreen, ref restoreState, ref restoreStyle, ref restoreResize);
    }
}
