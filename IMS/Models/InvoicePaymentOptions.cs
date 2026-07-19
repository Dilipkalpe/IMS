namespace IMS.Models;

public static class InvoicePaymentOptions
{
    public static readonly string[] PaymentTypes = ["Credit", "Cash", "Partial"];

    public static readonly string[] PaymentModes = ["Cash", "Bank", "UPI", "Cheque", "Card"];

    public static string DefaultPaymentType => "Credit";

    public static string DefaultPaymentMode => "Cash";
}
