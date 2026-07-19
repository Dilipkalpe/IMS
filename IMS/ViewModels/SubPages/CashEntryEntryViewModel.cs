using System.Collections.ObjectModel;
using System.Collections.Specialized;
using System.Globalization;
using System.Windows;
using System.Windows.Input;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api;
using IMS.Services.Api.Dtos;

namespace IMS.ViewModels.SubPages;

public sealed class CashEntryEntryViewModel : SubPageViewModelBase
{
    private readonly MainViewModel _host;
    private readonly bool _isEdit;
    private readonly int _originalEntryNo;

    private string _entryNo = "1";
    private DateTime? _entryDate = DateTime.Today;
    private string? _selectedParticular;
    private string _lineAmount = "0";
    private string _totalDisplay = "0.00";
    private bool _clearAfterSave = true;
    private IReadOnlyList<string> _particularOptions = [];

    public CashEntryEntryViewModel(MainViewModel host) : base(
        host,
        parentTitle: "Petty Cash",
        pageTitle: "Cash Entry",
        pageDescription: "Record petty cash expenses — add particulars and amounts, then save.",
        iconGlyph: "\uE8C4")
    {
        _host = host;
        LineItems = new ObservableCollection<CashEntryLineItem>();
        LineItems.CollectionChanged += OnLineItemsCollectionChanged;
        AddLineCommand = new RelayCommand(AddLine);
        DeleteLineCommand = new RelayCommand(p => _ = DeleteLineAsync(p), static p => p is CashEntryLineItem);
        SaveCommand = new AsyncRelayCommand(SaveAsync);
        _ = InitializeNewAsync();
    }

    public CashEntryEntryViewModel(MainViewModel host, int entryNo) : base(
        host,
        parentTitle: "Petty Cash",
        pageTitle: "Edit Cash Entry",
        pageDescription: "Update an existing cash entry.",
        iconGlyph: "\uE70F")
    {
        _host = host;
        _isEdit = true;
        _originalEntryNo = entryNo;
        LineItems = new ObservableCollection<CashEntryLineItem>();
        LineItems.CollectionChanged += OnLineItemsCollectionChanged;
        AddLineCommand = new RelayCommand(AddLine);
        DeleteLineCommand = new RelayCommand(p => _ = DeleteLineAsync(p), static p => p is CashEntryLineItem);
        SaveCommand = new AsyncRelayCommand(SaveAsync);
        _ = LoadEntryAsync(entryNo);
    }

    public string VoucherTypeLabel => "CASH ENTRY";

    public bool IsEdit => _isEdit;

    public ObservableCollection<CashEntryLineItem> LineItems { get; }

    public IReadOnlyList<string> ParticularOptions => _particularOptions;

    public ICommand AddLineCommand { get; }
    public ICommand DeleteLineCommand { get; }

    public string EntryNo
    {
        get => _entryNo;
        set => SetProperty(ref _entryNo, value);
    }

    public DateTime? EntryDate
    {
        get => _entryDate;
        set => SetProperty(ref _entryDate, value);
    }

    public string? SelectedParticular
    {
        get => _selectedParticular;
        set => SetProperty(ref _selectedParticular, value);
    }

    public string LineAmount
    {
        get => _lineAmount;
        set => SetProperty(ref _lineAmount, value);
    }

    public string TotalDisplay
    {
        get => _totalDisplay;
        set => SetProperty(ref _totalDisplay, value);
    }

    public bool ClearAfterSave
    {
        get => _clearAfterSave;
        set => SetProperty(ref _clearAfterSave, value);
    }

