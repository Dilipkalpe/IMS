using System.Windows;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;

namespace IMS.ViewModels.SubPages;

public sealed class AddAccountMasterViewModel : DynamicFormViewModelBase
{
    private static readonly HashSet<string> TaxOptionKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "gst_exempt",
        "active_status"
    };

    private static readonly HashSet<string> AddressMultilineKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "address"
    };

    private readonly MainViewModel _host;
    private readonly bool _isEdit;
    private readonly string _originalCode = string.Empty;
    private string _accountType = "customer";
    private string? _accountId;

    public AddAccountMasterViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Chart of Accounts",
        pageTitle: "Add Account",
        pageDescription: "Customer / ledger master — contact, tax IDs, credit terms, and address.",
        iconGlyph: "\uE8C8",
        AccountMasterFormCatalog.All)
    {
        _host = host;
        SaveCommand = new AsyncRelayCommand(SaveAccountAsync);
    }

    public AddAccountMasterViewModel(MainViewModel host, string accountCode) : base(
        host,
        parentTitle: "Chart of Accounts",
        pageTitle: "Edit Account",
        pageDescription: "Update customer / ledger master details. Field visibility follows your saved layout.",
        iconGlyph: "\uE70F",
        AccountMasterFormCatalog.All)
    {
        _host = host;
        _isEdit = true;
        _originalCode = accountCode;
        SaveCommand = new AsyncRelayCommand(SaveAccountAsync);
        _ = LoadAccountAsync(accountCode);
    }

    public FormFieldViewModel? GstExemptField => GetField("gst_exempt");
    public FormFieldViewModel? ActiveStatusField => GetField("active_status");
    public FormFieldViewModel? AddressField => GetField("address");

    public FormSectionViewModel? AccountContactSection => FindSection("Account & contact");
    public FormSectionViewModel? CommunicationSection => FindSection("Communication");
    public FormSectionViewModel? TaxSection => FindSection("Tax & registration");
    public FormSectionViewModel? AddressSection => FindSection("Address & location");
    public FormSectionViewModel? CreditSection => FindSection("Credit & turnover");

    public IEnumerable<FormFieldViewModel> AccountContactFields => FilterSectionFields(AccountContactSection);
    public IEnumerable<FormFieldViewModel> CommunicationFields => FilterSectionFields(CommunicationSection);
    public IEnumerable<FormFieldViewModel> TaxFields =>
        TaxSection?.Fields.Where(f => !TaxOptionKeys.Contains(f.Key)) ?? [];
    public IEnumerable<FormFieldViewModel> AddressLocationFields =>
        AddressSection?.Fields.Where(f => !AddressMultilineKeys.Contains(f.Key)) ?? [];
    public IEnumerable<FormFieldViewModel> CreditFields => FilterSectionFields(CreditSection);

    protected override string FormModuleKey => "account_master_form";

    public override void RefreshVisibleFields()
    {
        base.RefreshVisibleFields();
        OnPropertyChanged(nameof(AccountContactSection));
        OnPropertyChanged(nameof(CommunicationSection));
        OnPropertyChanged(nameof(TaxSection));
        OnPropertyChanged(nameof(AddressSection));
        OnPropertyChanged(nameof(CreditSection));
        OnPropertyChanged(nameof(AccountContactFields));
        OnPropertyChanged(nameof(CommunicationFields));
        OnPropertyChanged(nameof(TaxFields));
        OnPropertyChanged(nameof(AddressField));
        OnPropertyChanged(nameof(AddressLocationFields));
        OnPropertyChanged(nameof(CreditFields));
        OnPropertyChanged(nameof(GstExemptField));
        OnPropertyChanged(nameof(ActiveStatusField));
    }

    internal void SetAccountType(string accountType) => _accountType = accountType;

    internal void SetAccountId(string? id) => _accountId = id;

    private FormSectionViewModel? FindSection(string title) =>
        FormSections.FirstOrDefault(s => string.Equals(s.Title, title, StringComparison.Ordinal));

    private static IEnumerable<FormFieldViewModel> FilterSectionFields(FormSectionViewModel? section) =>
        section?.Fields ?? [];

    private async Task LoadAccountAsync(string code)
    {
        if (!ImsApiClient.IsAvailable && !await ImsApiClient.CheckHealthAsync())
            return;

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var account = await ImsApiClient.GetAccountByCodeAsync(code);
            if (account is null)
            {
                MessageBox.Show($"Account \"{code}\" was not found.", "Edit Account",
                    MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            ApiDocumentMapper.ApplyAccountToViewModel(account, this);
        });
    }

    private async Task SaveAccountAsync()
    {
        if (!ValidateRequiredFields("customer_code", "customer_name"))
        {
            MessageBox.Show("Customer code and name are required.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (!await ImsApiClient.CheckHealthAsync())
        {
            MessageBox.Show(
                "Cannot save — the API is not running.\n\nStart MongoDB, then run the API (npm run dev in the api folder) and try again.",
                "Account Master",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return;
        }

        var saved = false;
        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var dto = ApiDocumentMapper.FromAddAccount(this, _accountId, _accountType);
            if (_isEdit)
                await ImsApiClient.UpdateAccountByCodeAsync(_originalCode, dto);
            else
                await ImsApiClient.CreateAccountAsync(dto);

            saved = true;
        }, "Account Master");

        if (!saved)
            return;

        MessageBox.Show(
            _isEdit ? "Account updated successfully." : "Account saved successfully.",
            "Account Master",
            MessageBoxButton.OK,
            MessageBoxImage.Information);

        _host.GoBack();
    }
}
