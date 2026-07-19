using System.Text.Json.Serialization;

namespace IMS.Services.Api.Dtos;

public sealed class PagedResponse<T>
{
    [JsonPropertyName("items")]
    public List<T> Items { get; set; } = [];

    [JsonPropertyName("total")]
    public int Total { get; set; }
}

public sealed class ProductDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string? Category { get; set; }

    [JsonPropertyName("unit")]
    public string? Unit { get; set; }

    [JsonPropertyName("salePrice")]
    public decimal SalePrice { get; set; }

    [JsonPropertyName("purchasePrice")]
    public decimal PurchasePrice { get; set; }

    [JsonPropertyName("size")]
    public string? Size { get; set; }

    [JsonPropertyName("length")]
    public string? Length { get; set; }

    [JsonPropertyName("brand")]
    public string? Brand { get; set; }

    [JsonPropertyName("hsnCode")]
    public string? HsnCode { get; set; }

    [JsonPropertyName("reorderQty")]
    public decimal ReorderQty { get; set; }

    [JsonPropertyName("minOrderQty")]
    public decimal MinOrderQty { get; set; }

    [JsonPropertyName("cgst")]
    public decimal Cgst { get; set; }

    [JsonPropertyName("sgst")]
    public decimal Sgst { get; set; }

    [JsonPropertyName("igst")]
    public decimal Igst { get; set; }

    [JsonPropertyName("productType")]
    public string? ProductType { get; set; }

    [JsonPropertyName("productMainGroup")]
    public string? ProductMainGroup { get; set; }

    [JsonPropertyName("productSubGroup")]
    public string? ProductSubGroup { get; set; }

    [JsonPropertyName("assemblyType")]
    public string? AssemblyType { get; set; }

    [JsonPropertyName("saleUom")]
    public string? SaleUom { get; set; }

    [JsonPropertyName("purchaseUom")]
    public string? PurchaseUom { get; set; }

    [JsonPropertyName("serialApplicable")]
    public bool SerialApplicable { get; set; }

    [JsonPropertyName("gstExempt")]
    public bool GstExempt { get; set; }

    [JsonPropertyName("activeStatus")]
    public bool ActiveStatus { get; set; } = true;

    [JsonPropertyName("productImage")]
    public string? ProductImage { get; set; }

    [JsonPropertyName("taxType")]
    public string? TaxType { get; set; }

    [JsonPropertyName("taxPercent")]
    public string? TaxPercent { get; set; }

    [JsonPropertyName("stockQty")]
    public decimal StockQty { get; set; }
}

public sealed class ProductSearchResponseDto
{
    [JsonPropertyName("items")]
    public List<ProductLookupDto> Items { get; set; } = [];

    [JsonPropertyName("total")]
    public int Total { get; set; }
}

public sealed class ProductLookupDto
{
    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("rate")]
    public decimal Rate { get; set; }

    [JsonPropertyName("taxType")]
    public string TaxType { get; set; } = "GST";

    [JsonPropertyName("taxPercent")]
    public string TaxPercent { get; set; } = "18";

    [JsonPropertyName("stockQty")]
    public decimal StockQty { get; set; }

    [JsonPropertyName("purchasePrice")]
    public decimal PurchasePrice { get; set; }
}

public sealed class AccountDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("accountType")]
    public string AccountType { get; set; } = "customer";

    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("contactPerson")]
    public string? ContactPerson { get; set; }

    [JsonPropertyName("designation")]
    public string? Designation { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("city")]
    public string? City { get; set; }

    [JsonPropertyName("state")]
    public string? State { get; set; }

    [JsonPropertyName("country")]
    public string? Country { get; set; }

    [JsonPropertyName("pincode")]
    public string? Pincode { get; set; }

    [JsonPropertyName("address")]
    public string? Address { get; set; }

    [JsonPropertyName("mobileNo")]
    public string? MobileNo { get; set; }

    [JsonPropertyName("contactNo")]
    public string? ContactNo { get; set; }

    [JsonPropertyName("fax")]
    public string? Fax { get; set; }

    [JsonPropertyName("cstNo")]
    public string? CstNo { get; set; }

    [JsonPropertyName("tinNo")]
    public string? TinNo { get; set; }

    [JsonPropertyName("panNo")]
    public string? PanNo { get; set; }

    [JsonPropertyName("gstNo")]
    public string? GstNo { get; set; }

    [JsonPropertyName("exciseNo")]
    public string? ExciseNo { get; set; }

    [JsonPropertyName("creditLimit")]
    public decimal CreditLimit { get; set; }

    [JsonPropertyName("creditDays")]
    public decimal CreditDays { get; set; }

    [JsonPropertyName("customerType")]
    public string? CustomerType { get; set; }

    [JsonPropertyName("annualTurnover")]
    public string? AnnualTurnover { get; set; }

    [JsonPropertyName("sourceEmployee")]
    public string? SourceEmployee { get; set; }

    [JsonPropertyName("activeStatus")]
    public bool ActiveStatus { get; set; } = true;

    [JsonPropertyName("billFormatAssignments")]
    public Dictionary<string, string> BillFormatAssignments { get; set; } = new();

    [JsonPropertyName("gstExempt")]
    public bool GstExempt { get; set; }
}

public sealed class TransactionLineDto
{
    [JsonPropertyName("sr")]
    public int Sr { get; set; }

    [JsonPropertyName("productRetailCode")]
    public string ProductRetailCode { get; set; } = string.Empty;

    [JsonPropertyName("itemDescription")]
    public string ItemDescription { get; set; } = string.Empty;

    [JsonPropertyName("qty")]
    public string Qty { get; set; } = "0";

    [JsonPropertyName("rate")]
    public string Rate { get; set; } = "0";

    [JsonPropertyName("salesRate")]
    public string? SalesRate { get; set; }

    [JsonPropertyName("discPercent")]
    public string DiscPercent { get; set; } = "0";

    [JsonPropertyName("discValue")]
    public string DiscValue { get; set; } = "0";

    [JsonPropertyName("taxType")]
    public string TaxType { get; set; } = "GST";

    [JsonPropertyName("taxPercent")]
    public string TaxPercent { get; set; } = "18";

    [JsonPropertyName("amount")]
    public string Amount { get; set; } = "0";
}

public sealed class TransactionTotalsDto
{
    [JsonPropertyName("totQty")]
    public string? TotQty { get; set; }

    [JsonPropertyName("gross")]
    public string? Gross { get; set; }

    [JsonPropertyName("discount")]
    public string? Discount { get; set; }

    [JsonPropertyName("spDiscount")]
    public string? SpDiscount { get; set; }

    [JsonPropertyName("addOther")]
    public string? AddOther { get; set; }

    [JsonPropertyName("net")]
    public string? Net { get; set; }

    [JsonPropertyName("saleAmount")]
    public string? SaleAmount { get; set; }

    [JsonPropertyName("orderAmount")]
    public string? OrderAmount { get; set; }

    [JsonPropertyName("customerReturn")]
    public string? CustomerReturn { get; set; }

    [JsonPropertyName("receivableToCustomer")]
    public string? ReceivableToCustomer { get; set; }

    [JsonPropertyName("supplierReturn")]
    public string? SupplierReturn { get; set; }

    [JsonPropertyName("payableToSupplier")]
    public string? PayableToSupplier { get; set; }
}

public sealed class TransactionDocumentDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("docType")]
    public string DocType { get; set; } = string.Empty;

    [JsonPropertyName("docNo")]
    public int DocNo { get; set; }

    [JsonPropertyName("formattedDocNo")]
    public string FormattedDocNo { get; set; } = string.Empty;

    [JsonPropertyName("billDate")]
    public string? BillDate { get; set; }

    [JsonPropertyName("salesMan")]
    public string? SalesMan { get; set; }

    [JsonPropertyName("customer")]
    public string? Customer { get; set; }

    [JsonPropertyName("buyer")]
    public string? Buyer { get; set; }

    [JsonPropertyName("supplier")]
    public string? Supplier { get; set; }

    [JsonPropertyName("customerDetails")]
    public string? CustomerDetails { get; set; }

    [JsonPropertyName("supplierDetails")]
    public string? SupplierDetails { get; set; }

    [JsonPropertyName("narration")]
    public string? Narration { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("lines")]
    public List<TransactionLineDto> Lines { get; set; } = [];

    [JsonPropertyName("totals")]
    public TransactionTotalsDto? Totals { get; set; }
}

public sealed class NextDocNumberDto
{
    [JsonPropertyName("soPrefix")]
    public string? SoPrefix { get; set; }

    [JsonPropertyName("docPrefix")]
    public string? DocPrefix { get; set; }

    [JsonPropertyName("docNo")]
    public int DocNo { get; set; }

    [JsonPropertyName("formattedDocNo")]
    public string FormattedDocNo { get; set; } = string.Empty;

    [JsonPropertyName("poPrefix")]
    public string? PoPrefix { get; set; }
}

public sealed class NumberedPurchaseDocumentDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("docPrefix")]
    public string DocPrefix { get; set; } = string.Empty;

    [JsonPropertyName("docNo")]
    public int DocNo { get; set; }

    [JsonPropertyName("formattedDocNo")]
    public string FormattedDocNo { get; set; } = string.Empty;

    [JsonPropertyName("billDate")]
    public string? BillDate { get; set; }

    [JsonPropertyName("buyer")]
    public string? Buyer { get; set; }

    [JsonPropertyName("supplier")]
    public string? Supplier { get; set; }

    [JsonPropertyName("supplierDetails")]
    public string? SupplierDetails { get; set; }

    [JsonPropertyName("narration")]
    public string? Narration { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "open";

    [JsonPropertyName("lines")]
    public List<SalesOrderLineDto> Lines { get; set; } = [];

    [JsonPropertyName("totals")]
    public PurchaseOrderTotalsDto? Totals { get; set; }

    [JsonPropertyName("poDate")]
    public DateTime? PoDate { get; set; }

    [JsonPropertyName("paymentTerms")]
    public string? PaymentTerms { get; set; }

    [JsonPropertyName("deliveryPriority")]
    public string? DeliveryPriority { get; set; }

    [JsonPropertyName("billingAddress")]
    public string? BillingAddress { get; set; }

    [JsonPropertyName("shipToAddress")]
    public string? ShipToAddress { get; set; }

    [JsonPropertyName("grnDate")]
    public DateTime? GrnDate { get; set; }

    [JsonPropertyName("poReference")]
    public string? PoReference { get; set; }

    [JsonPropertyName("poReferences")]
    public List<NumberedDocReferenceDto> PoReferences { get; set; } = [];

    [JsonPropertyName("warehouse")]
    public string? Warehouse { get; set; }

    [JsonPropertyName("vehicleNo")]
    public string? VehicleNo { get; set; }

    [JsonPropertyName("transporter")]
    public string? Transporter { get; set; }

    [JsonPropertyName("invoiceDate")]
    public DateTime? InvoiceDate { get; set; }

    [JsonPropertyName("dueDate")]
    public DateTime? DueDate { get; set; }

    [JsonPropertyName("grnReference")]
    public string? GrnReference { get; set; }

    [JsonPropertyName("grnReferences")]
    public List<NumberedDocReferenceDto> GrnReferences { get; set; } = [];

    [JsonPropertyName("gstin")]
    public string? Gstin { get; set; }

    [JsonPropertyName("placeOfSupply")]
    public string? PlaceOfSupply { get; set; }

    [JsonPropertyName("paymentType")]
    public string? PaymentType { get; set; }

    [JsonPropertyName("paymentMode")]
    public string? PaymentMode { get; set; }

    [JsonPropertyName("billAmount")]
    public decimal BillAmount { get; set; }

    [JsonPropertyName("paidAmount")]
    public decimal PaidAmount { get; set; }

    [JsonPropertyName("balanceDue")]
    public decimal BalanceDue { get; set; }

    [JsonPropertyName("returnDate")]
    public DateTime? ReturnDate { get; set; }

    [JsonPropertyName("invoiceReference")]
    public string? InvoiceReference { get; set; }

    [JsonPropertyName("returnReason")]
    public string? ReturnReason { get; set; }

    [JsonPropertyName("qcRemark")]
    public string? QcRemark { get; set; }

    [JsonPropertyName("returnWarehouse")]
    public string? ReturnWarehouse { get; set; }

    [JsonIgnore]
    public string? DocumentTitle { get; set; }
}

