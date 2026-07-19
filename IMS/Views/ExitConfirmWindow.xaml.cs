using System.Windows;
using IMS.Models;

namespace IMS.Views;

public partial class ExitConfirmWindow : Window
{
    public ExitConfirmWindow()
    {
        InitializeComponent();
    }

    public ExitConfirmChoice Choice { get; private set; } = ExitConfirmChoice.Stay;

    public static ExitConfirmChoice ShowDialog(Window? owner)
    {
        var window = new ExitConfirmWindow();
        if (owner is { IsLoaded: true })
            window.Owner = owner;
        window.WindowStartupLocation = window.Owner is null
            ? WindowStartupLocation.CenterScreen
            : WindowStartupLocation.CenterOwner;
        _ = window.ShowDialog();
        return window.Choice;
    }

    private void BackupAndClose_Click(object sender, RoutedEventArgs e)
    {
        Choice = ExitConfirmChoice.BackupAndClose;
        DialogResult = true;
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
