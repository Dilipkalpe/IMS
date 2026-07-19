using System.Globalization;
using System.Windows;
using System.Windows.Input;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels.SubPages;

public sealed class BankEntryEntryViewModel : SubPageViewModelBase
{
    private static readonly string[] CashBankChoices = ["DEPOSIT", "WITHDRAWAL", "TRANSFER"];

    private readonly MainViewModel _host;
    private readonly bool _isEdit;
    private readonly int _originalVoucherNo;
    private List<AccountDto> _accounts = [];

    private string _voucherNo = "1";
    private string _refNo = string.Empty;
    private DateTime? _voucherDate = DateTime.Today;
    private string _cashBank = "DEPOSIT";
    private string _accountCode = string.Empty;
    private string _accountName = string.Empty;
    private string _amount = "0";
    private string _narration = string.Empty;
    private bool _clearAfterSave = true;

    public BankEntryEntryViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Bank Entry",
        pageTitle: "Add Bank Entry",
        pageDescription: "Record a bank deposit, withdrawal, or transfer against an account.",
        iconGlyph: "\uE825")
    {
        _host = host;
        SaveCommand = new AsyncRelayCommand(SaveAsync);
        LookupAccountCommand = new RelayCommand(LookupAccount);
        _ = InitializeNewAsync();
    }

    public BankEntryEntryViewModel(MainViewModel host, int voucherNo) : base(
        host,
        parentTitle: "Bank Entry",
        pageTitle: "Edit Bank Entry",
        pageDescription: "Update an existing bank entry.",
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

    public string VoucherTypeLabel => "BANK ENTRY";

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
            var next = await ImsApiClient.GetNextBankEntryNoAsync();
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
            var entry = await ImsApiClient.GetBankEntryByNoAsync(voucherNo);
            if (entry is null)
                return;

            SetFromDto(entry);
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
            MessageBox.Show("Enter a valid entry number.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (ImsApiClient.IsAvailable)
        {
            var ok = false;
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var dto = ApiDocumentMapper.FromBankEntryEntry(this, voucherNo);
                if (_isEdit)
                    await ImsApiClient.UpdateBankEntryByNoAsync(_originalVoucherNo, dto);
                else
                    await ImsApiClient.CreateBankEntryAsync(dto);

                ok = true;
            });
            if (!ok)
                return;
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

    internal void SetFromDto(BankEntryDto dto)
    {
        VoucherNo = dto.VoucherNo.ToString(CultureInfo.InvariantCulture);
        RefNo = dto.RefNo ?? string.Empty;
        VoucherDate = dto.VoucherDate?.Date ?? DateTime.Today;
        CashBank = dto.CashBank ?? "DEPOSIT";
        AccountCode = dto.AccountCode ?? string.Empty;
        AccountName = dto.AccountName ?? string.Empty;
        Amount = dto.Amount.ToString(CultureInfo.InvariantCulture);
        Narration = dto.Narration ?? string.Empty;
    }
}