public sealed class PurchaseOrderTotalsDto
{
    [JsonPropertyName("totQty")]
    public string? TotQty { get; set; }

    [JsonPropertyName("gross")]
    public string? Gross { get; set; }

    [JsonPropertyName("discount")]
    public string? Discount { get; set; }

    [JsonPropertyName("spDiscount")]
    public string? SpDiscount { get; set; }

    [JsonPropertyName("addOther")]
    public string? AddOther { get; set; }

    [JsonPropertyName("net")]
    public string? Net { get; set; }

    [JsonPropertyName("orderAmount")]
    public string? OrderAmount { get; set; }

    [JsonPropertyName("saleAmount")]
    public string? SaleAmount { get; set; }

    [JsonPropertyName("supplierReturn")]
    public string? SupplierReturn { get; set; }

    [JsonPropertyName("payableToSupplier")]
    public string? PayableToSupplier { get; set; }
}

public sealed class SalesDocumentStatsDto
{
    [JsonPropertyName("total")]
    public int Total { get; set; }

    [JsonPropertyName("open")]
    public int Open { get; set; }

    [JsonPropertyName("draft")]
    public int Draft { get; set; }

    [JsonPropertyName("dispatched")]
    public int Dispatched { get; set; }

    [JsonPropertyName("posted")]
    public int Posted { get; set; }

    [JsonPropertyName("closed")]
    public int Closed { get; set; }

    [JsonPropertyName("cancelled")]
    public int Cancelled { get; set; }

    [JsonPropertyName("active")]
    public int Active { get; set; }
}

public sealed class NumberedSalesDocumentDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("docPrefix")]
    public string DocPrefix { get; set; } = string.Empty;

    [JsonPropertyName("docNo")]
    public int DocNo { get; set; }

    [JsonPropertyName("formattedDocNo")]
    public string FormattedDocNo { get; set; } = string.Empty;

    [JsonPropertyName("billDate")]
    public string? BillDate { get; set; }

    [JsonPropertyName("salesMan")]
    public string? SalesMan { get; set; }

    [JsonPropertyName("customer")]
    public string? Customer { get; set; }

    [JsonPropertyName("customerDetails")]
    public string? CustomerDetails { get; set; }

    [JsonPropertyName("narration")]
    public string? Narration { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "open";

    [JsonPropertyName("lines")]
    public List<SalesOrderLineDto> Lines { get; set; } = [];

    [JsonPropertyName("totals")]
    public SalesOrderTotalsDto? Totals { get; set; }

    [JsonPropertyName("dcDate")]
    public DateTime? DcDate { get; set; }

    [JsonPropertyName("soReference")]
    public string? SoReference { get; set; }

    [JsonPropertyName("soReferences")]
    public List<SalesOrderReferenceDto> SoReferences { get; set; } = [];

    [JsonPropertyName("warehouse")]
    public string? Warehouse { get; set; }

    [JsonPropertyName("vehicleNo")]
    public string? VehicleNo { get; set; }

    [JsonPropertyName("transporter")]
    public string? Transporter { get; set; }

    [JsonPropertyName("transporterId")]
    public string? TransporterId { get; set; }

    [JsonPropertyName("ewayBillNo")]
    public string? EwayBillNo { get; set; }

    [JsonPropertyName("ewayBillDate")]
    public DateTime? EwayBillDate { get; set; }

    [JsonPropertyName("distanceKm")]
    public decimal DistanceKm { get; set; }

    [JsonPropertyName("invoiceDate")]
    public DateTime? InvoiceDate { get; set; }

    [JsonPropertyName("dueDate")]
    public DateTime? DueDate { get; set; }

    [JsonPropertyName("dcReference")]
    public string? DcReference { get; set; }

    [JsonPropertyName("dcReferences")]
    public List<NumberedDocReferenceDto> DcReferences { get; set; } = [];

    [JsonPropertyName("gstin")]
    public string? Gstin { get; set; }

    [JsonPropertyName("placeOfSupply")]
    public string? PlaceOfSupply { get; set; }

    [JsonPropertyName("paymentType")]
    public string? PaymentType { get; set; }

    [JsonPropertyName("paymentMode")]
    public string? PaymentMode { get; set; }

    [JsonPropertyName("billAmount")]
    public decimal BillAmount { get; set; }

    [JsonPropertyName("paidAmount")]
    public decimal PaidAmount { get; set; }

    [JsonPropertyName("balanceDue")]
    public decimal BalanceDue { get; set; }

    [JsonPropertyName("returnDate")]
    public DateTime? ReturnDate { get; set; }

    [JsonPropertyName("invoiceReference")]
    public string? InvoiceReference { get; set; }

    [JsonPropertyName("returnReason")]
    public string? ReturnReason { get; set; }

    [JsonPropertyName("qcRemark")]
    public string? QcRemark { get; set; }

    [JsonPropertyName("returnWarehouse")]
    public string? ReturnWarehouse { get; set; }
}

public sealed class SalesOrderLineDto
{
    [JsonPropertyName("sr")]
    public int Sr { get; set; }

    [JsonPropertyName("productRetailCode")]
    public string? ProductRetailCode { get; set; }

    [JsonPropertyName("itemDescription")]
    public string? ItemDescription { get; set; }

    [JsonPropertyName("qty")]
    public string? Qty { get; set; }

    [JsonPropertyName("rate")]
    public string? Rate { get; set; }

    [JsonPropertyName("salesRate")]
    public string? SalesRate { get; set; }

    [JsonPropertyName("discPercent")]
    public string? DiscPercent { get; set; }

    [JsonPropertyName("discValue")]
    public string? DiscValue { get; set; }

    [JsonPropertyName("taxType")]
    public string? TaxType { get; set; }

    [JsonPropertyName("taxPercent")]
    public string? TaxPercent { get; set; }

    [JsonPropertyName("amount")]
    public string? Amount { get; set; }

    [JsonPropertyName("deliveredQty")]
    public string? DeliveredQty { get; set; }

    [JsonPropertyName("soPrefix")]
    public string? SoPrefix { get; set; }

    [JsonPropertyName("soDocNo")]
    public int? SoDocNo { get; set; }

    [JsonPropertyName("soFormattedDocNo")]
    public string? SoFormattedDocNo { get; set; }

    [JsonPropertyName("soLineSr")]
    public int? SoLineSr { get; set; }

    [JsonPropertyName("soOrderedQty")]
    public string? SoOrderedQty { get; set; }

    [JsonPropertyName("soPendingQty")]
    public string? SoPendingQty { get; set; }

    [JsonPropertyName("dcPrefix")]
    public string? DcPrefix { get; set; }

    [JsonPropertyName("dcDocNo")]
    public int? DcDocNo { get; set; }

    [JsonPropertyName("dcFormattedDocNo")]
    public string? DcFormattedDocNo { get; set; }

    [JsonPropertyName("dcLineSr")]
    public int? DcLineSr { get; set; }

    [JsonPropertyName("dcDeliveredQty")]
    public string? DcDeliveredQty { get; set; }

    [JsonPropertyName("dcPendingQty")]
    public string? DcPendingQty { get; set; }

    [JsonPropertyName("poPrefix")]
    public string? PoPrefix { get; set; }

    [JsonPropertyName("poDocNo")]
    public int? PoDocNo { get; set; }

    [JsonPropertyName("poFormattedDocNo")]
    public string? PoFormattedDocNo { get; set; }

    [JsonPropertyName("poLineSr")]
    public int? PoLineSr { get; set; }

    [JsonPropertyName("poOrderedQty")]
    public string? PoOrderedQty { get; set; }

    [JsonPropertyName("poPendingQty")]
    public string? PoPendingQty { get; set; }

    [JsonPropertyName("grnPrefix")]
    public string? GrnPrefix { get; set; }

    [JsonPropertyName("grnDocNo")]
    public int? GrnDocNo { get; set; }

    [JsonPropertyName("grnFormattedDocNo")]
    public string? GrnFormattedDocNo { get; set; }

    [JsonPropertyName("grnLineSr")]
    public int? GrnLineSr { get; set; }

    [JsonPropertyName("grnReceivedQty")]
    public string? GrnReceivedQty { get; set; }

    [JsonPropertyName("grnPendingQty")]
    public string? GrnPendingQty { get; set; }
}

public sealed class NumberedDocReferenceDto
{
    [JsonPropertyName("docPrefix")]
    public string DocPrefix { get; set; } = string.Empty;

    [JsonPropertyName("docNo")]
    public int DocNo { get; set; }

    [JsonPropertyName("formattedDocNo")]
    public string FormattedDocNo { get; set; } = string.Empty;
}

public sealed class PendingNumberedDocHeaderDto
{
    [JsonPropertyName("docPrefix")]
    public string DocPrefix { get; set; } = string.Empty;

    [JsonPropertyName("docNo")]
    public int DocNo { get; set; }

    [JsonPropertyName("formattedDocNo")]
    public string FormattedDocNo { get; set; } = string.Empty;

    [JsonPropertyName("customer")]
    public string? Customer { get; set; }

    [JsonPropertyName("supplier")]
    public string? Supplier { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("dcDate")]
    public DateTime? DcDate { get; set; }

    [JsonPropertyName("poDate")]
    public DateTime? PoDate { get; set; }

    [JsonPropertyName("grnDate")]
    public DateTime? GrnDate { get; set; }
}

public sealed class PendingNumberedDocsResponseDto
{
    [JsonPropertyName("items")]
    public List<PendingNumberedDocHeaderDto> Items { get; set; } = [];

    [JsonPropertyName("total")]
    public int Total { get; set; }
}

public sealed class PendingConsolidationLinesRequestDto
{
    [JsonPropertyName("customer")]
    public string? Customer { get; set; }

    [JsonPropertyName("supplier")]
    public string? Supplier { get; set; }

    [JsonPropertyName("deliveryChallans")]
    public List<NumberedDocReferenceDto> DeliveryChallans { get; set; } = [];

    [JsonPropertyName("purchaseOrders")]
    public List<NumberedDocReferenceDto> PurchaseOrders { get; set; } = [];

