using System.Windows;

namespace IMS.Views;

public partial class BackupProgressWindow : Window
{
    public BackupProgressWindow(Window? owner)
    {
        InitializeComponent();
        if (owner is { IsLoaded: true })
            Owner = owner;
        WindowStartupLocation = Owner is null
            ? WindowStartupLocation.CenterScreen
            : WindowStartupLocation.CenterOwner;
    }

    public void Report(string message)
    {
        if (!Dispatcher.CheckAccess())
        {
            Dispatcher.Invoke(() => Report(message));
            return;
        }

        StatusText.Text = message;
    }
}
