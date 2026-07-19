using System.Windows;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;

namespace IMS.ViewModels;

public sealed class CommunicationSettingsHost : ViewModelBase
{
    private bool _disableAll;
    private bool _whatsAppEnabled;
    private bool _smsEnabled;
    private bool _emailEnabled;
    private bool _promptBeforeSend = true;
    private bool _sendAfterSaveByDefault = true;
    private string _whatsAppApiUrl = string.Empty;
    private string _whatsAppSenderDetails = string.Empty;
    private string _smsGatewayUrl = string.Empty;
    private string _smsSenderId = string.Empty;
    private string _smtpServer = string.Empty;
    private string _smtpPort = "587";
    private string _emailAddress = string.Empty;
    private bool _emailUseSsl = true;
    private string _salesInvoiceTemplate = CommunicationSettings.DefaultSalesInvoiceTemplate;
    private string _purchaseInvoiceTemplate = CommunicationSettings.DefaultPurchaseInvoiceTemplate;
    private string _statusMessage = string.Empty;
    private bool _suppressSave;

    public CommunicationSettingsHost()
    {
        SaveCommand = new RelayCommand(SaveSettings);
        SetNoneCommand = new RelayCommand(() => ApplyNone());
        ResetTemplatesCommand = new RelayCommand(ResetTemplates);
        LoadFromStore();
    }

    public bool CanManageCommunicationSettings => AuthSession.IsAdministrator;

    public ICommand SaveCommand { get; }
    public ICommand SetNoneCommand { get; }
    public ICommand ResetTemplatesCommand { get; }

    public bool DisableAll
    {
        get => _disableAll;
        set
        {
            if (!SetProperty(ref _disableAll, value))
                return;

            if (value)
            {
                _suppressSave = true;
                WhatsAppEnabled = false;
                SmsEnabled = false;
                EmailEnabled = false;
                _suppressSave = false;
            }

            PersistIfAllowed();
        }
    }

    public bool WhatsAppEnabled
    {
        get => _whatsAppEnabled;
        set
        {
            if (!SetProperty(ref _whatsAppEnabled, value))
                return;
            if (value)
                DisableAll = false;
            PersistIfAllowed();
        }
    }

    public bool SmsEnabled
    {
        get => _smsEnabled;
        set
        {
            if (!SetProperty(ref _smsEnabled, value))
                return;
            if (value)
                DisableAll = false;
            PersistIfAllowed();
        }
    }

    public bool EmailEnabled
    {
        get => _emailEnabled;
        set
        {
            if (!SetProperty(ref _emailEnabled, value))
                return;
            if (value)
                DisableAll = false;
            PersistIfAllowed();
        }
    }

    public bool PromptBeforeSend
    {
        get => _promptBeforeSend;
        set
        {
            if (!SetProperty(ref _promptBeforeSend, value))
                return;
            PersistIfAllowed();
        }
    }

    public bool SendAfterSaveByDefault
    {
        get => _sendAfterSaveByDefault;
        set
        {
            if (!SetProperty(ref _sendAfterSaveByDefault, value))
                return;
            PersistIfAllowed();
        }
    }

    public string WhatsAppApiUrl
    {
        get => _whatsAppApiUrl;
        set
        {
            if (!SetProperty(ref _whatsAppApiUrl, value))
                return;
            PersistIfAllowed();
        }
    }

    public string WhatsAppSenderDetails
    {
        get => _whatsAppSenderDetails;
        set
        {
            if (!SetProperty(ref _whatsAppSenderDetails, value))
                return;
            PersistIfAllowed();
        }
    }

    public string SmsGatewayUrl
    {
        get => _smsGatewayUrl;
        set
        {
            if (!SetProperty(ref _smsGatewayUrl, value))
                return;
            PersistIfAllowed();
        }
    }

    public string SmsSenderId
    {
        get => _smsSenderId;
        set
        {
            if (!SetProperty(ref _smsSenderId, value))
                return;
            PersistIfAllowed();
        }
    }

    public string SmtpServer
    {
        get => _smtpServer;
        set
        {
            if (!SetProperty(ref _smtpServer, value))
                return;
            PersistIfAllowed();
        }
    }

    public string SmtpPort
    {
        get => _smtpPort;
        set
        {
            if (!SetProperty(ref _smtpPort, value))
                return;
            PersistIfAllowed();
        }
    }

    public string EmailAddress
    {
        get => _emailAddress;
        set
        {
            if (!SetProperty(ref _emailAddress, value))
                return;
            PersistIfAllowed();
        }
    }

    public bool EmailUseSsl
    {
        get => _emailUseSsl;
        set
        {
            if (!SetProperty(ref _emailUseSsl, value))
                return;
            PersistIfAllowed();
        }
    }

    public string SalesInvoiceTemplate
    {
        get => _salesInvoiceTemplate;
        set
        {
            if (!SetProperty(ref _salesInvoiceTemplate, value))
                return;
            PersistIfAllowed();
        }
    }

    public string PurchaseInvoiceTemplate
    {
        get => _purchaseInvoiceTemplate;
        set
        {
            if (!SetProperty(ref _purchaseInvoiceTemplate, value))
                return;
            PersistIfAllowed();
        }
    }

    public string StatusMessage
    {
        get => _statusMessage;
        private set => SetProperty(ref _statusMessage, value);
    }

    public string PlaceholderHelp =>
        "Placeholders: {{CustomerName}}, {{SupplierName}}, {{InvoiceNumber}}, {{InvoiceDate}}, " +
        "{{Amount}}, {{BalanceAmount}}, {{CompanyName}}, {{ContactDetails}}";