    [JsonPropertyName("grns")]
    public List<NumberedDocReferenceDto> Grns { get; set; } = [];
}

public sealed class PendingConsolidationLinesResponseDto
{
    [JsonPropertyName("lines")]
    public List<SalesOrderLineDto> Lines { get; set; } = [];
}

public sealed class SalesOrderReferenceDto
{
    [JsonPropertyName("soPrefix")]
    public string SoPrefix { get; set; } = "SO";

    [JsonPropertyName("docNo")]
    public int DocNo { get; set; }

    [JsonPropertyName("formattedDocNo")]
    public string FormattedDocNo { get; set; } = string.Empty;
}

public sealed class SalesOrderPendingHeaderDto
{
    [JsonPropertyName("soPrefix")]
    public string SoPrefix { get; set; } = "SO";

    [JsonPropertyName("docNo")]
    public int DocNo { get; set; }

    [JsonPropertyName("formattedDocNo")]
    public string FormattedDocNo { get; set; } = string.Empty;

    [JsonPropertyName("customer")]
    public string? Customer { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("soDate")]
    public DateTime? SoDate { get; set; }
}

public sealed class PendingSalesOrdersResponseDto
{
    [JsonPropertyName("items")]
    public List<SalesOrderPendingHeaderDto> Items { get; set; } = [];

    [JsonPropertyName("total")]
    public int Total { get; set; }
}

public sealed class PendingDeliveryLinesRequestDto
{
    [JsonPropertyName("customer")]
    public string Customer { get; set; } = string.Empty;

    [JsonPropertyName("salesOrders")]
    public List<SalesOrderReferenceDto> SalesOrders { get; set; } = [];
}

public sealed class PendingDeliveryLinesResponseDto
{
    [JsonPropertyName("lines")]
    public List<SalesOrderLineDto> Lines { get; set; } = [];
}

public sealed class SalesOrderTotalsDto
{
    [JsonPropertyName("totQty")]
    public string? TotQty { get; set; }

    [JsonPropertyName("gross")]
    public string? Gross { get; set; }

    [JsonPropertyName("discount")]
    public string? Discount { get; set; }

    [JsonPropertyName("spDiscount")]
    public string? SpDiscount { get; set; }

    [JsonPropertyName("addOther")]
    public string? AddOther { get; set; }

    [JsonPropertyName("net")]
    public string? Net { get; set; }

    [JsonPropertyName("saleAmount")]
    public string? SaleAmount { get; set; }

    [JsonPropertyName("orderAmount")]
    public string? OrderAmount { get; set; }

    [JsonPropertyName("customerReturn")]
    public string? CustomerReturn { get; set; }

    [JsonPropertyName("receivableToCustomer")]
    public string? ReceivableToCustomer { get; set; }
}

public sealed class SalesOrderStatsDto
{
    [JsonPropertyName("total")]
    public int Total { get; set; }

    [JsonPropertyName("open")]
    public int Open { get; set; }

    [JsonPropertyName("confirmed")]
    public int Confirmed { get; set; }

    [JsonPropertyName("picking")]
    public int Picking { get; set; }

    [JsonPropertyName("shipped")]
    public int Shipped { get; set; }

    [JsonPropertyName("closed")]
    public int Closed { get; set; }

    [JsonPropertyName("cancelled")]
    public int Cancelled { get; set; }

    [JsonPropertyName("draft")]
    public int Draft { get; set; }

    [JsonPropertyName("toShip")]
    public int ToShip { get; set; }

    [JsonPropertyName("active")]
    public int Active { get; set; }
}

public sealed class SalesOrderDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    /// <summary>List endpoint may return <c>id</c> instead of <c>_id</c>.</summary>
    [JsonPropertyName("id")]
    public string? ListId { get; set; }

    [JsonPropertyName("soPrefix")]
    public string SoPrefix { get; set; } = "SO";

    [JsonPropertyName("docNo")]
    public int DocNo { get; set; }

    [JsonPropertyName("formattedDocNo")]
    public string FormattedDocNo { get; set; } = string.Empty;

    [JsonPropertyName("soDate")]
    public DateTime? SoDate { get; set; }

    [JsonPropertyName("billDate")]
    public string? BillDate { get; set; }

    [JsonPropertyName("salesMan")]
    public string? SalesMan { get; set; }

    [JsonPropertyName("customer")]
    public string? Customer { get; set; }

    [JsonPropertyName("customerAccountCode")]
    public string? CustomerAccountCode { get; set; }

    [JsonPropertyName("customerDetails")]
    public string? CustomerDetails { get; set; }

    [JsonPropertyName("paymentTerms")]
    public string? PaymentTerms { get; set; }

    [JsonPropertyName("deliveryPriority")]
    public string? DeliveryPriority { get; set; }

    [JsonPropertyName("billingAddress")]
    public string? BillingAddress { get; set; }

    [JsonPropertyName("shippingAddress")]
    public string? ShippingAddress { get; set; }

    [JsonPropertyName("narration")]
    public string? Narration { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "open";

    [JsonPropertyName("lines")]
    public List<SalesOrderLineDto> Lines { get; set; } = [];

    [JsonPropertyName("totals")]
    public SalesOrderTotalsDto? Totals { get; set; }

    [JsonPropertyName("totalTaxable")]
    public decimal TotalTaxable { get; set; }

    [JsonPropertyName("totalCgst")]
    public decimal TotalCgst { get; set; }

    [JsonPropertyName("totalSgst")]
    public decimal TotalSgst { get; set; }

    [JsonPropertyName("totalIgst")]
    public decimal TotalIgst { get; set; }

    [JsonPropertyName("totalDiscount")]
    public decimal TotalDiscount { get; set; }

    [JsonPropertyName("salesAmount")]
    public decimal SalesAmount { get; set; }

    [JsonPropertyName("paidAmount")]
    public decimal PaidAmount { get; set; }

    [JsonPropertyName("balance")]
    public decimal Balance { get; set; }

    public string? ResolvedId => Id ?? ListId;

    /// <summary>Print preview / document header (client only; not stored in API).</summary>
    [JsonIgnore]
    public string? DocumentTitle { get; set; }
}

public sealed class SalesOrderListItemDto
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("_id")]
    public string? MongoId { get; set; }

    [JsonPropertyName("lines")]
    public List<SalesOrderLineDto>? Lines { get; set; }

    [JsonPropertyName("totals")]
    public SalesOrderTotalsDto? Totals { get; set; }

    public string? ResolvedId => Id ?? MongoId;

    [JsonPropertyName("formattedDocNo")]
    public string FormattedDocNo { get; set; } = string.Empty;

    [JsonPropertyName("soPrefix")]
    public string? SoPrefix { get; set; }

    [JsonPropertyName("docNo")]
    public int DocNo { get; set; }

    [JsonPropertyName("soDate")]
    public DateTime? SoDate { get; set; }

    [JsonPropertyName("billDate")]
    public string? BillDate { get; set; }

    [JsonPropertyName("customer")]
    public string? Customer { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("totalTaxable")]
    public decimal TotalTaxable { get; set; }

    [JsonPropertyName("totalCgst")]
    public decimal TotalCgst { get; set; }

    [JsonPropertyName("totalSgst")]
    public decimal TotalSgst { get; set; }

    [JsonPropertyName("totalIgst")]
    public decimal TotalIgst { get; set; }

    [JsonPropertyName("totalDiscount")]
    public decimal TotalDiscount { get; set; }

    [JsonPropertyName("salesAmount")]
    public decimal SalesAmount { get; set; }

    [JsonPropertyName("paidAmount")]
    public decimal PaidAmount { get; set; }

    [JsonPropertyName("balance")]
    public decimal Balance { get; set; }
}

public sealed class StockTransferLineDto
{
    [JsonPropertyName("srNo")]
    public int SrNo { get; set; }

    [JsonPropertyName("productId")]
    public string? ProductId { get; set; }

    [JsonPropertyName("productCode")]
    public string? ProductCode { get; set; }

    [JsonPropertyName("brandName")]
    public string? BrandName { get; set; }

    [JsonPropertyName("productName")]
    public string? ProductName { get; set; }

    [JsonPropertyName("hsnCode")]
    public string? HsnCode { get; set; }

    [JsonPropertyName("batchNo")]
    public string? BatchNo { get; set; }

    [JsonPropertyName("expDate")]
    public string? ExpDate { get; set; }

    [JsonPropertyName("qty")]
    public string? Qty { get; set; }

    [JsonPropertyName("unit")]
    public string? Unit { get; set; }
}

public sealed class CashEntryLineDto
{
    [JsonPropertyName("srNo")]
    public int SrNo { get; set; }

    [JsonPropertyName("particular")]
    public string? Particular { get; set; }

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }
}

public sealed class CashEntryDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("entryType")]
    public string EntryType { get; set; } = "cash_entry";

    [JsonPropertyName("entryNo")]
    public int EntryNo { get; set; }

    [JsonPropertyName("entryDate")]
    public DateTime? EntryDate { get; set; }

    [JsonPropertyName("lines")]
    public List<CashEntryLineDto> Lines { get; set; } = [];

    [JsonPropertyName("totalAmount")]
    public decimal TotalAmount { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "Posted";
}

public sealed class NextEntryNoDto
{
    [JsonPropertyName("entryNo")]
    public int EntryNo { get; set; }
}

public sealed class StockTransferDto
{
    [JsonPropertyName("entryNo")]
    public string EntryNo { get; set; } = string.Empty;

    [JsonPropertyName("fromGodown")]
    public string? FromGodown { get; set; }

    [JsonPropertyName("toGodown")]
    public string? ToGodown { get; set; }

    [JsonPropertyName("transferDate")]
    public DateTime? TransferDate { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime? CreatedAt { get; set; }

    [JsonPropertyName("remark")]
    public string? Remark { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "posted";

    [JsonPropertyName("lines")]
    public List<StockTransferLineDto> Lines { get; set; } = [];
}

public sealed class StockAvailabilityDto
{
    [JsonPropertyName("availableQty")]
    public decimal AvailableQty { get; set; }
}

public sealed class BomRawLineDto
{
    [JsonPropertyName("srNo")]
    public int SrNo { get; set; }

    [JsonPropertyName("itemId")]
    public string? ItemId { get; set; }

    [JsonPropertyName("itemCode")]
    public string? ItemCode { get; set; }

    [JsonPropertyName("itemName")]
    public string? ItemName { get; set; }

    [JsonPropertyName("unit")]
    public string? Unit { get; set; }

    [JsonPropertyName("qty")]
    public decimal Qty { get; set; }

    [JsonPropertyName("scrapPercent")]
    public decimal ScrapPercent { get; set; }

    [JsonPropertyName("rate")]
    public decimal Rate { get; set; }

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }
}

public sealed class BomConsumableLineDto
{
    [JsonPropertyName("srNo")]
    public int SrNo { get; set; }

    [JsonPropertyName("material")]
    public string? Material { get; set; }

    [JsonPropertyName("qty")]
    public decimal Qty { get; set; }

    [JsonPropertyName("rate")]
    public decimal Rate { get; set; }

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }
}

