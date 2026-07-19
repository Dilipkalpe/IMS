using IMS.ViewModels;

namespace IMS.Models;

public sealed class BomRawMaterialLine : ViewModelBase
{
    private int _srNo;
    private string _itemId = string.Empty;
    private string _itemCode = string.Empty;
    private string _itemName = string.Empty;
    private string _unit = string.Empty;
    private string _qty = "0";
    private string _scrapPercent = "0";
    private string _rate = "0";
    private string _amount = "0";

    public int SrNo
    {
        get => _srNo;
        set => SetProperty(ref _srNo, value);
    }

    public string ItemId
    {
        get => _itemId;
        set => SetProperty(ref _itemId, value);
    }

    public string ItemCode
    {
        get => _itemCode;
        set => SetProperty(ref _itemCode, value);
    }

    public string ItemName
    {
        get => _itemName;
        set => SetProperty(ref _itemName, value);
    }

    public string Unit
    {
        get => _unit;
        set => SetProperty(ref _unit, value);
    }

    public string Qty
    {
        get => _qty;
        set
        {
            if (!SetProperty(ref _qty, value))
                return;
            RecalculateAmount();
        }
    }

    public string ScrapPercent
    {
        get => _scrapPercent;
        set => SetProperty(ref _scrapPercent, value);
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

    public string Amount
    {
        get => _amount;
        private set => SetProperty(ref _amount, value);
    }

    public void RecalculateAmount()
    {
        var qty = decimal.TryParse(Qty, out var q) ? q : 0;
        var rate = decimal.TryParse(Rate, out var r) ? r : 0;
        Amount = (qty * rate).ToString("N2");
    }
}
