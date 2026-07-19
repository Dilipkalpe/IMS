using System.Windows;
using IMS.Models;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;
using IMS.Views;

namespace IMS.Services;

public static class InvoiceCommunicationCoordinator
{
    public static async Task HandleAfterSaveAsync(
        Window owner,
        CommunicationDocumentKind documentKind,
        string invoiceNumber,
        string invoiceDate,
        string partyName,
        string amount,
        string balanceAmount,
        string accountType)
    {
        CommunicationSettingsService.Instance.Reload();
        var settings = CommunicationSettingsService.Instance.Current;
        if (!settings.HasAnyChannelEnabled)
            return;

        var company = CompanyProfileService.Current;
        var account = await TryResolveAccountAsync(partyName, accountType);

        var context = new InvoiceCommunicationContext
        {
            DocumentKind = documentKind,
            InvoiceNumber = invoiceNumber,
            InvoiceDate = invoiceDate,
            PartyName = partyName,
            PartyEmail = account?.Email,
            PartyPhone = account?.MobileNo ?? account?.ContactNo,
            Amount = amount,
            BalanceAmount = balanceAmount,
            CompanyName = company.BusinessName,
            ContactDetails = BuildCompanyContact(company)
        };

        var enabled = settings.GetEnabledChannels();
        InvoiceCommunicationChoice choice;

        if (settings.PromptBeforeSend)
        {
            var dialogChoice = InvoiceCommunicationWindow.ShowDialog(owner, enabled, settings.SendAfterSaveByDefault);
            if (dialogChoice is null || !dialogChoice.Send)
                return;
            choice = dialogChoice;
        }
        else if (!settings.SendAfterSaveByDefault)
        {
            return;
        }
        else
        {
            choice = new InvoiceCommunicationChoice
            {
                Send = true,
                Channels = enabled
            };
        }

        var channels = choice.Channels.Count > 0 ? choice.Channels : enabled;
        if (channels.Count == 0)
            return;

        var results = await CommunicationEngine.SendAsync(context, channels);
        ShowDeliverySummary(owner, results);
    }

    private static async Task<AccountDto?> TryResolveAccountAsync(string partyName, string accountType)
    {
        if (string.IsNullOrWhiteSpace(partyName) || !ImsApiClient.IsAvailable)
            return null;

        try
        {
            var accounts = await ImsApiClient.GetAccountsAsync(accountType);
            return accounts.FirstOrDefault(a =>
                string.Equals(a.Name, partyName.Trim(), StringComparison.OrdinalIgnoreCase));
        }
        catch
        {
            return null;
        }
    }

    private static string BuildCompanyContact(InvoiceCompanyProfile company)
    {
        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(company.Phone))
            parts.Add($"Phone: {company.Phone}");
        if (!string.IsNullOrWhiteSpace(company.Gstin))
            parts.Add($"GSTIN: {company.Gstin}");
        if (!string.IsNullOrWhiteSpace(company.Address))
            parts.Add(company.Address);
        return string.Join(" | ", parts);
    }

    private static void ShowDeliverySummary(Window owner, IReadOnlyList<CommunicationDeliveryResult> results)
    {
        if (results.Count == 0)
            return;

        var lines = results.Select(r =>
            r.Success
                ? $"• {r.Channel}: Sent to {r.Recipient}"
                : $"• {r.Channel}: Failed — {r.ErrorMessage}");

        var icon = results.All(r => r.Success)
            ? MessageBoxImage.Information
            : results.Any(r => r.Success)
                ? MessageBoxImage.Warning
                : MessageBoxImage.Error;

        var title = results.All(r => r.Success)
            ? "Notifications Sent"
            : "Notification Results";

        MessageBox.Show(owner, string.Join(Environment.NewLine, lines), title, MessageBoxButton.OK, icon);
    }
}

public sealed class InvoiceCommunicationChoice
{
    public bool Send { get; init; }
    public IReadOnlyList<CommunicationChannel> Channels { get; init; } = [];
}
