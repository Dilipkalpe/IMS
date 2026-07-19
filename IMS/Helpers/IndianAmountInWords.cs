using System.Globalization;

namespace IMS.Helpers;

public static class IndianAmountInWords
{
    private static readonly string[] Ones =
    [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
        "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];

    private static readonly string[] Tens =
        ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    public static string ToRupeeWords(decimal amount)
    {
        var rupees = (long)Math.Floor(Math.Abs(amount));
        if (rupees == 0)
            return "Zero Rupees only";

        return $"{Convert(rupees).Trim()} Rupees only";
    }

    private static string Convert(long n)
    {
        if (n < 20)
            return Ones[n];

        if (n < 100)
            return $"{Tens[n / 10]} {Ones[n % 10]}".Trim();

        if (n < 1000)
            return $"{Ones[n / 100]} Hundred {Convert(n % 100)}".Trim();

        if (n < 100_000)
            return $"{Convert(n / 1000)} Thousand {Convert(n % 1000)}".Trim();

        if (n < 10_000_000)
            return $"{Convert(n / 100_000)} Lakh {Convert(n % 100_000)}".Trim();

        return $"{Convert(n / 10_000_000)} Crore {Convert(n % 10_000_000)}".Trim();
    }

    public static decimal ParseDecimal(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return 0;

        return decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out var d)
            || decimal.TryParse(value, NumberStyles.Any, CultureInfo.CurrentCulture, out d)
            ? d
            : 0;
    }
}
