using System.Globalization;
using System.Windows;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels.SubPages;

public sealed class PaymentVoucherEntryViewModel : SubPageViewModelBase
{
    private static readonly string[] CashBankChoices = ["CASH", "BANK"];

    private readonly MainViewModel _host;
    private readonly bool _isEdit;
    private readonly int _originalVoucherNo;
    private readonly InvoicePaymentSeed? _invoiceSeed;
    private readonly Action? _onPaymentRecorded;
    private List<AccountDto> _accounts = [];

    private string _voucherNo = "1";
    private string _refNo = string.Empty;
    private DateTime? _voucherDate = DateTime.Today;
    private string _cashBank = "CASH";
    private string _accountCode = string.Empty;
    private string _accountName = string.Empty;
    private string _amount = "0";
    private string _narration = string.Empty;
    private bool _clearAfterSave = true;

    public PaymentVoucherEntryViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Payment Voucher",
        pageTitle: "Add Payment Voucher",
        pageDescription: "Record an outgoing payment voucher — cash or bank payment to a supplier account.",
        iconGlyph: "\uE8C8")
    {
        _host = host;
        SaveCommand = new AsyncRelayCommand(SaveAsync);
        LookupAccountCommand = new RelayCommand(LookupAccount);
        _ = InitializeNewAsync();
    }

    public PaymentVoucherEntryViewModel(MainViewModel host, InvoicePaymentSeed seed, Action? onPaymentRecorded = null) : base(
        host,
        parentTitle: "Purchase Invoice",
        pageTitle: "Payment — pay invoice",
        pageDescription: $"Record supplier payment against {seed.FormattedDocNo}.",
        iconGlyph: "\uE8C8")
    {
        _host = host;
        _invoiceSeed = seed;
        _onPaymentRecorded = onPaymentRecorded;
        ClearAfterSave = false;
        SaveCommand = new AsyncRelayCommand(SaveAsync);
        LookupAccountCommand = new RelayCommand(LookupAccount);
        _ = InitializeForInvoicePaymentAsync(seed);
    }

    internal InvoicePaymentSeed? LinkedInvoiceSeed => _invoiceSeed;

    public PaymentVoucherEntryViewModel(MainViewModel host, int voucherNo) : base(
        host,
        parentTitle: "Payment Voucher",
        pageTitle: "Edit Payment Voucher",
        pageDescription: "Update an existing payment voucher.",
        iconGlyph: "\uE70F")
    {
        _host = host;
        _isEdit = true;
        _originalVoucherNo = voucherNo;
        SaveCommand = new AsyncRelayCommand(SaveAsync);
        LookupAccountCommand = new RelayCommand(LookupAccount);
        _ = LoadVoucherAsync(voucherNo);
    }

    public IReadOnlyList<string> CashBankOptions => CashBankChoices;

    public ICommand LookupAccountCommand { get; }

    public string VoucherTypeLabel => "PAYMENT";

    public bool IsEdit => _isEdit;

    public string VoucherNo
    {
        get => _voucherNo;
        set => SetProperty(ref _voucherNo, value);
    }

    public string RefNo
    {
        get => _refNo;
        set => SetProperty(ref _refNo, value);
    }

    public DateTime? VoucherDate
    {
        get => _voucherDate;
        set => SetProperty(ref _voucherDate, value);
    }

    public string CashBank
    {
        get => _cashBank;
        set => SetProperty(ref _cashBank, value);
    }

    public string AccountCode
    {
        get => _accountCode;
        set => SetProperty(ref _accountCode, value);
    }

    public string AccountName
    {
        get => _accountName;
        set => SetProperty(ref _accountName, value);
    }

    public string Amount
    {
        get => _amount;
        set => SetProperty(ref _amount, value);
    }

    public string Narration
    {
        get => _narration;
        set => SetProperty(ref _narration, value);
    }

    public bool ClearAfterSave
    {
        get => _clearAfterSave;
        set => SetProperty(ref _clearAfterSave, value);
    }

    private async Task InitializeNewAsync()
    {
        await LoadAccountsAsync();
        if (!ImsApiClient.IsAvailable)
            return;

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var next = await ImsApiClient.GetNextPaymentVoucherNoAsync();
            VoucherNo = next.ToString(CultureInfo.InvariantCulture);
        });
    }

    private async Task InitializeForInvoicePaymentAsync(InvoicePaymentSeed seed)
    {
        await LoadAccountsAsync();
        RefNo = seed.FormattedDocNo;
        Amount = seed.AmountDue.ToString("N2", CultureInfo.CurrentCulture);
        CashBank = seed.CashBank;
        Narration = $"Payment against invoice {seed.FormattedDocNo}";
        AccountName = seed.PartyName;
        if (!string.IsNullOrWhiteSpace(seed.PartyAccountCode))
            AccountCode = seed.PartyAccountCode;

        if (string.IsNullOrWhiteSpace(AccountCode))
        {
            var match = _accounts.FirstOrDefault(a =>
                string.Equals(a.Name, seed.PartyName, StringComparison.OrdinalIgnoreCase));
            if (match is not null)
            {
                AccountCode = match.Code;
                AccountName = match.Name;
            }
        }

        if (!ImsApiClient.IsAvailable)
            return;

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var next = await ImsApiClient.GetNextPaymentVoucherNoAsync();
            VoucherNo = next.ToString(CultureInfo.InvariantCulture);
        });
    }

    private async Task LoadVoucherAsync(int voucherNo)
    {
        await LoadAccountsAsync();
        if (!ImsApiClient.IsAvailable)
        {
            VoucherNo = voucherNo.ToString(CultureInfo.InvariantCulture);
            return;
        }

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var voucher = await ImsApiClient.GetPaymentVoucherByNoAsync(voucherNo);
            if (voucher is null)
                return;

            SetFromDto(voucher);
        });
    }

    private async Task LoadAccountsAsync()
    {
        if (!ImsApiClient.IsAvailable)
            return;

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            _accounts = await ImsApiClient.GetAccountsAsync();
        });
    }

    private void LookupAccount()
    {
        if (string.IsNullOrWhiteSpace(AccountCode))
        {
            MessageBox.Show("Enter an account code to look up.", "Account",
                MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }

        var code = AccountCode.Trim().ToUpperInvariant();
        var match = _accounts.FirstOrDefault(a =>
            string.Equals(a.Code, code, StringComparison.OrdinalIgnoreCase));

        if (match is null)
        {
            MessageBox.Show($"No account found for code \"{AccountCode}\".", "Account",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            AccountName = string.Empty;
            return;
        }

        AccountCode = match.Code;
        AccountName = match.Name;
    }

    private async Task SaveAsync()
    {
        if (!decimal.TryParse(Amount, NumberStyles.Number, CultureInfo.CurrentCulture, out var amount) &&
            !decimal.TryParse(Amount, NumberStyles.Number, CultureInfo.InvariantCulture, out amount))
        {
            MessageBox.Show("Enter a valid amount.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (amount <= 0)
        {
            MessageBox.Show("Amount must be greater than zero.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (string.IsNullOrWhiteSpace(AccountCode) && string.IsNullOrWhiteSpace(AccountName))
        {
            MessageBox.Show("Select or look up an account.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (!int.TryParse(VoucherNo, NumberStyles.Integer, CultureInfo.InvariantCulture, out var voucherNo))
        {
            MessageBox.Show("Enter a valid voucher number.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (ImsApiClient.IsAvailable)
        {
            var ok = false;
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var dto = ApiDocumentMapper.FromPaymentVoucherEntry(this, voucherNo);
                if (_isEdit)
                    await ImsApiClient.UpdatePaymentVoucherByNoAsync(_originalVoucherNo, dto);
                else
                    await ImsApiClient.CreatePaymentVoucherAsync(dto);

                ok = true;
            });
            if (!ok)
                return;

            if (_invoiceSeed is not null && !_isEdit)
            {
                _onPaymentRecorded?.Invoke();
                MessageBox.Show(
                    $"Payment saved and linked to invoice {_invoiceSeed.FormattedDocNo}.",
                    "Payment recorded",
                    MessageBoxButton.OK,
                    MessageBoxImage.Information);
                _host.GoBack();
                return;
            }
        }

        if (ClearAfterSave && !_isEdit)
        {
            RefNo = string.Empty;
            AccountCode = string.Empty;
            AccountName = string.Empty;
            Amount = "0";
            Narration = string.Empty;
            await InitializeNewAsync();
            return;
        }

        _host.GoBack();
    }

    internal void SetFromDto(PaymentVoucherDto dto)
    {
        VoucherNo = dto.VoucherNo.ToString(CultureInfo.InvariantCulture);
        RefNo = dto.RefNo ?? string.Empty;
        VoucherDate = dto.VoucherDate?.Date ?? DateTime.Today;
        CashBank = dto.CashBank ?? "CASH";
        AccountCode = dto.AccountCode ?? string.Empty;
        AccountName = dto.AccountName ?? string.Empty;
        Amount = dto.Amount.ToString(CultureInfo.InvariantCulture);
        Narration = dto.Narration ?? string.Empty;
    }
}
