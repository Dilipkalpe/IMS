using System.Windows;
using System.Windows.Controls;
using IMS.ViewModels;

namespace IMS.Views;

public partial class CommunicationSettingsPanel : UserControl
{
    public CommunicationSettingsPanel() => InitializeComponent();

    private CommunicationSettingsHost? Host => DataContext as CommunicationSettingsHost;

    private void WhatsAppApiKeyBox_OnPasswordChanged(object sender, RoutedEventArgs e)
    {
        if (Host is null || string.IsNullOrEmpty(WhatsAppApiKeyBox.Password))
            return;

        Host.ApplyWhatsAppApiKey(WhatsAppApiKeyBox.Password);
        WhatsAppApiKeyBox.Password = string.Empty;
    }

    private void SmsApiKeyBox_OnPasswordChanged(object sender, RoutedEventArgs e)
    {
        if (Host is null || string.IsNullOrEmpty(SmsApiKeyBox.Password))
            return;

        Host.ApplySmsApiKey(SmsApiKeyBox.Password);
        SmsApiKeyBox.Password = string.Empty;
    }

    private void EmailPasswordBox_OnPasswordChanged(object sender, RoutedEventArgs e)
    {
        if (Host is null || string.IsNullOrEmpty(EmailPasswordBox.Password))
            return;

        Host.ApplyEmailPassword(EmailPasswordBox.Password);
        EmailPasswordBox.Password = string.Empty;
    }
}