public sealed class BomDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("productId")]
    public string? ProductId { get; set; }

    [JsonPropertyName("productCode")]
    public string ProductCode { get; set; } = string.Empty;

    [JsonPropertyName("productName")]
    public string? ProductName { get; set; }

    [JsonPropertyName("revision")]
    public string? Revision { get; set; }

    [JsonPropertyName("effectiveFrom")]
    public DateTime? EffectiveFrom { get; set; }

    [JsonPropertyName("standardQty")]
    public decimal StandardQty { get; set; } = 1;

    [JsonPropertyName("rawMaterials")]
    public List<BomRawLineDto> RawMaterials { get; set; } = [];

    [JsonPropertyName("consumables")]
    public List<BomConsumableLineDto> Consumables { get; set; } = [];

    [JsonPropertyName("rawMaterialAmount")]
    public decimal RawMaterialAmount { get; set; }

    [JsonPropertyName("productionAmount")]
    public decimal ProductionAmount { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }
}

public sealed class MaterialStageEventDto
{
    [JsonPropertyName("stage")]
    public string Stage { get; set; } = "planned";

    [JsonPropertyName("at")]
    public DateTime? At { get; set; }

    [JsonPropertyName("by")]
    public string? By { get; set; }

    [JsonPropertyName("qty")]
    public decimal Qty { get; set; }

    [JsonPropertyName("godown")]
    public string? Godown { get; set; }

    [JsonPropertyName("note")]
    public string? Note { get; set; }
}

public sealed class ProductionOrderRawLineDto
{
    [JsonPropertyName("srNo")]
    public int SrNo { get; set; }

    [JsonPropertyName("bomLineRef")]
    public string? BomLineRef { get; set; }

    [JsonPropertyName("assignmentType")]
    public string? AssignmentType { get; set; }

    [JsonPropertyName("stage")]
    public string? Stage { get; set; }

    [JsonPropertyName("stageEvents")]
    public List<MaterialStageEventDto> StageEvents { get; set; } = [];

    [JsonPropertyName("itemId")]
    public string? ItemId { get; set; }

    [JsonPropertyName("itemName")]
    public string? ItemName { get; set; }

    [JsonPropertyName("unit")]
    public string? Unit { get; set; }

    [JsonPropertyName("reqQty")]
    public decimal ReqQty { get; set; }

    [JsonPropertyName("availableQty")]
    public decimal AvailableQty { get; set; }

    [JsonPropertyName("rate")]
    public decimal Rate { get; set; }

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }
}

public sealed class ProductionOrderConsumableLineDto
{
    [JsonPropertyName("srNo")]
    public int SrNo { get; set; }

    [JsonPropertyName("bomLineRef")]
    public string? BomLineRef { get; set; }

    [JsonPropertyName("assignmentType")]
    public string? AssignmentType { get; set; }

    [JsonPropertyName("stage")]
    public string? Stage { get; set; }

    [JsonPropertyName("stageEvents")]
    public List<MaterialStageEventDto> StageEvents { get; set; } = [];

    [JsonPropertyName("material")]
    public string? Material { get; set; }

    [JsonPropertyName("qty")]
    public decimal Qty { get; set; }

    [JsonPropertyName("rate")]
    public decimal Rate { get; set; }

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }
}

public sealed class ProductionOrderDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("productionNo")]
    public int ProductionNo { get; set; }

    [JsonPropertyName("productionDate")]
    public DateTime? ProductionDate { get; set; }

    [JsonPropertyName("manufacturingItemId")]
    public string? ManufacturingItemId { get; set; }

    [JsonPropertyName("manufacturingItemName")]
    public string? ManufacturingItemName { get; set; }

    [JsonPropertyName("bomProductCode")]
    public string? BomProductCode { get; set; }

    [JsonPropertyName("bomRevision")]
    public string? BomRevision { get; set; }

    [JsonPropertyName("machineCode")]
    public string? MachineCode { get; set; }

    [JsonPropertyName("machineName")]
    public string? MachineName { get; set; }

    [JsonPropertyName("operatorId")]
    public string? OperatorId { get; set; }

    [JsonPropertyName("operatorName")]
    public string? OperatorName { get; set; }

    [JsonPropertyName("startTimeText")]
    public string? StartTimeText { get; set; }

    [JsonPropertyName("endTimeText")]
    public string? EndTimeText { get; set; }

    [JsonPropertyName("totalDurationMinutes")]
    public decimal TotalDurationMinutes { get; set; }

    [JsonPropertyName("produceQty")]
    public decimal ProduceQty { get; set; }

    [JsonPropertyName("rejectedQty")]
    public decimal RejectedQty { get; set; }

    [JsonPropertyName("finalQty")]
    public decimal FinalQty { get; set; }

    [JsonPropertyName("fromGodown")]
    public string? FromGodown { get; set; }

    [JsonPropertyName("rawMaterialAmount")]
    public decimal RawMaterialAmount { get; set; }

    [JsonPropertyName("productionAmount")]
    public decimal ProductionAmount { get; set; }

    [JsonPropertyName("rawMaterials")]
    public List<ProductionOrderRawLineDto> RawMaterials { get; set; } = [];

    [JsonPropertyName("consumables")]
    public List<ProductionOrderConsumableLineDto> Consumables { get; set; } = [];

    [JsonPropertyName("issueTransferEntryNo")]
    public string? IssueTransferEntryNo { get; set; }

    [JsonPropertyName("receiptTransferEntryNo")]
    public string? ReceiptTransferEntryNo { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "Open";
}

public sealed class ProductionOrderStatsDto
{
    [JsonPropertyName("total")]
    public int Total { get; set; }

    [JsonPropertyName("open")]
    public int Open { get; set; }

    [JsonPropertyName("inProgress")]
    public int InProgress { get; set; }

    [JsonPropertyName("completed")]
    public int Completed { get; set; }

    [JsonPropertyName("completedWeek")]
    public int CompletedWeek { get; set; }
}

public sealed class ProductionBomExpandDto
{
    [JsonPropertyName("productCode")]
    public string? ProductCode { get; set; }

    [JsonPropertyName("revision")]
    public string? Revision { get; set; }

    [JsonPropertyName("standardQty")]
    public decimal StandardQty { get; set; }

    [JsonPropertyName("multiplier")]
    public decimal Multiplier { get; set; }

    [JsonPropertyName("rawMaterials")]
    public List<ProductionOrderRawLineDto> RawMaterials { get; set; } = [];

    [JsonPropertyName("consumables")]
    public List<ProductionOrderConsumableLineDto> Consumables { get; set; } = [];

    [JsonPropertyName("rawMaterialAmount")]
    public decimal RawMaterialAmount { get; set; }

    [JsonPropertyName("productionAmount")]
    public decimal ProductionAmount { get; set; }
}

public sealed class NextProductionNoDto
{
    [JsonPropertyName("productionNo")]
    public int ProductionNo { get; set; }
}

public sealed class ProductionMaterialStageRequestDto
{
    [JsonPropertyName("lineKind")]
    public string LineKind { get; set; } = "raw";

    [JsonPropertyName("srNo")]
    public int SrNo { get; set; }

    [JsonPropertyName("stage")]
    public string Stage { get; set; } = "planned";

    [JsonPropertyName("qty")]
    public decimal? Qty { get; set; }

    [JsonPropertyName("godown")]
    public string? Godown { get; set; }

    [JsonPropertyName("note")]
    public string? Note { get; set; }

    [JsonPropertyName("by")]
    public string? By { get; set; }
}

public sealed class ProductionMaterialTrackingLineDto
{
    [JsonPropertyName("lineKind")]
    public string? LineKind { get; set; }

    [JsonPropertyName("srNo")]
    public int SrNo { get; set; }

    [JsonPropertyName("bomLineRef")]
    public string? BomLineRef { get; set; }

    [JsonPropertyName("assignmentType")]
    public string? AssignmentType { get; set; }

    [JsonPropertyName("itemId")]
    public string? ItemId { get; set; }

    [JsonPropertyName("itemName")]
    public string? ItemName { get; set; }

    [JsonPropertyName("material")]
    public string? Material { get; set; }

    [JsonPropertyName("qty")]
    public decimal Qty { get; set; }

    [JsonPropertyName("stage")]
    public string? Stage { get; set; }

    [JsonPropertyName("stageEvents")]
    public List<MaterialStageEventDto> StageEvents { get; set; } = [];

    [JsonPropertyName("lastEvent")]
    public MaterialStageEventDto? LastEvent { get; set; }
}

public sealed class ProductionMaterialTrackingDto
{
    [JsonPropertyName("productionNo")]
    public int ProductionNo { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("bomProductCode")]
    public string? BomProductCode { get; set; }

    [JsonPropertyName("bomRevision")]
    public string? BomRevision { get; set; }

    [JsonPropertyName("lines")]
    public List<ProductionMaterialTrackingLineDto> Lines { get; set; } = [];
}

public sealed class WarehouseDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("location")]
    public string? Location { get; set; }

    [JsonPropertyName("activeStatus")]
    public bool ActiveStatus { get; set; } = true;
}

public sealed class WarehouseListResponse
{
    [JsonPropertyName("items")]
    public List<WarehouseDto> Items { get; set; } = [];
}

public sealed class DashboardDto
{
    [JsonPropertyName("stats")]
    public List<DashboardStatDto> Stats { get; set; } = [];

    [JsonPropertyName("rows")]
    public List<DashboardRowDto> Rows { get; set; } = [];

    [JsonPropertyName("alerts")]
    public List<DashboardAlertDto>? Alerts { get; set; }

    [JsonPropertyName("summaryLines")]
    public List<DashboardSummaryLineDto>? SummaryLines { get; set; }

    [JsonPropertyName("charts")]
    public DashboardChartsDto? Charts { get; set; }
}

public sealed class DashboardChartsDto
{
    [JsonPropertyName("salesVsPurchase")]
    public DashboardBarChartDto? SalesVsPurchase { get; set; }

    [JsonPropertyName("stockByCategory")]
    public DashboardPieChartDto? StockByCategory { get; set; }

    [JsonPropertyName("stockByType")]
    public DashboardBarChartDto? StockByType { get; set; }
}

public sealed class DashboardBarChartDto
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("series1Name")]
    public string Series1Name { get; set; } = "Sales";

    [JsonPropertyName("series2Name")]
    public string Series2Name { get; set; } = "Purchase";

    [JsonPropertyName("series1Color")]
    public string Series1Color { get; set; } = "#006B9E";

    [JsonPropertyName("series2Color")]
    public string Series2Color { get; set; } = "#B8860B";

    [JsonPropertyName("labels")]
    public List<string> Labels { get; set; } = [];

    [JsonPropertyName("series1")]
    public List<double> Series1 { get; set; } = [];

    [JsonPropertyName("series2")]
    public List<double> Series2 { get; set; } = [];
}

public sealed class DashboardPieChartDto
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("slices")]
    public List<DashboardPieSliceDto> Slices { get; set; } = [];
}

public sealed class DashboardPieSliceDto
{
    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;

    [JsonPropertyName("value")]
    public double Value { get; set; }

    [JsonPropertyName("color")]
    public string Color { get; set; } = "#006B9E";
}

