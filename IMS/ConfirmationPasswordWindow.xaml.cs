using System.Windows;
using System.Windows.Input;

namespace IMS;

public partial class ConfirmationPasswordWindow : Window
{
    public ConfirmationPasswordWindow(string actionTitle, string actionDescription)
    {
        ActionTitle = actionTitle;
        ActionDescription = actionDescription;
        InitializeComponent();
        DataContext = this;
        Loaded += (_, _) =>
        {
            PasswordBox.Focus();
            Keyboard.Focus(PasswordBox);
        };
    }

    public string ActionTitle { get; }

    public string ActionDescription { get; }

    public string Password => PasswordBox.Password;

    private void Confirm_OnClick(object sender, RoutedEventArgs e)
    {
        DialogResult = true;
        Close();
    }

    private void Cancel_OnClick(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }

    private void PasswordBox_OnKeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.Enter)
        {
            DialogResult = true;
            Close();
            e.Handled = true;
        }
    }
}