    public void ApplyWhatsAppApiKey(string plainKey)
    {
        if (_suppressSave)
            return;

        var settings = BuildSettings(whatsAppApiKeyPlain: plainKey);
        CommunicationSettingsService.Instance.Save(settings);
        StatusMessage = "Communication settings saved.";
    }

    public void ApplySmsApiKey(string plainKey)
    {
        if (_suppressSave)
            return;

        var settings = BuildSettings(smsApiKeyPlain: plainKey);
        CommunicationSettingsService.Instance.Save(settings);
        StatusMessage = "Communication settings saved.";
    }

    public void ApplyEmailPassword(string plainPassword)
    {
        if (_suppressSave)
            return;

        var settings = BuildSettings(emailPasswordPlain: plainPassword);
        CommunicationSettingsService.Instance.Save(settings);
        StatusMessage = "Communication settings saved.";
    }

    private void LoadFromStore()
    {
        _suppressSave = true;
        CommunicationSettingsService.Instance.Reload();
        var s = CommunicationSettingsService.Instance.Current;

        DisableAll = s.DisableAll;
        WhatsAppEnabled = s.WhatsAppEnabled;
        SmsEnabled = s.SmsEnabled;
        EmailEnabled = s.EmailEnabled;
        PromptBeforeSend = s.PromptBeforeSend;
        SendAfterSaveByDefault = s.SendAfterSaveByDefault;
        WhatsAppApiUrl = s.WhatsApp.ApiUrl;
        WhatsAppSenderDetails = s.WhatsApp.SenderDetails;
        SmsGatewayUrl = s.Sms.GatewayUrl;
        SmsSenderId = s.Sms.SenderId;
        SmtpServer = s.Email.SmtpServer;
        SmtpPort = s.Email.SmtpPort.ToString();
        EmailAddress = s.Email.EmailAddress;
        EmailUseSsl = s.Email.UseSsl;
        SalesInvoiceTemplate = string.IsNullOrWhiteSpace(s.SalesInvoiceTemplate)
            ? CommunicationSettings.DefaultSalesInvoiceTemplate
            : s.SalesInvoiceTemplate;
        PurchaseInvoiceTemplate = string.IsNullOrWhiteSpace(s.PurchaseInvoiceTemplate)
            ? CommunicationSettings.DefaultPurchaseInvoiceTemplate
            : s.PurchaseInvoiceTemplate;

        _suppressSave = false;
    }

    private void ApplyNone()
    {
        DisableAll = true;
        StatusMessage = "All communication channels disabled (None).";
    }

    private void ResetTemplates()
    {
        SalesInvoiceTemplate = CommunicationSettings.DefaultSalesInvoiceTemplate;
        PurchaseInvoiceTemplate = CommunicationSettings.DefaultPurchaseInvoiceTemplate;
        StatusMessage = "Templates reset to defaults.";
    }

    private void SaveSettings()
    {
        var settings = BuildSettings();
        CommunicationSettingsService.Instance.Save(settings);
        StatusMessage = "Communication settings saved.";
    }

    private void PersistIfAllowed()
    {
        if (_suppressSave || !CanManageCommunicationSettings)
            return;

        SaveSettings();
    }

    private CommunicationSettings BuildSettings(
        string? whatsAppApiKeyPlain = null,
        string? smsApiKeyPlain = null,
        string? emailPasswordPlain = null)
    {
        var existing = CommunicationSettingsService.Instance.Current;
        if (!int.TryParse(SmtpPort, out var port))
            port = 587;

        var settings = new CommunicationSettings
        {
            DisableAll = DisableAll,
            WhatsAppEnabled = WhatsAppEnabled,
            SmsEnabled = SmsEnabled,
            EmailEnabled = EmailEnabled,
            PromptBeforeSend = PromptBeforeSend,
            SendAfterSaveByDefault = SendAfterSaveByDefault,
            WhatsApp = new WhatsAppCommunicationSettings
            {
                ApiUrl = WhatsAppApiUrl.Trim(),
                SenderDetails = WhatsAppSenderDetails.Trim(),
                ProtectedApiKey = string.IsNullOrWhiteSpace(whatsAppApiKeyPlain)
                    ? existing.WhatsApp.ProtectedApiKey
                    : CommunicationSecretsProtector.Protect(whatsAppApiKeyPlain)
            },
            Sms = new SmsCommunicationSettings
            {
                GatewayUrl = SmsGatewayUrl.Trim(),
                SenderId = SmsSenderId.Trim(),
                ProtectedApiKey = string.IsNullOrWhiteSpace(smsApiKeyPlain)
                    ? existing.Sms.ProtectedApiKey
                    : CommunicationSecretsProtector.Protect(smsApiKeyPlain)
            },
            Email = new EmailCommunicationSettings
            {
                SmtpServer = SmtpServer.Trim(),
                SmtpPort = port,
                EmailAddress = EmailAddress.Trim(),
                UseSsl = EmailUseSsl,
                ProtectedPassword = string.IsNullOrWhiteSpace(emailPasswordPlain)
                    ? existing.Email.ProtectedPassword
                    : CommunicationSecretsProtector.Protect(emailPasswordPlain)
            },
            SalesInvoiceTemplate = SalesInvoiceTemplate,
            PurchaseInvoiceTemplate = PurchaseInvoiceTemplate
        };

        return settings;
    }
}
