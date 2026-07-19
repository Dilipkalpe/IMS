using IMS.ViewModels;

namespace IMS.Models;

public sealed class StockTransferLineItem : ViewModelBase
{
    private int _srNo;
    private string _productId = string.Empty;
    private string _productCode = string.Empty;
    private string _brandName = string.Empty;
    private string _productName = string.Empty;
    private string _hsnCode = string.Empty;
    private string _batchNo = string.Empty;
    private string _expDate = string.Empty;
    private string _qty = string.Empty;
    private string _unit = string.Empty;

    public int SrNo
    {
        get => _srNo;
        set => SetProperty(ref _srNo, value);
    }

    public string ProductId
    {
        get => _productId;
        set => SetProperty(ref _productId, value);
    }

    public string ProductCode
    {
        get => _productCode;
        set => SetProperty(ref _productCode, value);
    }

    public string BrandName
    {
        get => _brandName;
        set => SetProperty(ref _brandName, value);
    }

    public string ProductName
    {
        get => _productName;
        set => SetProperty(ref _productName, value);
    }

    public string HsnCode
    {
        get => _hsnCode;
        set => SetProperty(ref _hsnCode, value);
    }

    public string BatchNo
    {
        get => _batchNo;
        set => SetProperty(ref _batchNo, value);
    }

    public string ExpDate
    {
        get => _expDate;
        set => SetProperty(ref _expDate, value);
    }

    public string Qty
    {
        get => _qty;
        set => SetProperty(ref _qty, value);
    }

    public string Unit
    {
        get => _unit;
        set => SetProperty(ref _unit, value);
    }
}