public sealed class DashboardAlertDto
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("detail")]
    public string Detail { get; set; } = string.Empty;

    [JsonPropertyName("severity")]
    public string Severity { get; set; } = "Active";

    [JsonPropertyName("iconGlyph")]
    public string IconGlyph { get; set; } = "\uE946";
}

public sealed class DashboardSummaryLineDto
{
    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;

    [JsonPropertyName("value")]
    public string Value { get; set; } = string.Empty;

    [JsonPropertyName("iconGlyph")]
    public string IconGlyph { get; set; } = "\uE8A5";
}

public sealed class DashboardStatDto
{
    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;

    [JsonPropertyName("value")]
    public string Value { get; set; } = string.Empty;

    [JsonPropertyName("iconGlyph")]
    public string IconGlyph { get; set; } = string.Empty;

    [JsonPropertyName("accentColor")]
    public string AccentColor { get; set; } = string.Empty;
}

public sealed class DashboardRowDto
{
    [JsonPropertyName("col1")]
    public string Col1 { get; set; } = string.Empty;

    [JsonPropertyName("col2")]
    public string Col2 { get; set; } = string.Empty;

    [JsonPropertyName("col3")]
    public string Col3 { get; set; } = string.Empty;

    [JsonPropertyName("col4")]
    public string Col4 { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string? Status { get; set; }
}

public sealed class ProductTypeDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("activeStatus")]
    public bool ActiveStatus { get; set; } = true;
}

public sealed class ProductMainGroupDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("activeStatus")]
    public bool ActiveStatus { get; set; } = true;
}

public sealed class AssemblyTypeDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("activeStatus")]
    public bool ActiveStatus { get; set; } = true;
}

public sealed class MachineDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("activeStatus")]
    public bool ActiveStatus { get; set; } = true;
}

public sealed class SaleUomDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("symbol")]
    public string? Symbol { get; set; }

    [JsonPropertyName("decimals")]
    public int Decimals { get; set; }

    [JsonPropertyName("activeStatus")]
    public bool ActiveStatus { get; set; } = true;
}

public sealed class CustomerTypeDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("activeStatus")]
    public bool ActiveStatus { get; set; } = true;
}

public sealed class CompanyDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("businessName")]
    public string BusinessName { get; set; } = string.Empty;

    [JsonPropertyName("address")]
    public string? Address { get; set; }

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("gstin")]
    public string? Gstin { get; set; }

    [JsonPropertyName("state")]
    public string? State { get; set; }

    [JsonPropertyName("placeOfSupply")]
    public string? PlaceOfSupply { get; set; }

    [JsonPropertyName("bankName")]
    public string? BankName { get; set; }

    [JsonPropertyName("bankAccountNo")]
    public string? BankAccountNo { get; set; }

    [JsonPropertyName("bankIfsc")]
    public string? BankIfsc { get; set; }

    [JsonPropertyName("bankAccountHolder")]
    public string? BankAccountHolder { get; set; }

    [JsonPropertyName("logoText")]
    public string? LogoText { get; set; }

    [JsonPropertyName("logoImage")]
    public string? LogoImage { get; set; }

    [JsonPropertyName("terms")]
    public List<string> Terms { get; set; } = [];

    [JsonPropertyName("isDefault")]
    public bool IsDefault { get; set; }

    [JsonPropertyName("activeStatus")]
    public bool ActiveStatus { get; set; } = true;
}

public sealed class SalesPurchaseSettingsDto
{
    [JsonPropertyName("salesRateSource")]
    public string SalesRateSource { get; set; } = "product_master";
}

public sealed class LatestPurchaseSalesRateDto
{
    [JsonPropertyName("productCode")]
    public string ProductCode { get; set; } = string.Empty;

    [JsonPropertyName("salesRate")]
    public string? SalesRate { get; set; }

    [JsonPropertyName("formattedDocNo")]
    public string? FormattedDocNo { get; set; }

    [JsonPropertyName("billDate")]
    public string? BillDate { get; set; }
}

public sealed class CreditNoteDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("voucherType")]
    public string VoucherType { get; set; } = "credit_note";

    [JsonPropertyName("voucherNo")]
    public int VoucherNo { get; set; }

    [JsonPropertyName("refNo")]
    public string? RefNo { get; set; }

    [JsonPropertyName("voucherDate")]
    public DateTime? VoucherDate { get; set; }

    [JsonPropertyName("accountCode")]
    public string? AccountCode { get; set; }

    [JsonPropertyName("accountName")]
    public string? AccountName { get; set; }

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }

    [JsonPropertyName("gstRate")]
    public decimal GstRate { get; set; }

    [JsonPropertyName("totalAmount")]
    public decimal TotalAmount { get; set; }

    [JsonPropertyName("isIgst")]
    public bool IsIgst { get; set; }

    [JsonPropertyName("narration")]
    public string? Narration { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "Posted";
}

public sealed class DebitNoteDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("voucherType")]
    public string VoucherType { get; set; } = "debit_note";

    [JsonPropertyName("voucherNo")]
    public int VoucherNo { get; set; }

    [JsonPropertyName("refNo")]
    public string? RefNo { get; set; }

    [JsonPropertyName("voucherDate")]
    public DateTime? VoucherDate { get; set; }

    [JsonPropertyName("accountCode")]
    public string? AccountCode { get; set; }

    [JsonPropertyName("accountName")]
    public string? AccountName { get; set; }

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }

    [JsonPropertyName("gstRate")]
    public decimal GstRate { get; set; }

    [JsonPropertyName("totalAmount")]
    public decimal TotalAmount { get; set; }

    [JsonPropertyName("isIgst")]
    public bool IsIgst { get; set; }

    [JsonPropertyName("narration")]
    public string? Narration { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "Posted";
}

public sealed class ReceiptVoucherDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("voucherType")]
    public string VoucherType { get; set; } = "receipt";

    [JsonPropertyName("voucherNo")]
    public int VoucherNo { get; set; }

    [JsonPropertyName("refNo")]
    public string? RefNo { get; set; }

    [JsonPropertyName("voucherDate")]
    public DateTime? VoucherDate { get; set; }

    [JsonPropertyName("cashBank")]
    public string? CashBank { get; set; }

    [JsonPropertyName("accountCode")]
    public string? AccountCode { get; set; }

    [JsonPropertyName("accountName")]
    public string? AccountName { get; set; }

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }

    [JsonPropertyName("narration")]
    public string? Narration { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "Posted";

    [JsonPropertyName("sourceDocType")]
    public string? SourceDocType { get; set; }

    [JsonPropertyName("sourceDocId")]
    public string? SourceDocId { get; set; }

    [JsonPropertyName("sourceFormattedDocNo")]
    public string? SourceFormattedDocNo { get; set; }
}

public sealed class BankEntryDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("voucherType")]
    public string VoucherType { get; set; } = "bank_entry";

    [JsonPropertyName("voucherNo")]
    public int VoucherNo { get; set; }

    [JsonPropertyName("refNo")]
    public string? RefNo { get; set; }

    [JsonPropertyName("voucherDate")]
    public DateTime? VoucherDate { get; set; }

    [JsonPropertyName("cashBank")]
    public string? CashBank { get; set; }

    [JsonPropertyName("accountCode")]
    public string? AccountCode { get; set; }

    [JsonPropertyName("accountName")]
    public string? AccountName { get; set; }

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }

    [JsonPropertyName("narration")]
    public string? Narration { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "Posted";
}

public sealed class PaymentVoucherDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("voucherType")]
    public string VoucherType { get; set; } = "payment";

    [JsonPropertyName("voucherNo")]
    public int VoucherNo { get; set; }

    [JsonPropertyName("refNo")]
    public string? RefNo { get; set; }

    [JsonPropertyName("voucherDate")]
    public DateTime? VoucherDate { get; set; }

    [JsonPropertyName("cashBank")]
    public string? CashBank { get; set; }

    [JsonPropertyName("accountCode")]
    public string? AccountCode { get; set; }

    [JsonPropertyName("accountName")]
    public string? AccountName { get; set; }

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }

    [JsonPropertyName("narration")]
    public string? Narration { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "Posted";

    [JsonPropertyName("sourceDocType")]
    public string? SourceDocType { get; set; }

    [JsonPropertyName("sourceDocId")]
    public string? SourceDocId { get; set; }

    [JsonPropertyName("sourceFormattedDocNo")]
    public string? SourceFormattedDocNo { get; set; }
}

public sealed class AppUserDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("username")]
    public string Username { get; set; } = string.Empty;

    [JsonPropertyName("fullName")]
    public string FullName { get; set; } = string.Empty;

    [JsonPropertyName("role")]
    public string Role { get; set; } = string.Empty;

    [JsonPropertyName("department")]
    public string? Department { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("password")]
    public string? Password { get; set; }

    [JsonPropertyName("activeStatus")]
    public bool ActiveStatus { get; set; } = true;

    [JsonPropertyName("canPrintBarcodeLabels")]
    public bool CanPrintBarcodeLabels { get; set; }
}

public sealed class ProductSubGroupDto
{
    [JsonPropertyName("_id")]
    public string? Id { get; set; }

    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("mainGroup")]
    public string MainGroup { get; set; } = string.Empty;

    [JsonPropertyName("activeStatus")]
    public bool ActiveStatus { get; set; } = true;
}

public sealed class NextVoucherNoDto
{
    [JsonPropertyName("voucherNo")]
    public int VoucherNo { get; set; }
}

public sealed class HealthDto
{
    [JsonPropertyName("ok")]
    public bool Ok { get; set; }
}

public sealed class OpeningStockReportDto
{
    [JsonPropertyName("asOnDate")]
    public string? AsOnDate { get; set; }

    [JsonPropertyName("dateLabel")]
    public string DateLabel { get; set; } = string.Empty;

    [JsonPropertyName("rows")]
    public List<OpeningStockRowDto> Rows { get; set; } = [];

    [JsonPropertyName("totalQty")]
    public decimal TotalQty { get; set; }

    [JsonPropertyName("totalValuation")]
    public decimal TotalValuation { get; set; }

    [JsonPropertyName("count")]
    public int Count { get; set; }
}

public sealed class OpeningStockRowDto
{
    [JsonPropertyName("serialNo")]
    public int SerialNo { get; set; }

    [JsonPropertyName("itemId")]
    public string ItemId { get; set; } = string.Empty;

    [JsonPropertyName("itemName")]
    public string ItemName { get; set; } = string.Empty;

    [JsonPropertyName("unit")]
    public string Unit { get; set; } = string.Empty;

    [JsonPropertyName("date")]
    public string Date { get; set; } = string.Empty;

    [JsonPropertyName("qty")]
    public decimal Qty { get; set; }

    [JsonPropertyName("rate")]
    public decimal Rate { get; set; }

    [JsonPropertyName("valuation")]
    public decimal Valuation { get; set; }
}

public sealed class ClosingStockReportDto
{
    [JsonPropertyName("dateFrom")]
    public string? DateFrom { get; set; }

    [JsonPropertyName("dateTo")]
    public string? DateTo { get; set; }

    [JsonPropertyName("dateFromLabel")]
    public string DateFromLabel { get; set; } = string.Empty;

    [JsonPropertyName("dateToLabel")]
    public string DateToLabel { get; set; } = string.Empty;

