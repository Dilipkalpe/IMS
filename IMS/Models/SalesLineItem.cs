using System.Globalization;
using IMS.ViewModels;

namespace IMS.Models;

public sealed class SalesLineItem : ViewModelBase
{
    private int _sr;
    private string _productRetailCode = string.Empty;
    private string _itemDescription = string.Empty;
    private string _qty = "1";
    private string _rate = "0.00";
    private string _salesRate = "0.00";
    private string _discPercent = "0";
    private string _discValue = "0.00";
    private string _taxType = "GST";
    private string _taxPercent = "18";
    private string _amount = "0.00";
    private decimal? _balStk;
    private string _soFormattedDocNo = string.Empty;
    private string _soPrefix = string.Empty;
    private int? _soDocNo;
    private int? _soLineSr;
    private string _dcFormattedDocNo = string.Empty;
    private string _dcPrefix = string.Empty;
    private int? _dcDocNo;
    private int? _dcLineSr;
    private string _poFormattedDocNo = string.Empty;
    private string _poPrefix = string.Empty;
    private int? _poDocNo;
    private int? _poLineSr;
    private string _grnFormattedDocNo = string.Empty;
    private string _grnPrefix = string.Empty;
    private int? _grnDocNo;
    private int? _grnLineSr;
    private decimal? _maxDeliverQty;

    public int Sr
    {
        get => _sr;
        set => SetProperty(ref _sr, value);
    }

    public string ProductRetailCode
    {
        get => _productRetailCode;
        set => SetProperty(ref _productRetailCode, value);
    }

    public string ItemDescription
    {
        get => _itemDescription;
        set => SetProperty(ref _itemDescription, value);
    }

    public string Qty
    {
        get => _qty;
        set
        {
            var next = value;
            if (EffectiveMaxQty is decimal max && Parse(next) > max)
                next = max.ToString("0.###", CultureInfo.InvariantCulture);
            if (!SetProperty(ref _qty, next))
                return;
            RecalculateAmount();
        }
    }

    public string Rate
    {
        get => _rate;
        set
        {
            if (!SetProperty(ref _rate, value))
                return;
            RecalculateAmount();
        }
    }

    /// <summary>Retail/sale price reference on purchase invoice lines (does not affect line tax totals).</summary>
    public string SalesRate
    {
        get => _salesRate;
        set => SetProperty(ref _salesRate, value);
    }

    public string DiscPercent
    {
        get => _discPercent;
        set
        {
            if (!SetProperty(ref _discPercent, value))
                return;
            RecalculateAmount();
        }
    }

    public string DiscValue
    {
        get => _discValue;
        set
        {
            if (!SetProperty(ref _discValue, value))
                return;
            RecalculateAmount();
        }
    }

    public string TaxType
    {
        get => _taxType;
        set => SetProperty(ref _taxType, value);
    }

    public string TaxPercent
    {
        get => _taxPercent;
        set
        {
            if (!SetProperty(ref _taxPercent, value))
                return;
            RecalculateAmount();
        }
    }

    public string Amount
    {
        get => _amount;
        internal set => SetProperty(ref _amount, value);
    }

    /// <summary>On-hand stock snapshot when the product was added (purchase entry).</summary>
    public decimal? BalStk
    {
        get => _balStk;
        set
        {
            if (!SetProperty(ref _balStk, value))
                return;
            OnPropertyChanged(nameof(BalStkDisplay));
        }
    }

    public string BalStkDisplay =>
        _balStk.HasValue ? _balStk.Value.ToString("N2") : string.Empty;

    public string SoFormattedDocNo
    {
        get => _soFormattedDocNo;
        set => SetProperty(ref _soFormattedDocNo, value);
    }

    public string SoPrefix
    {
        get => _soPrefix;
        set => SetProperty(ref _soPrefix, value);
    }

    public int? SoDocNo
    {
        get => _soDocNo;
        set => SetProperty(ref _soDocNo, value);
    }

    public int? SoLineSr
    {
        get => _soLineSr;
        set => SetProperty(ref _soLineSr, value);
    }

    public decimal? MaxDeliverQty
    {
        get => _maxDeliverQty;
        set => SetProperty(ref _maxDeliverQty, value);
    }

    public decimal? EffectiveMaxQty => MaxDeliverQty;

    public string DcFormattedDocNo
    {
        get => _dcFormattedDocNo;
        set => SetProperty(ref _dcFormattedDocNo, value);
    }

    public string DcPrefix
    {
        get => _dcPrefix;
        set => SetProperty(ref _dcPrefix, value);
    }

    public int? DcDocNo
    {
        get => _dcDocNo;
        set => SetProperty(ref _dcDocNo, value);
    }

    public int? DcLineSr
    {
        get => _dcLineSr;
        set => SetProperty(ref _dcLineSr, value);
    }

    public string PoFormattedDocNo
    {
        get => _poFormattedDocNo;
        set => SetProperty(ref _poFormattedDocNo, value);
    }

    public string PoPrefix
    {
        get => _poPrefix;
        set => SetProperty(ref _poPrefix, value);
    }

    public int? PoDocNo
    {
        get => _poDocNo;
        set => SetProperty(ref _poDocNo, value);
    }

    public int? PoLineSr
    {
        get => _poLineSr;
        set => SetProperty(ref _poLineSr, value);
    }

    public string GrnFormattedDocNo
    {
        get => _grnFormattedDocNo;
        set => SetProperty(ref _grnFormattedDocNo, value);
    }

