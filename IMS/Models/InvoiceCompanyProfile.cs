namespace IMS.Models;

/// <summary>Default company details for tax invoice printing (matches sample layout).</summary>
public sealed class InvoiceCompanyProfile
{
    public string BusinessName { get; init; } = "RAJ CLOTH CENTER";
    public string Address { get; init; } =
        "SHOP NO.3 SVY NO.50 GAJRAI COMPLEX NEAR BORAH COMPANY, NARHE, PUNE.";
    public string Phone { get; init; } = "8421802210";
    public string Gstin { get; init; } = "27ARDPP7668M1ZX";
    public string State { get; init; } = "27-Maharashtra";
    public string PlaceOfSupply { get; init; } = "27-Maharashtra";
    public string BankName { get; init; } = "IDBI BANK";
    public string BankAccountNo { get; init; } = "1357102000002608";
    public string BankIfsc { get; init; } = "IBKL0001357";
    public string BankAccountHolder { get; init; } = "raj cloth center";
    public string LogoText { get; init; } = "Raj";
    public string LogoImage { get; init; } = string.Empty;
    public string[] Terms { get; init; } =
    [
        "Goods sold will not be taken back.",
        "Subject to Pune jurisdiction.",
        "E. & O.E."
    ];

    public static InvoiceCompanyProfile Default { get; } = new();
}
