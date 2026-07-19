using System.Windows;
using IMS.Models;

namespace IMS.Views;

public partial class BackupFailureExitWindow : Window
{
    public BackupFailureExitWindow(string errorMessage)
    {
        InitializeComponent();
        ErrorText.Text = errorMessage;
    }

    public ExitConfirmChoice Choice { get; private set; } = ExitConfirmChoice.Stay;

    public static ExitConfirmChoice ShowDialog(Window? owner, string errorMessage)
    {
        var window = new BackupFailureExitWindow(errorMessage);
        if (owner is { IsLoaded: true })
            window.Owner = owner;
        window.WindowStartupLocation = window.Owner is null
            ? WindowStartupLocation.CenterScreen
            : WindowStartupLocation.CenterOwner;
        _ = window.ShowDialog();
        return window.Choice;
    }

    private void CloseWithoutBackup_Click(object sender, RoutedEventArgs e)
    {
        Choice = ExitConfirmChoice.CloseWithoutBackup;
        DialogResult = true;
    }

    private void Stay_Click(object sender, RoutedEventArgs e)
    {
        Choice = ExitConfirmChoice.Stay;
        DialogResult = false;
    }
}