    public string GrnPrefix
    {
        get => _grnPrefix;
        set => SetProperty(ref _grnPrefix, value);
    }

    public int? GrnDocNo
    {
        get => _grnDocNo;
        set => SetProperty(ref _grnDocNo, value);
    }

    public int? GrnLineSr
    {
        get => _grnLineSr;
        set => SetProperty(ref _grnLineSr, value);
    }

    public bool HasSalesOrderSource => !string.IsNullOrWhiteSpace(SoFormattedDocNo);

    public bool HasDeliveryChallanSource => !string.IsNullOrWhiteSpace(DcFormattedDocNo);

    public bool HasPurchaseOrderSource => !string.IsNullOrWhiteSpace(PoFormattedDocNo);

    public bool HasGrnSource => !string.IsNullOrWhiteSpace(GrnFormattedDocNo);

    public string SourceDocNoDisplay =>
        !string.IsNullOrWhiteSpace(DcFormattedDocNo) ? DcFormattedDocNo
        : !string.IsNullOrWhiteSpace(SoFormattedDocNo) ? SoFormattedDocNo
        : !string.IsNullOrWhiteSpace(PoFormattedDocNo) ? PoFormattedDocNo
        : !string.IsNullOrWhiteSpace(GrnFormattedDocNo) ? GrnFormattedDocNo
        : string.Empty;

    public decimal QtyValue => Parse(Qty);

    public decimal RateValue => Parse(Rate);

    public decimal DiscountPercentValue => Parse(DiscPercent);

    public decimal DiscountValueValue => Parse(DiscValue);

    public decimal TaxPercentValue => Parse(TaxPercent);

    public decimal LineGrossValue => QtyValue * RateValue;

    public decimal TaxableValue
    {
        get
        {
            var discVal = DiscountValueValue;
            if (discVal <= 0 && DiscountPercentValue > 0)
                discVal = LineGrossValue * DiscountPercentValue / 100m;
            return Math.Max(0, LineGrossValue - discVal);
        }
    }

    public decimal TaxAmountValue => TaxableValue * TaxPercentValue / 100m;

    public decimal CgstPercentValue => TaxPercentValue / 2m;

    public decimal SgstPercentValue => TaxPercentValue / 2m;

    public decimal CgstAmountValue => TaxAmountValue / 2m;

    public decimal SgstAmountValue => TaxAmountValue / 2m;

    public decimal IgstPercentValue => TaxPercentValue;

    public decimal IgstAmountValue => TaxAmountValue;

    public decimal LineTotalValue => TaxableValue + TaxAmountValue;

    public string TaxableDisplay => TaxableValue.ToString("N2");

    public string CgstPercentDisplay => CgstPercentValue.ToString("N2");

    public string SgstPercentDisplay => SgstPercentValue.ToString("N2");

    public string CgstAmountDisplay => CgstAmountValue.ToString("N2");

    public string SgstAmountDisplay => SgstAmountValue.ToString("N2");

    public string IgstPercentDisplay => IgstPercentValue.ToString("N2");

    public string IgstAmountDisplay => IgstAmountValue.ToString("N2");

    public string LineTotalDisplay => LineTotalValue.ToString("N2");

    public void NotifyTaxComputedChanged()
    {
        OnPropertyChanged(nameof(QtyValue));
        OnPropertyChanged(nameof(RateValue));
        OnPropertyChanged(nameof(DiscountPercentValue));
        OnPropertyChanged(nameof(DiscountValueValue));
        OnPropertyChanged(nameof(TaxPercentValue));
        OnPropertyChanged(nameof(LineGrossValue));
        OnPropertyChanged(nameof(TaxableValue));
        OnPropertyChanged(nameof(TaxAmountValue));
        OnPropertyChanged(nameof(CgstPercentValue));
        OnPropertyChanged(nameof(SgstPercentValue));
        OnPropertyChanged(nameof(CgstAmountValue));
        OnPropertyChanged(nameof(SgstAmountValue));
        OnPropertyChanged(nameof(IgstPercentValue));
        OnPropertyChanged(nameof(IgstAmountValue));
        OnPropertyChanged(nameof(LineTotalValue));
        OnPropertyChanged(nameof(TaxableDisplay));
        OnPropertyChanged(nameof(CgstPercentDisplay));
        OnPropertyChanged(nameof(SgstPercentDisplay));
        OnPropertyChanged(nameof(CgstAmountDisplay));
        OnPropertyChanged(nameof(SgstAmountDisplay));
        OnPropertyChanged(nameof(IgstPercentDisplay));
        OnPropertyChanged(nameof(IgstAmountDisplay));
        OnPropertyChanged(nameof(LineTotalDisplay));
    }

    public void RecalculateAmount()
    {
        if (!decimal.TryParse(Qty, out var qty)) qty = 0;
        if (!decimal.TryParse(Rate, out var rate)) rate = 0;
        if (!decimal.TryParse(DiscPercent, out var discPct)) discPct = 0;
        if (!decimal.TryParse(DiscValue, out var discVal)) discVal = 0;
        if (!decimal.TryParse(TaxPercent, out var taxPct)) taxPct = 0;

        var lineGross = qty * rate;
        if (discVal <= 0 && discPct > 0)
            discVal = lineGross * discPct / 100m;

        var taxable = Math.Max(0, lineGross - discVal);
        var tax = taxable * taxPct / 100m;
        Amount = (taxable + tax).ToString("N2");
        NotifyTaxComputedChanged();
    }

    private static decimal Parse(string? value) =>
        decimal.TryParse(value, out var d) ? d : 0m;
}