    private async Task InitializeNewAsync()
    {
        await LoadParticularsAsync();
        if (!ImsApiClient.IsAvailable)
            return;

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var next = await ImsApiClient.GetNextCashEntryNoAsync();
            EntryNo = next.ToString(CultureInfo.InvariantCulture);
        });
        RecalculateTotal();
    }

    private async Task LoadEntryAsync(int entryNo)
    {
        await LoadParticularsAsync();
        if (!ImsApiClient.IsAvailable)
        {
            EntryNo = entryNo.ToString(CultureInfo.InvariantCulture);
            return;
        }

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var entry = await ImsApiClient.GetCashEntryByNoAsync(entryNo);
            if (entry is null)
                return;

            SetFromDto(entry);
        });
    }

    private async Task LoadParticularsAsync()
    {
        if (!ImsApiClient.IsAvailable)
        {
            _particularOptions =
            [
                "Office Supplies",
                "Travel Expense",
                "Refreshments",
                "Courier Charges",
                "Miscellaneous"
            ];
            OnPropertyChanged(nameof(ParticularOptions));
            return;
        }

        await ApiUiHelper.RunWithApiAsync(async () =>
        {
            var accounts = await ImsApiClient.GetAccountsAsync();
            _particularOptions = accounts
                .Select(a => a.Name)
                .Where(n => !string.IsNullOrWhiteSpace(n))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(n => n, StringComparer.OrdinalIgnoreCase)
                .ToList();
            OnPropertyChanged(nameof(ParticularOptions));
        });
    }

    private void AddLine()
    {
        if (string.IsNullOrWhiteSpace(SelectedParticular))
        {
            MessageBox.Show("Select a particular.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        var amount = ParseDecimal(LineAmount);
        if (amount <= 0)
        {
            MessageBox.Show("Amount must be greater than zero.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        LineItems.Add(new CashEntryLineItem
        {
            SrNo = LineItems.Count + 1,
            Particular = SelectedParticular.Trim(),
            Amount = amount.ToString(CultureInfo.InvariantCulture)
        });

        LineAmount = "0";
        RecalculateTotal();
    }

    private async Task DeleteLineAsync(object? parameter)
    {
        if (parameter is not CashEntryLineItem line)
            return;

        var recordKey = $"{EntryNo}:{line.SrNo}";
        if (!await EditDeleteGuard.AuthorizeDeleteAsync(PageTitle, recordKey, line.Particular))
            return;

        LineItems.Remove(line);
        RenumberLines();
        RecalculateTotal();
    }

    private void OnLineItemsCollectionChanged(object? sender, NotifyCollectionChangedEventArgs e)
    {
        if (e.Action == NotifyCollectionChangedAction.Reset
            || e.Action == NotifyCollectionChangedAction.Remove
            || e.Action == NotifyCollectionChangedAction.Add)
            RecalculateTotal();
    }

    private void RenumberLines()
    {
        for (var i = 0; i < LineItems.Count; i++)
            LineItems[i].SrNo = i + 1;
    }

    private void RecalculateTotal()
    {
        var total = LineItems.Sum(l => ParseDecimal(l.Amount));
        TotalDisplay = total.ToString("N2", CultureInfo.InvariantCulture);
    }

    private async Task SaveAsync()
    {
        if (LineItems.Count == 0)
        {
            MessageBox.Show("Add at least one line item.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (!int.TryParse(EntryNo, NumberStyles.Integer, CultureInfo.InvariantCulture, out var entryNo))
        {
            MessageBox.Show("Enter a valid entry number.", "Validation",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        RecalculateTotal();
        var totalAmount = ParseDecimal(TotalDisplay);

        if (ImsApiClient.IsAvailable)
        {
            var ok = false;
            await ApiUiHelper.RunWithApiAsync(async () =>
            {
                var dto = ApiDocumentMapper.FromCashEntryEntry(this, entryNo, totalAmount);
                if (_isEdit)
                    await ImsApiClient.UpdateCashEntryByNoAsync(_originalEntryNo, dto);
                else
                    await ImsApiClient.CreateCashEntryAsync(dto);

                ok = true;
            });
            if (!ok)
                return;
        }

        if (ClearAfterSave && !_isEdit)
        {
            LineItems.Clear();
            SelectedParticular = null;
            LineAmount = "0";
            await InitializeNewAsync();
            return;
        }

        _host.GoBack();
    }

    internal void SetFromDto(CashEntryDto dto)
    {
        EntryNo = dto.EntryNo.ToString(CultureInfo.InvariantCulture);
        EntryDate = dto.EntryDate?.Date ?? DateTime.Today;
        LineItems.Clear();
        foreach (var line in dto.Lines.OrderBy(l => l.SrNo))
        {
            LineItems.Add(new CashEntryLineItem
            {
                SrNo = line.SrNo,
                Particular = line.Particular ?? string.Empty,
                Amount = line.Amount.ToString(CultureInfo.InvariantCulture)
            });
        }
        RecalculateTotal();
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