    [JsonPropertyName("rows")]
    public List<ClosingStockRowDto> Rows { get; set; } = [];

    [JsonPropertyName("totals")]
    public ClosingStockTotalsDto? Totals { get; set; }

    [JsonPropertyName("count")]
    public int Count { get; set; }
}

public sealed class ClosingStockTotalsDto
{
    [JsonPropertyName("opStock")]
    public decimal OpStock { get; set; }

    [JsonPropertyName("inward")]
    public decimal Inward { get; set; }

    [JsonPropertyName("outward")]
    public decimal Outward { get; set; }

    [JsonPropertyName("closingStock")]
    public decimal ClosingStock { get; set; }

    [JsonPropertyName("valuation")]
    public decimal Valuation { get; set; }
}

public sealed class ClosingStockRowDto
{
    [JsonPropertyName("serialNo")]
    public int SerialNo { get; set; }

    [JsonPropertyName("productId")]
    public string ProductId { get; set; } = string.Empty;

    [JsonPropertyName("productName")]
    public string ProductName { get; set; } = string.Empty;

    [JsonPropertyName("unit")]
    public string Unit { get; set; } = string.Empty;

    [JsonPropertyName("opStock")]
    public decimal OpStock { get; set; }

    [JsonPropertyName("inward")]
    public decimal Inward { get; set; }

    [JsonPropertyName("outward")]
    public decimal Outward { get; set; }

    [JsonPropertyName("closingStock")]
    public decimal ClosingStock { get; set; }

    [JsonPropertyName("avgRate")]
    public decimal AvgRate { get; set; }

    [JsonPropertyName("valuation")]
    public decimal Valuation { get; set; }

    [JsonPropertyName("reorderLevel")]
    public decimal ReorderLevel { get; set; }
}

public sealed class ImportResultDto
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;

    [JsonPropertyName("navigateKey")]
    public string NavigateKey { get; set; } = string.Empty;

    [JsonPropertyName("imported")]
    public int Imported { get; set; }

    [JsonPropertyName("failed")]
    public int Failed { get; set; }

    [JsonPropertyName("errors")]
    public List<ImportErrorDto> Errors { get; set; } = [];

    [JsonPropertyName("documents")]
    public List<string> Documents { get; set; } = [];
}

public sealed class ImportErrorDto
{
    [JsonPropertyName("row")]
    public int Row { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}

public sealed class DataSummaryDto
{
    [JsonPropertyName("totalRecords")]
    public int TotalRecords { get; set; }

    [JsonPropertyName("collections")]
    public Dictionary<string, DataSummaryCollectionDto> Collections { get; set; } = [];
}

public sealed class DataSummaryCollectionDto
{
    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;

    [JsonPropertyName("count")]
    public int Count { get; set; }
}

public sealed class DatabaseBackupResultDto
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("filePath")]
    public string FilePath { get; set; } = string.Empty;

    [JsonPropertyName("fileName")]
    public string FileName { get; set; } = string.Empty;

    [JsonPropertyName("fileSizeBytes")]
    public long FileSizeBytes { get; set; }

    [JsonPropertyName("createdAtUtc")]
    public string? CreatedAtUtc { get; set; }
}

public sealed class DataPurgeResultDto
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("totalDeleted")]
    public int TotalDeleted { get; set; }

    [JsonPropertyName("deleted")]
    public Dictionary<string, DataSummaryCollectionDto> Deleted { get; set; } = [];
}

public sealed class LedgerAccountOptionDto
{
    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("display")]
    public string Display { get; set; } = string.Empty;

    [JsonPropertyName("kind")]
    public string Kind { get; set; } = string.Empty;
}

public sealed class LedgerAccountsListDto
{
    [JsonPropertyName("accounts")]
    public List<LedgerAccountOptionDto> Accounts { get; set; } = [];
}

public sealed class LedgerReportDto
{
    [JsonPropertyName("accountCode")]
    public string AccountCode { get; set; } = string.Empty;

    [JsonPropertyName("accountName")]
    public string AccountName { get; set; } = string.Empty;

    [JsonPropertyName("dateFromLabel")]
    public string DateFromLabel { get; set; } = string.Empty;

    [JsonPropertyName("dateToLabel")]
    public string DateToLabel { get; set; } = string.Empty;

    [JsonPropertyName("periodDebit")]
    public decimal PeriodDebit { get; set; }

    [JsonPropertyName("periodCredit")]
    public decimal PeriodCredit { get; set; }

    [JsonPropertyName("footerDebit")]
    public decimal FooterDebit { get; set; }

    [JsonPropertyName("footerCredit")]
    public decimal FooterCredit { get; set; }

    [JsonPropertyName("closingBalance")]
    public decimal ClosingBalance { get; set; }

    [JsonPropertyName("closingBalanceSide")]
    public string ClosingBalanceSide { get; set; } = "Dr";

    [JsonPropertyName("transactionCount")]
    public int TransactionCount { get; set; }

    [JsonPropertyName("rows")]
    public List<LedgerReportRowDto> Rows { get; set; } = [];
}

public sealed class LedgerReportRowDto
{
    [JsonPropertyName("rowType")]
    public string RowType { get; set; } = "transaction";

    [JsonPropertyName("entryDate")]
    public string EntryDate { get; set; } = string.Empty;

    [JsonPropertyName("entryType")]
    public string EntryType { get; set; } = string.Empty;

    [JsonPropertyName("entryNo")]
    public string EntryNo { get; set; } = string.Empty;

    [JsonPropertyName("particular")]
    public string Particular { get; set; } = string.Empty;

    [JsonPropertyName("dr")]
    public decimal Dr { get; set; }

    [JsonPropertyName("cr")]
    public decimal Cr { get; set; }

    [JsonPropertyName("manualNo")]
    public string ManualNo { get; set; } = string.Empty;

    [JsonPropertyName("drDisplay")]
    public string DrDisplay { get; set; } = string.Empty;

    [JsonPropertyName("crDisplay")]
    public string CrDisplay { get; set; } = string.Empty;

    [JsonPropertyName("closingColumn")]
    public string? ClosingColumn { get; set; }
}

public sealed class TrialBalanceReportDto
{
    [JsonPropertyName("dateFromLabel")]
    public string DateFromLabel { get; set; } = string.Empty;

    [JsonPropertyName("dateToLabel")]
    public string DateToLabel { get; set; } = string.Empty;

    [JsonPropertyName("totalDr")]
    public decimal TotalDr { get; set; }

    [JsonPropertyName("totalCr")]
    public decimal TotalCr { get; set; }

    [JsonPropertyName("totalDrDisplay")]
    public string TotalDrDisplay { get; set; } = "0";

    [JsonPropertyName("totalCrDisplay")]
    public string TotalCrDisplay { get; set; } = "0";

    [JsonPropertyName("accountCount")]
    public int AccountCount { get; set; }

    [JsonPropertyName("isBalanced")]
    public bool IsBalanced { get; set; }

    [JsonPropertyName("rows")]
    public List<TrialBalanceRowDto> Rows { get; set; } = [];
}

public sealed class TrialBalanceRowDto
{
    [JsonPropertyName("serialNo")]
    public int SerialNo { get; set; }

    [JsonPropertyName("accountCode")]
    public string AccountCode { get; set; } = string.Empty;

    [JsonPropertyName("accountName")]
    public string AccountName { get; set; } = string.Empty;

    [JsonPropertyName("drDisplay")]
    public string DrDisplay { get; set; } = "0";

    [JsonPropertyName("crDisplay")]
    public string CrDisplay { get; set; } = "0";
}

public sealed class ReorderLevelReportDto
{
    [JsonPropertyName("rows")]
    public List<ReorderLevelRowDto> Rows { get; set; } = [];

    [JsonPropertyName("count")]
    public int Count { get; set; }

    [JsonPropertyName("belowCount")]
    public int BelowCount { get; set; }

    [JsonPropertyName("totalOnHand")]
    public decimal TotalOnHand { get; set; }

    [JsonPropertyName("totalReorder")]
    public decimal TotalReorder { get; set; }

    [JsonPropertyName("totalShortage")]
    public decimal TotalShortage { get; set; }
}

public sealed class ReorderLevelRowDto
{
    [JsonPropertyName("serialNo")]
    public int SerialNo { get; set; }

    [JsonPropertyName("productId")]
    public string ProductId { get; set; } = string.Empty;

    [JsonPropertyName("productName")]
    public string ProductName { get; set; } = string.Empty;

    [JsonPropertyName("unit")]
    public string Unit { get; set; } = string.Empty;

    [JsonPropertyName("onHand")]
    public decimal OnHand { get; set; }

    [JsonPropertyName("reorderLevel")]
    public decimal ReorderLevel { get; set; }

    [JsonPropertyName("shortage")]
    public decimal Shortage { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
}

public sealed class ProfitAnalysisReportDto
{
    [JsonPropertyName("dateFromLabel")]
    public string DateFromLabel { get; set; } = string.Empty;

    [JsonPropertyName("dateToLabel")]
    public string DateToLabel { get; set; } = string.Empty;

    [JsonPropertyName("rows")]
    public List<ProfitAnalysisRowDto> Rows { get; set; } = [];

    [JsonPropertyName("totals")]
    public ProfitAnalysisTotalsDto? Totals { get; set; }

    [JsonPropertyName("count")]
    public int Count { get; set; }
}

public sealed class ProfitAnalysisRowDto
{
    [JsonPropertyName("serialNo")]
    public int SerialNo { get; set; }

    [JsonPropertyName("productId")]
    public string ProductId { get; set; } = string.Empty;

    [JsonPropertyName("productName")]
    public string ProductName { get; set; } = string.Empty;

    [JsonPropertyName("mainGroup")]
    public string MainGroup { get; set; } = string.Empty;

    [JsonPropertyName("qty")]
    public decimal Qty { get; set; }

    [JsonPropertyName("revenue")]
    public decimal Revenue { get; set; }

    [JsonPropertyName("discount")]
    public decimal Discount { get; set; }

    [JsonPropertyName("cogs")]
    public decimal Cogs { get; set; }

    [JsonPropertyName("grossProfit")]
    public decimal GrossProfit { get; set; }

    [JsonPropertyName("marginPct")]
    public decimal MarginPct { get; set; }
}

public sealed class ProfitAnalysisTotalsDto
{
    [JsonPropertyName("qty")]
    public decimal Qty { get; set; }

    [JsonPropertyName("revenue")]
    public decimal Revenue { get; set; }

    [JsonPropertyName("discount")]
    public decimal Discount { get; set; }

    [JsonPropertyName("cogs")]
    public decimal Cogs { get; set; }

    [JsonPropertyName("grossProfit")]
    public decimal GrossProfit { get; set; }

    [JsonPropertyName("marginPct")]
    public decimal MarginPct { get; set; }
}

public sealed class PurchaseAnalysisReportDto
{
    [JsonPropertyName("dateFromLabel")]
    public string DateFromLabel { get; set; } = string.Empty;

    [JsonPropertyName("dateToLabel")]
    public string DateToLabel { get; set; } = string.Empty;

    [JsonPropertyName("rows")]
    public List<PurchaseAnalysisRowDto> Rows { get; set; } = [];

