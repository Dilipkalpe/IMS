using System.Globalization;
using System.Windows;
using System.Windows.Input;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels.SubPages;

public sealed class CreditNoteEntryViewModel : SubPageViewModelBase
{
    private readonly MainViewModel _host;
    private readonly bool _isEdit;
    private readonly int _originalVoucherNo;
    private List<AccountDto> _accounts = [];

    private string _voucherNo = "1";
    private string _refNo = string.Empty;
    private DateTime? _voucherDate = DateTime.Today;
    private string _accountCode = string.Empty;
    private string _accountName = string.Empty;
    private string _amount = "0";
    private string _gstRate = "0";
    private string _totalAmount = "0";
    private bool _isIgst;
    private string _narration = string.Empty;
    private bool _clearAfterSave = true;

    public CreditNoteEntryViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Credit Note",
        pageTitle: "Add Credit Note",
        pageDescription: "Issue a credit note to a party — amount, GST, and IGST option.",
        iconGlyph: "\uE8C1")
    {
        _host = host;
        SaveCommand = new AsyncRelayCommand(SaveAsync);
        LookupAccountCommand = new RelayCommand(LookupAccount);
        _ = InitializeNewAsync();
    }

    public CreditNoteEntryViewModel(MainViewModel host, int voucherNo) : base(
        host,
        parentTitle: "Credit Note",
        pageTitle: "Edit Credit Note",
        pageDescription: "Update an existing credit note.",
        iconGlyph: "\uE70F")
    {
        _host = host;
        _isEdit = true;
        _originalVoucherNo = voucherNo;
        SaveCommand = new AsyncRelayCommand(SaveAsync);
        LookupAccountCommand = new RelayCommand(LookupAccount);
        _ = LoadVoucherAsync(voucherNo);
    }

    public ICommand LookupAccountCommand { get; }

    public string VoucherTypeLabel => "CREDIT NOTE";

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
        set
        {
            if (SetProperty(ref _amount, value))
                RecalculateTotal();
        }
    }

    public string GstRate
    {
        get => _gstRate;
        set
        {
            if (SetProperty(ref _gstRate, value))
                RecalculateTotal();
        }
    }

    public string TotalAmount
    {
        get => _totalAmount;
        set => SetProperty(ref _totalAmount, value);
    }

    public bool IsIgst
    {
        get => _isIgst;
        set => SetProperty(ref _isIgst, value);
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
            var next = await ImsApiClient.GetNextCreditNoteNoAsync();
            VoucherNo = next.ToString(CultureInfo.InvariantCulture);
        });
        RecalculateTotal();
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
            var note = await ImsApiClient.GetCreditNoteByNoAsync(voucherNo);
            if (note is null)
                return;

            SetFromDto(note);
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

    private void RecalculateTotal()
    {
        var amount = ParseDecimal(Amount);
        var gstRate = ParseDecimal(GstRate);
        var total = amount + amount * gstRate / 100m;
        TotalAmount = total.ToString("N2", CultureInfo.InvariantCulture);
    }

    private async Task SaveAsync()
    {
        var amount = ParseDecimal(Amount);
        var gstRate = ParseDecimal(GstRate);
        RecalculateTotal();
        var totalAmount = ParseDecimal(TotalAmount);

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
            MessageBox.Show("Enter a valid note number.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (ImsApiClient.IsAvailable)
        {
            var ok = false;
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var dto = ApiDocumentMapper.FromCreditNoteEntry(this, voucherNo, amount, gstRate, totalAmount);
                if (_isEdit)
                    await ImsApiClient.UpdateCreditNoteByNoAsync(_originalVoucherNo, dto);
                else
                    await ImsApiClient.CreateCreditNoteAsync(dto);

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
            GstRate = "0";
            IsIgst = false;
            Narration = string.Empty;
            await InitializeNewAsync();
            return;
        }

        _host.GoBack();
    }

    internal void SetFromDto(CreditNoteDto dto)
    {
        VoucherNo = dto.VoucherNo.ToString(CultureInfo.InvariantCulture);
        RefNo = dto.RefNo ?? string.Empty;
        VoucherDate = dto.VoucherDate?.Date ?? DateTime.Today;
        AccountCode = dto.AccountCode ?? string.Empty;
        AccountName = dto.AccountName ?? string.Empty;
        Amount = dto.Amount.ToString(CultureInfo.InvariantCulture);
        GstRate = dto.GstRate.ToString(CultureInfo.InvariantCulture);
        TotalAmount = dto.TotalAmount.ToString("N2", CultureInfo.InvariantCulture);
        IsIgst = dto.IsIgst;
        Narration = dto.Narration ?? string.Empty;
    }

    private static decimal ParseDecimal(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return 0m;

        if (decimal.TryParse(value, NumberStyles.Number, CultureInfo.CurrentCulture, out var result))
            return result;

        return decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out result)
            ? result
            : 0m;
    }
}
