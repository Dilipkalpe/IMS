using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Mail;
using System.Text;
using System.Text.Json;
using IMS.Models;

namespace IMS.Services;

public sealed class CommunicationDeliveryResult
{
    public CommunicationChannel Channel { get; init; }
    public string Recipient { get; init; } = string.Empty;
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
}

public static class CommunicationEngine
{
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(30) };

    public static async Task<IReadOnlyList<CommunicationDeliveryResult>> SendAsync(
        InvoiceCommunicationContext context,
        IReadOnlyList<CommunicationChannel> channels,
        CancellationToken cancellationToken = default)
    {
        var settings = CommunicationSettingsService.Instance.Current;
        var message = CommunicationTemplateRenderer.RenderForDocument(context.DocumentKind, context);
        var results = new List<CommunicationDeliveryResult>();

        foreach (var channel in channels)
        {
            CommunicationDeliveryResult result;
            try
            {
                result = channel switch
                {
                    CommunicationChannel.WhatsApp => await SendWhatsAppAsync(settings, context, message, cancellationToken),
                    CommunicationChannel.Sms => await SendSmsAsync(settings, context, message, cancellationToken),
                    CommunicationChannel.Email => await SendEmailAsync(settings, context, message, cancellationToken),
                    _ => new CommunicationDeliveryResult
                    {
                        Channel = channel,
                        Success = false,
                        ErrorMessage = "Unsupported channel."
                    }
                };
            }
            catch (Exception ex)
            {
                result = new CommunicationDeliveryResult
                {
                    Channel = channel,
                    Recipient = ResolveRecipientLabel(channel, context),
                    Success = false,
                    ErrorMessage = ex.Message
                };
            }

            results.Add(result);
            CommunicationLogStore.Append(new CommunicationLogEntry
            {
                TimestampLocal = DateTime.Now,
                InvoiceNumber = context.InvoiceNumber,
                DocumentKind = context.DocumentKind.ToString(),
                Channel = channel.ToString(),
                Recipient = result.Recipient,
                Status = result.Success ? "Success" : "Failed",
                ErrorMessage = result.ErrorMessage
            });
        }

        return results;
    }

    private static async Task<CommunicationDeliveryResult> SendWhatsAppAsync(
        CommunicationSettings settings,
        InvoiceCommunicationContext context,
        string message,
        CancellationToken cancellationToken)
    {
        var cfg = settings.WhatsApp;
        var phone = NormalizePhone(context.PartyPhone);
        if (string.IsNullOrWhiteSpace(cfg.ApiUrl))
            throw new InvalidOperationException("WhatsApp API URL is not configured in Settings.");

        if (string.IsNullOrWhiteSpace(phone))
            throw new InvalidOperationException("Recipient mobile number is missing on the account master.");

        var apiKey = CommunicationSecretsProtector.Unprotect(cfg.ProtectedApiKey);
        var payload = new
        {
            to = phone,
            message,
            sender = cfg.SenderDetails,
            type = "text"
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, cfg.ApiUrl.Trim());
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        if (!string.IsNullOrWhiteSpace(apiKey))
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        using var response = await Http.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException(string.IsNullOrWhiteSpace(body) ? response.ReasonPhrase : body);

        return new CommunicationDeliveryResult
        {
            Channel = CommunicationChannel.WhatsApp,
            Recipient = phone,
            Success = true
        };
    }

    private static async Task<CommunicationDeliveryResult> SendSmsAsync(
        CommunicationSettings settings,
        InvoiceCommunicationContext context,
        string message,
        CancellationToken cancellationToken)
    {
        var cfg = settings.Sms;
        var phone = NormalizePhone(context.PartyPhone);
        if (string.IsNullOrWhiteSpace(cfg.GatewayUrl))
            throw new InvalidOperationException("SMS gateway URL is not configured in Settings.");

        if (string.IsNullOrWhiteSpace(phone))
            throw new InvalidOperationException("Recipient mobile number is missing on the account master.");

        var apiKey = CommunicationSecretsProtector.Unprotect(cfg.ProtectedApiKey);
        var payload = new
        {
            to = phone,
            message,
            senderId = cfg.SenderId
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, cfg.GatewayUrl.Trim());
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        if (!string.IsNullOrWhiteSpace(apiKey))
            request.Headers.Add("X-Api-Key", apiKey);

        using var response = await Http.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException(string.IsNullOrWhiteSpace(body) ? response.ReasonPhrase : body);

        return new CommunicationDeliveryResult
        {
            Channel = CommunicationChannel.Sms,
            Recipient = phone,
            Success = true
        };
    }

    private static async Task<CommunicationDeliveryResult> SendEmailAsync(
        CommunicationSettings settings,
        InvoiceCommunicationContext context,
        string message,
        CancellationToken cancellationToken)
    {
        var cfg = settings.Email;
        var email = context.PartyEmail?.Trim();
        if (string.IsNullOrWhiteSpace(cfg.SmtpServer) || string.IsNullOrWhiteSpace(cfg.EmailAddress))
            throw new InvalidOperationException("SMTP settings are incomplete in Settings.");

        if (string.IsNullOrWhiteSpace(email))
            throw new InvalidOperationException("Recipient email is missing on the account master.");

        var password = CommunicationSecretsProtector.Unprotect(cfg.ProtectedPassword);
        using var mail = new MailMessage
        {
            From = new MailAddress(cfg.EmailAddress.Trim(), context.CompanyName),
            Subject = $"{GetDocumentTitle(context.DocumentKind)} {context.InvoiceNumber}",
            Body = message,
            IsBodyHtml = false
        };
        mail.To.Add(email);

        var attachmentName = $"Invoice_{SanitizeFileName(context.InvoiceNumber)}.txt";
        var stream = new MemoryStream(Encoding.UTF8.GetBytes(message));
        mail.Attachments.Add(new Attachment(stream, attachmentName, "text/plain"));

        using var client = new SmtpClient(cfg.SmtpServer.Trim(), cfg.SmtpPort)
        {
            EnableSsl = cfg.UseSsl,
            Credentials = new NetworkCredential(cfg.EmailAddress.Trim(), password)
        };

        await client.SendMailAsync(mail, cancellationToken);

        return new CommunicationDeliveryResult
        {
            Channel = CommunicationChannel.Email,
            Recipient = email,
            Success = true
        };
    }

    private static string GetDocumentTitle(CommunicationDocumentKind kind) =>
        kind == CommunicationDocumentKind.PurchaseInvoice ? "Purchase Invoice" : "Sales Invoice";

    private static string ResolveRecipientLabel(CommunicationChannel channel, InvoiceCommunicationContext context) =>
        channel == CommunicationChannel.Email
            ? context.PartyEmail ?? string.Empty
            : NormalizePhone(context.PartyPhone);

    private static string NormalizePhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return string.Empty;

        var digits = new string(phone.Where(char.IsDigit).ToArray());
        return digits.Length >= 10 ? digits : phone.Trim();
    }

    private static string SanitizeFileName(string value)
    {
        foreach (var c in Path.GetInvalidFileNameChars())
            value = value.Replace(c, '_');
        return value;
    }
}