    [JsonPropertyName("totals")]
    public PurchaseAnalysisTotalsDto? Totals { get; set; }

    [JsonPropertyName("count")]
    public int Count { get; set; }
}

public sealed class PurchaseAnalysisRowDto
{
    [JsonPropertyName("serialNo")]
    public int SerialNo { get; set; }

    [JsonPropertyName("productId")]
    public string ProductId { get; set; } = string.Empty;

    [JsonPropertyName("productName")]
    public string ProductName { get; set; } = string.Empty;

    [JsonPropertyName("supplier")]
    public string Supplier { get; set; } = string.Empty;

    [JsonPropertyName("mainGroup")]
    public string MainGroup { get; set; } = string.Empty;

    [JsonPropertyName("qty")]
    public decimal Qty { get; set; }

    [JsonPropertyName("purchaseAmount")]
    public decimal PurchaseAmount { get; set; }

    [JsonPropertyName("discount")]
    public decimal Discount { get; set; }

    [JsonPropertyName("avgRate")]
    public decimal AvgRate { get; set; }

    [JsonPropertyName("invoiceCount")]
    public int InvoiceCount { get; set; }
}

public sealed class PurchaseAnalysisTotalsDto
{
    [JsonPropertyName("qty")]
    public decimal Qty { get; set; }

    [JsonPropertyName("purchaseAmount")]
    public decimal PurchaseAmount { get; set; }

    [JsonPropertyName("discount")]
    public decimal Discount { get; set; }

    [JsonPropertyName("invoiceCount")]
    public int InvoiceCount { get; set; }
}

public sealed class SalesAnalysisReportDto
{
    [JsonPropertyName("dateFromLabel")]
    public string DateFromLabel { get; set; } = string.Empty;

    [JsonPropertyName("dateToLabel")]
    public string DateToLabel { get; set; } = string.Empty;

    [JsonPropertyName("rows")]
    public List<SalesAnalysisRowDto> Rows { get; set; } = [];

    [JsonPropertyName("totals")]
    public SalesAnalysisTotalsDto? Totals { get; set; }

    [JsonPropertyName("count")]
    public int Count { get; set; }
}

public sealed class SalesAnalysisRowDto
{
    [JsonPropertyName("serialNo")]
    public int SerialNo { get; set; }

    [JsonPropertyName("productId")]
    public string ProductId { get; set; } = string.Empty;

    [JsonPropertyName("productName")]
    public string ProductName { get; set; } = string.Empty;

    [JsonPropertyName("mainGroup")]
    public string MainGroup { get; set; } = string.Empty;

    [JsonPropertyName("customer")]
    public string Customer { get; set; } = string.Empty;

    [JsonPropertyName("qty")]
    public decimal Qty { get; set; }

    [JsonPropertyName("revenue")]
    public decimal Revenue { get; set; }

    [JsonPropertyName("discount")]
    public decimal Discount { get; set; }

    [JsonPropertyName("cogs")]
    public decimal Cogs { get; set; }

    [JsonPropertyName("grossProfit")]
    public decimal GrossProfit { get; set; }

    [JsonPropertyName("marginPct")]
    public decimal MarginPct { get; set; }

    [JsonPropertyName("invoiceCount")]
    public int InvoiceCount { get; set; }
}

public sealed class SalesAnalysisTotalsDto
{
    [JsonPropertyName("qty")]
    public decimal Qty { get; set; }

    [JsonPropertyName("revenue")]
    public decimal Revenue { get; set; }

    [JsonPropertyName("discount")]
    public decimal Discount { get; set; }

    [JsonPropertyName("cogs")]
    public decimal Cogs { get; set; }

    [JsonPropertyName("grossProfit")]
    public decimal GrossProfit { get; set; }

    [JsonPropertyName("marginPct")]
    public decimal MarginPct { get; set; }

    [JsonPropertyName("invoiceCount")]
    public int InvoiceCount { get; set; }
}

public sealed class OutstandingReportDto
{
    [JsonPropertyName("asOnDateLabel")]
    public string AsOnDateLabel { get; set; } = string.Empty;

    [JsonPropertyName("count")]
    public int Count { get; set; }

    [JsonPropertyName("rows")]
    public List<OutstandingRowDto> Rows { get; set; } = [];

    [JsonPropertyName("totals")]
    public OutstandingTotalsDto? Totals { get; set; }
}

public sealed class OutstandingRowDto
{
    [JsonPropertyName("serialNo")]
    public int SerialNo { get; set; }

    [JsonPropertyName("partyType")]
    public string PartyType { get; set; } = string.Empty;

    [JsonPropertyName("partyName")]
    public string PartyName { get; set; } = string.Empty;

    [JsonPropertyName("docNo")]
    public string DocNo { get; set; } = string.Empty;

    [JsonPropertyName("invoiceDate")]
    public string InvoiceDate { get; set; } = string.Empty;

    [JsonPropertyName("dueDate")]
    public string DueDate { get; set; } = string.Empty;

    [JsonPropertyName("billAmount")]
    public decimal BillAmount { get; set; }

    [JsonPropertyName("paidAmount")]
    public decimal PaidAmount { get; set; }

    [JsonPropertyName("balanceDue")]
    public decimal BalanceDue { get; set; }

    [JsonPropertyName("ageDays")]
    public int AgeDays { get; set; }

    [JsonPropertyName("dueDays")]
    public int DueDays { get; set; }

    [JsonPropertyName("dueStatus")]
    public string DueStatus { get; set; } = string.Empty;
}

public sealed class OutstandingTotalsDto
{
    [JsonPropertyName("totalReceivable")]
    public decimal TotalReceivable { get; set; }

    [JsonPropertyName("totalPayable")]
    public decimal TotalPayable { get; set; }

    [JsonPropertyName("totalBalance")]
    public decimal TotalBalance { get; set; }
}

public sealed class DueDayReportDto
{
    [JsonPropertyName("asOnDateLabel")]
    public string AsOnDateLabel { get; set; } = string.Empty;

    [JsonPropertyName("count")]
    public int Count { get; set; }

    [JsonPropertyName("rows")]
    public List<DueDayRowDto> Rows { get; set; } = [];

    [JsonPropertyName("totals")]
    public DueDayTotalsDto? Totals { get; set; }
}

public sealed class DueDayRowDto
{
    [JsonPropertyName("serialNo")]
    public int SerialNo { get; set; }

    [JsonPropertyName("partyType")]
    public string PartyType { get; set; } = string.Empty;

    [JsonPropertyName("partyName")]
    public string PartyName { get; set; } = string.Empty;

    [JsonPropertyName("docNo")]
    public string DocNo { get; set; } = string.Empty;

    [JsonPropertyName("dueDate")]
    public string DueDate { get; set; } = string.Empty;

    [JsonPropertyName("dueDays")]
    public int DueDays { get; set; }

    [JsonPropertyName("dueBucket")]
    public string DueBucket { get; set; } = string.Empty;

    [JsonPropertyName("balanceDue")]
    public decimal BalanceDue { get; set; }
}

public sealed class DueDayTotalsDto
{
    [JsonPropertyName("totalAmount")]
    public decimal TotalAmount { get; set; }

    [JsonPropertyName("notDue")]
    public decimal NotDue { get; set; }

    [JsonPropertyName("d1To30")]
    public decimal D1To30 { get; set; }

    [JsonPropertyName("d31To60")]
    public decimal D31To60 { get; set; }

    [JsonPropertyName("d61To90")]
    public decimal D61To90 { get; set; }

    [JsonPropertyName("d90Plus")]
    public decimal D90Plus { get; set; }
}

public sealed class DueAmountReportDto
{
    [JsonPropertyName("asOnDateLabel")]
    public string AsOnDateLabel { get; set; } = string.Empty;

    [JsonPropertyName("count")]
    public int Count { get; set; }

    [JsonPropertyName("rows")]
    public List<DueAmountRowDto> Rows { get; set; } = [];

    [JsonPropertyName("totals")]
    public DueAmountTotalsDto? Totals { get; set; }
}

public sealed class DueAmountRowDto
{
    [JsonPropertyName("serialNo")]
    public int SerialNo { get; set; }

    [JsonPropertyName("slab")]
    public string Slab { get; set; } = string.Empty;

    [JsonPropertyName("invoiceCount")]
    public int InvoiceCount { get; set; }

    [JsonPropertyName("partyCount")]
    public int PartyCount { get; set; }

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }
}

public sealed class DueAmountTotalsDto
{
    [JsonPropertyName("invoiceCount")]
    public int InvoiceCount { get; set; }

    [JsonPropertyName("partyCount")]
    public int PartyCount { get; set; }

    [JsonPropertyName("totalAmount")]
    public decimal TotalAmount { get; set; }
}

public sealed class FinancialStatementRowDto
{
    [JsonPropertyName("serialNo")]
    public int SerialNo { get; set; }

    [JsonPropertyName("section")]
    public string Section { get; set; } = string.Empty;

    [JsonPropertyName("particular")]
    public string Particular { get; set; } = string.Empty;

    [JsonPropertyName("debit")]
    public decimal Debit { get; set; }

    [JsonPropertyName("credit")]
    public decimal Credit { get; set; }

    [JsonPropertyName("debitDisplay")]
    public string DebitDisplay { get; set; } = string.Empty;

    [JsonPropertyName("creditDisplay")]
    public string CreditDisplay { get; set; } = string.Empty;
}

public sealed class FinancialStatementReportDto
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("dateFrom")]
    public string DateFrom { get; set; } = string.Empty;

    [JsonPropertyName("dateTo")]
    public string DateTo { get; set; } = string.Empty;

    [JsonPropertyName("dateFromLabel")]
    public string DateFromLabel { get; set; } = string.Empty;

    [JsonPropertyName("dateToLabel")]
    public string DateToLabel { get; set; } = string.Empty;

    [JsonPropertyName("rows")]
    public List<FinancialStatementRowDto> Rows { get; set; } = [];

    [JsonPropertyName("debitTotal")]
    public decimal DebitTotal { get; set; }

    [JsonPropertyName("creditTotal")]
    public decimal CreditTotal { get; set; }

    [JsonPropertyName("netAmount")]
    public decimal NetAmount { get; set; }

    [JsonPropertyName("netAmountLabel")]
    public string NetAmountLabel { get; set; } = string.Empty;

    [JsonPropertyName("grossProfit")]
    public decimal GrossProfit { get; set; }

    [JsonPropertyName("count")]
    public int Count { get; set; }
}

public sealed class StockMovementReportDto
{
    [JsonPropertyName("dateFromLabel")]
    public string DateFromLabel { get; set; } = string.Empty;

    [JsonPropertyName("dateToLabel")]
    public string DateToLabel { get; set; } = string.Empty;

    [JsonPropertyName("rows")]
    public List<StockMovementReportRowDto> Rows { get; set; } = [];

    [JsonPropertyName("totalInQty")]
    public decimal TotalInQty { get; set; }

    [JsonPropertyName("totalOutQty")]
    public decimal TotalOutQty { get; set; }

    [JsonPropertyName("count")]
    public int Count { get; set; }
}

public sealed class StockDetailsSummaryReportDto
{
    [JsonPropertyName("rows")]
    public List<StockDetailsSummaryRowDto> Rows { get; set; } = [];

