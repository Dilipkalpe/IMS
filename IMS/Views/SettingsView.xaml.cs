using System.Windows;
using System.Windows.Controls;
using IMS.ViewModels;

namespace IMS.Views;

public partial class SettingsView
{
    public SettingsView() => InitializeComponent();

    private void NewEditDeletePasswordBox_OnPasswordChanged(object sender, RoutedEventArgs e)
    {
        if (DataContext is SettingsViewModel vm && sender is PasswordBox box)
            vm.NewEditDeletePassword = box.Password;
    }

    private void ConfirmEditDeletePasswordBox_OnPasswordChanged(object sender, RoutedEventArgs e)
    {
        if (DataContext is SettingsViewModel vm && sender is PasswordBox box)
            vm.ConfirmEditDeletePassword = box.Password;
    }
}
