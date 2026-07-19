namespace IMS.Models;

public sealed class CommunicationSettings
{
    public bool DisableAll { get; set; }
    public bool WhatsAppEnabled { get; set; }
    public bool SmsEnabled { get; set; }
    public bool EmailEnabled { get; set; }
    public bool PromptBeforeSend { get; set; } = true;
    public bool SendAfterSaveByDefault { get; set; } = true;

    public WhatsAppCommunicationSettings WhatsApp { get; set; } = new();
    public SmsCommunicationSettings Sms { get; set; } = new();
    public EmailCommunicationSettings Email { get; set; } = new();

    public string SalesInvoiceTemplate { get; set; } = DefaultSalesInvoiceTemplate;
    public string PurchaseInvoiceTemplate { get; set; } = DefaultPurchaseInvoiceTemplate;

    public const string DefaultSalesInvoiceTemplate =
        "Dear {{CustomerName}},\n\n" +
        "Invoice {{InvoiceNumber}} dated {{InvoiceDate}} for {{Amount}} has been saved.\n" +
        "Balance due: {{BalanceAmount}}.\n\n" +
        "Thank you,\n{{CompanyName}}\n{{ContactDetails}}";

    public const string DefaultPurchaseInvoiceTemplate =
        "Dear {{SupplierName}},\n\n" +
        "Purchase invoice {{InvoiceNumber}} dated {{InvoiceDate}} for {{Amount}} has been recorded.\n" +
        "Balance: {{BalanceAmount}}.\n\n" +
        "Regards,\n{{CompanyName}}\n{{ContactDetails}}";

    public bool HasAnyChannelEnabled =>
        !DisableAll && (WhatsAppEnabled || SmsEnabled || EmailEnabled);

    public IReadOnlyList<CommunicationChannel> GetEnabledChannels()
    {
        if (DisableAll)
            return [];

        var list = new List<CommunicationChannel>(3);
        if (WhatsAppEnabled)
            list.Add(CommunicationChannel.WhatsApp);
        if (SmsEnabled)
            list.Add(CommunicationChannel.Sms);
        if (EmailEnabled)
            list.Add(CommunicationChannel.Email);
        return list;
    }
}

public sealed class WhatsAppCommunicationSettings
{
    public string ApiUrl { get; set; } = string.Empty;
    public string ProtectedApiKey { get; set; } = string.Empty;
    public string SenderDetails { get; set; } = string.Empty;
}

public sealed class SmsCommunicationSettings
{
    public string GatewayUrl { get; set; } = string.Empty;
    public string ProtectedApiKey { get; set; } = string.Empty;
    public string SenderId { get; set; } = string.Empty;
}

public sealed class EmailCommunicationSettings
{
    public string SmtpServer { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string EmailAddress { get; set; } = string.Empty;
    public string ProtectedPassword { get; set; } = string.Empty;
    public bool UseSsl { get; set; } = true;
}
