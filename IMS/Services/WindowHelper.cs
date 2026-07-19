using System.Windows;

namespace IMS.Services;

public static class WindowHelper
{
    public static Window? GetOwnerWindow()
    {
        var app = Application.Current;
        if (app is null)
            return null;

        foreach (Window window in app.Windows)
        {
            if (window.IsActive)
                return window;
        }

        return app.MainWindow;
    }
}