    [JsonPropertyName("count")]
    public int Count { get; set; }

    [JsonPropertyName("belowReorderCount")]
    public int BelowReorderCount { get; set; }

    [JsonPropertyName("totalOnHand")]
    public decimal TotalOnHand { get; set; }

    [JsonPropertyName("totalStockValue")]
    public decimal TotalStockValue { get; set; }

    [JsonPropertyName("totalShortageQty")]
    public decimal TotalShortageQty { get; set; }
}

public sealed class StockDetailsSummaryRowDto
{
    [JsonPropertyName("serialNo")]
    public int SerialNo { get; set; }

    [JsonPropertyName("productCode")]
    public string ProductCode { get; set; } = string.Empty;

    [JsonPropertyName("productName")]
    public string ProductName { get; set; } = string.Empty;

    [JsonPropertyName("mainGroup")]
    public string MainGroup { get; set; } = string.Empty;

    [JsonPropertyName("productType")]
    public string ProductType { get; set; } = string.Empty;

    [JsonPropertyName("unit")]
    public string Unit { get; set; } = string.Empty;

    [JsonPropertyName("onHandQty")]
    public decimal OnHandQty { get; set; }

    [JsonPropertyName("purchaseRate")]
    public decimal PurchaseRate { get; set; }

    [JsonPropertyName("stockValue")]
    public decimal StockValue { get; set; }

    [JsonPropertyName("reorderLevel")]
    public decimal ReorderLevel { get; set; }

    [JsonPropertyName("shortageQty")]
    public decimal ShortageQty { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
}

public sealed class StockMovementReportRowDto
{
    [JsonPropertyName("serialNo")]
    public int SerialNo { get; set; }

    [JsonPropertyName("date")]
    public string Date { get; set; } = string.Empty;

    [JsonPropertyName("entryNo")]
    public string EntryNo { get; set; } = string.Empty;

    [JsonPropertyName("movementType")]
    public string MovementType { get; set; } = string.Empty;

    [JsonPropertyName("fromGodown")]
    public string FromGodown { get; set; } = string.Empty;

    [JsonPropertyName("toGodown")]
    public string ToGodown { get; set; } = string.Empty;

    [JsonPropertyName("productCode")]
    public string ProductCode { get; set; } = string.Empty;

    [JsonPropertyName("productName")]
    public string ProductName { get; set; } = string.Empty;

    [JsonPropertyName("batchNo")]
    public string BatchNo { get; set; } = string.Empty;

    [JsonPropertyName("inQty")]
    public decimal InQty { get; set; }

    [JsonPropertyName("outQty")]
    public decimal OutQty { get; set; }

    [JsonPropertyName("unit")]
    public string Unit { get; set; } = string.Empty;
}

public sealed class LoginResponseDto
{
    [JsonPropertyName("token")]
    public string Token { get; set; } = string.Empty;

    [JsonPropertyName("expiresAt")]
    public string? ExpiresAt { get; set; }

    [JsonPropertyName("user")]
    public AuthUserDto? User { get; set; }

    [JsonPropertyName("permissions")]
    public List<MenuPermissionDto> Permissions { get; set; } = [];

    [JsonPropertyName("company")]
    public AuthCompanyDto? Company { get; set; }

    [JsonPropertyName("financialYear")]
    public FinancialYearDto? FinancialYear { get; set; }

    [JsonPropertyName("license")]
    public SoftwareLicenseStatusDto? License { get; set; }
}

public sealed class SoftwareLicenseStatusDto
{
    [JsonPropertyName("licenseType")]
    public string LicenseType { get; set; } = "trial";

    [JsonPropertyName("isPermanent")]
    public bool IsPermanent { get; set; }

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }

    [JsonPropertyName("isExpired")]
    public bool IsExpired { get; set; }

    [JsonPropertyName("isExpiringSoon")]
    public bool IsExpiringSoon { get; set; }

    [JsonPropertyName("planDays")]
    public int PlanDays { get; set; }

    [JsonPropertyName("activatedAt")]
    public string? ActivatedAt { get; set; }

    [JsonPropertyName("expiresAt")]
    public string? ExpiresAt { get; set; }

    [JsonPropertyName("daysRemaining")]
    public int DaysRemaining { get; set; }

    [JsonPropertyName("totalExtensionDays")]
    public int TotalExtensionDays { get; set; }

    [JsonPropertyName("planOptions")]
    public List<int> PlanOptions { get; set; } = [15, 30, 45];

    [JsonPropertyName("licenseTypeOptions")]
    public List<string> LicenseTypeOptions { get; set; } = ["trial", "permanent"];

    [JsonPropertyName("expiringSoonThresholdDays")]
    public int ExpiringSoonThresholdDays { get; set; } = 7;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("updatedAt")]
    public string? UpdatedAt { get; set; }

    [JsonPropertyName("updatedBy")]
    public string UpdatedBy { get; set; } = string.Empty;

    [JsonPropertyName("extensions")]
    public List<SoftwareLicenseExtensionDto> Extensions { get; set; } = [];
}

public sealed class SoftwareLicenseExtensionDto
{
    [JsonPropertyName("days")]
    public int Days { get; set; }

    [JsonPropertyName("extendedAt")]
    public string? ExtendedAt { get; set; }

    [JsonPropertyName("extendedBy")]
    public string ExtendedBy { get; set; } = string.Empty;

    [JsonPropertyName("note")]
    public string Note { get; set; } = string.Empty;
}

public sealed class FinancialYearDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("financialYearName")]
    public string FinancialYearName { get; set; } = string.Empty;

    [JsonPropertyName("startDate")]
    public DateTime StartDate { get; set; }

    [JsonPropertyName("endDate")]
    public DateTime EndDate { get; set; }

    [JsonPropertyName("databaseName")]
    public string DatabaseName { get; set; } = string.Empty;

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }

    [JsonPropertyName("closed")]
    public bool Closed { get; set; }
}

public sealed class YearEndResultDto
{
    [JsonPropertyName("ok")]
    public bool Ok { get; set; }

    [JsonPropertyName("result")]
    public YearEndPayloadDto? Result { get; set; }
}

public sealed class YearEndPayloadDto
{
    [JsonPropertyName("openingBalancesMigrated")]
    public int OpeningBalancesMigrated { get; set; }

    [JsonPropertyName("openingStockMigrated")]
    public int OpeningStockMigrated { get; set; }
}

public sealed class AuthUserDto
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("username")]
    public string Username { get; set; } = string.Empty;

    [JsonPropertyName("employeeId")]
    public string EmployeeId { get; set; } = string.Empty;

    [JsonPropertyName("fullName")]
    public string FullName { get; set; } = string.Empty;

    [JsonPropertyName("role")]
    public string Role { get; set; } = string.Empty;

    [JsonPropertyName("roleId")]
    public string? RoleId { get; set; }

    [JsonPropertyName("department")]
    public string Department { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("canPrintBarcodeLabels")]
    public bool CanPrintBarcodeLabels { get; set; }
}

public sealed class DocumentRegisterReportDto
{
    [JsonPropertyName("registerType")]
    public string RegisterType { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("partyLabel")]
    public string PartyLabel { get; set; } = string.Empty;

    [JsonPropertyName("dateFromLabel")]
    public string DateFromLabel { get; set; } = string.Empty;

    [JsonPropertyName("dateToLabel")]
    public string DateToLabel { get; set; } = string.Empty;

    [JsonPropertyName("billNoFilter")]
    public string BillNoFilter { get; set; } = string.Empty;

    [JsonPropertyName("documentCount")]
    public int DocumentCount { get; set; }

    [JsonPropertyName("totalAmount")]
    public decimal TotalAmount { get; set; }

    [JsonPropertyName("totalAmountDisplay")]
    public string TotalAmountDisplay { get; set; } = string.Empty;

    [JsonPropertyName("rows")]
    public List<DocumentRegisterRowDto> Rows { get; set; } = [];
}

public sealed class DocumentRegisterRowDto
{
    [JsonPropertyName("serialNo")]
    public int SerialNo { get; set; }

    [JsonPropertyName("billNo")]
    public string BillNo { get; set; } = string.Empty;

    [JsonPropertyName("billDate")]
    public string BillDate { get; set; } = string.Empty;

    [JsonPropertyName("party")]
    public string Party { get; set; } = string.Empty;

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }

    [JsonPropertyName("amountDisplay")]
    public string AmountDisplay { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("narration")]
    public string Narration { get; set; } = string.Empty;
}

public sealed class AuthCompanyDto
{
    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("businessName")]
    public string BusinessName { get; set; } = string.Empty;

    [JsonPropertyName("tagline")]
    public string Tagline { get; set; } = string.Empty;
}

public sealed class EditDeleteVerifyResponseDto
{
    [JsonPropertyName("authorized")]
    public bool Authorized { get; set; }

    [JsonPropertyName("confirmationRequired")]
    public bool ConfirmationRequired { get; set; } = true;
}

public sealed class EditDeleteConfirmationPolicyDto
{
    [JsonPropertyName("confirmationRequired")]
    public bool ConfirmationRequired { get; set; } = true;
}

public sealed class EditDeletePasswordStatusDto
{
    [JsonPropertyName("configured")]
    public bool Configured { get; set; }

    [JsonPropertyName("confirmationRequired")]
    public bool ConfirmationRequired { get; set; } = true;

    [JsonPropertyName("updatedAt")]
    public string? UpdatedAt { get; set; }

    [JsonPropertyName("updatedBy")]
    public string UpdatedBy { get; set; } = string.Empty;
}

public sealed class GridColumnModuleDto
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;
}

public sealed class GridColumnDefinitionDto
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = string.Empty;

    [JsonPropertyName("header")]
    public string Header { get; set; } = string.Empty;

    [JsonPropertyName("mandatory")]
    public bool Mandatory { get; set; }

    [JsonPropertyName("defaultVisible")]
    public bool DefaultVisible { get; set; }
}

public sealed class GridColumnPreferencesDto
{
    [JsonPropertyName("moduleKey")]
    public string ModuleKey { get; set; } = string.Empty;

    [JsonPropertyName("columns")]
    public List<GridColumnDefinitionDto> Columns { get; set; } = [];

    [JsonPropertyName("mandatoryColumnKeys")]
    public List<string> MandatoryColumnKeys { get; set; } = [];

    [JsonPropertyName("defaultVisibleColumnKeys")]
    public List<string> DefaultVisibleColumnKeys { get; set; } = [];

    [JsonPropertyName("visibleColumnKeys")]
    public List<string> VisibleColumnKeys { get; set; } = [];

    [JsonPropertyName("hasUserOverride")]
    public bool HasUserOverride { get; set; }

    [JsonPropertyName("hasGlobalDefault")]
    public bool HasGlobalDefault { get; set; }

    [JsonPropertyName("globalVisibleColumnKeys")]
    public List<string> GlobalVisibleColumnKeys { get; set; } = [];

    [JsonPropertyName("userVisibleColumnKeys")]
    public List<string> UserVisibleColumnKeys { get; set; } = [];
}

public sealed class GridColumnModulesResponseDto
{
    [JsonPropertyName("modules")]
    public List<GridColumnModuleDto> Modules { get; set; } = [];
}
