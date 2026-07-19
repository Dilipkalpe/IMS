using IMS.Models;

namespace IMS.Services;

public sealed class CommunicationSettingsService
{
    private static readonly Lazy<CommunicationSettingsService> Lazy = new(() => new CommunicationSettingsService());
    public static CommunicationSettingsService Instance => Lazy.Value;

    private CommunicationSettings _current = new();

    public CommunicationSettings Current => _current;

    public void Initialize() => Reload();

    public void Reload()
    {
        var settings = SettingsStore.Load();
        _current = settings.Communication ?? new CommunicationSettings();
    }

    public void Save(CommunicationSettings communication)
    {
        _current = communication;
        SettingsStore.Update(s => s.Communication = communication);
    }

    public void SetDisableAll(bool disableAll)
    {
        var copy = Clone(_current);
        copy.DisableAll = disableAll;
        if (disableAll)
        {
            copy.WhatsAppEnabled = false;
            copy.SmsEnabled = false;
            copy.EmailEnabled = false;
        }
        Save(copy);
    }

    public static CommunicationSettings Clone(CommunicationSettings source) =>
        new()
        {
            DisableAll = source.DisableAll,
            WhatsAppEnabled = source.WhatsAppEnabled,
            SmsEnabled = source.SmsEnabled,
            EmailEnabled = source.EmailEnabled,
            PromptBeforeSend = source.PromptBeforeSend,
            SendAfterSaveByDefault = source.SendAfterSaveByDefault,
            WhatsApp = new WhatsAppCommunicationSettings
            {
                ApiUrl = source.WhatsApp.ApiUrl,
                ProtectedApiKey = source.WhatsApp.ProtectedApiKey,
                SenderDetails = source.WhatsApp.SenderDetails
            },
            Sms = new SmsCommunicationSettings
            {
                GatewayUrl = source.Sms.GatewayUrl,
                ProtectedApiKey = source.Sms.ProtectedApiKey,
                SenderId = source.Sms.SenderId
            },
            Email = new EmailCommunicationSettings
            {
                SmtpServer = source.Email.SmtpServer,
                SmtpPort = source.Email.SmtpPort,
                EmailAddress = source.Email.EmailAddress,
                ProtectedPassword = source.Email.ProtectedPassword,
                UseSsl = source.Email.UseSsl
            },
            SalesInvoiceTemplate = source.SalesInvoiceTemplate,
            PurchaseInvoiceTemplate = source.PurchaseInvoiceTemplate
        };
}
