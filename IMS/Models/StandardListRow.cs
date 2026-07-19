namespace IMS.Models;

/// <summary>Generic grid row for standard list pages (values keyed by column catalog).</summary>
public sealed class StandardListRow
{
    public int SerialNo { get; init; }
    public Dictionary<string, string> Cells { get; init; } = new(StringComparer.OrdinalIgnoreCase);
    public object? Tag { get; init; }

    public string Get(string key) =>
        Cells.TryGetValue(key, out var value) ? value : string.Empty;

    public string this[string key] => Get(key);

    public static StandardListRow FromMockRow(MockRow row, int serialNo, IReadOnlyList<string> columnKeys)
    {
        var cells = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["col1"] = row.Col1,
            ["col2"] = row.Col2,
            ["col3"] = row.Col3,
            ["col4"] = row.Col4,
            ["col5"] = row.Col5,
            ["status"] = row.Status
        };
        return new StandardListRow { SerialNo = serialNo, Cells = cells, Tag = row };
    }

    public static StandardListRow FromSalesOrderRow(SalesOrderListRow row)
    {
        var cells = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["soNo"] = row.SoNo,
            ["soDate"] = row.SoDate,
            ["customer"] = row.Customer,
            ["totalTaxable"] = row.TotalTaxableDisplay,
            ["totalCgst"] = row.TotalCgstDisplay,
            ["totalSgst"] = row.TotalSgstDisplay,
            ["totalIgst"] = row.TotalIgstDisplay,
            ["totalDiscount"] = row.TotalDiscountDisplay,
            ["salesAmt"] = row.SalesAmountDisplay,
            ["paidAmt"] = row.PaidAmountDisplay,
            ["balance"] = row.BalanceDisplay,
            ["status"] = row.Status
        };
        return new StandardListRow { SerialNo = row.SerialNo, Cells = cells, Tag = row };
    }
}
