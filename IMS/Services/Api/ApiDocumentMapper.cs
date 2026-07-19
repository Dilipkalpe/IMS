using System.Globalization;
using IMS.Models;
using IMS.Services;
using IMS.Services.Api.Dtos;
using IMS.ViewModels.SubPages;

namespace IMS.Services.Api;

public static class ApiDocumentMapper
{
    public static string ToApiType(SalesEntryType type) => type switch
    {
        SalesEntryType.SalesOrder => "sales_order",
        SalesEntryType.DeliveryChallan => "delivery_challan",
        SalesEntryType.SalesInvoice => "sales_invoice",
        SalesEntryType.SalesReturn => "sales_return",
        _ => "sales_order"
    };

    public static string ToApiType(PurchaseEntryType type) => type switch
    {
        PurchaseEntryType.PurchaseOrder => "purchase_order",
        PurchaseEntryType.Grn => "grn",
        PurchaseEntryType.PurchaseInvoice => "purchase_invoice",
        PurchaseEntryType.PurchaseReturn => "purchase_return",
        _ => "purchase_order"
    };

    public static MockRow ToMockRow(TransactionDocumentDto? doc, string? col3Header, bool isSales)
    {
        ArgumentNullException.ThrowIfNull(doc);

        var header = col3Header ?? "Amount";
        var totals = doc.Totals;
        var amount = isSales
            ? totals?.SaleAmount ?? totals?.Net ?? totals?.Gross ?? "0"
            : totals?.OrderAmount ?? totals?.Net ?? totals?.Gross ?? "0";
        var col3 = header.Contains("Qty", StringComparison.OrdinalIgnoreCase)
            ? totals?.TotQty ?? "0"
            : FormatAmount(amount);
        return new MockRow
        {
            Col1 = doc.FormattedDocNo ?? $"#{doc.DocNo}",
            Col2 = isSales
                ? doc.Customer ?? doc.Supplier ?? "—"
                : doc.Supplier ?? doc.Buyer ?? "—",
            Col3 = col3,
            Col4 = FormatTranDate(doc.BillDate),
            Status = Capitalize(doc.Status ?? "open")
        };
    }

    private static string FormatAmount(string amount) =>
        amount.StartsWith('$') ? amount : $"${amount}";

    public static string FormatTranDate(DateTime? date) =>
        date.HasValue ? date.Value.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture) : "—";

    public static string FormatTranDate(string? billDate)
    {
        if (string.IsNullOrWhiteSpace(billDate))
            return "—";

        var parsed = ParseBillDate(billDate);
        return parsed.HasValue ? FormatTranDate(parsed) : billDate.Trim();
    }

    private static string SalesDocumentTranDate(NumberedSalesDocumentDto doc)
    {
        if (doc.InvoiceDate is { } invoice)
            return FormatTranDate(invoice);
        if (doc.DcDate is { } dc)
            return FormatTranDate(dc);
        if (doc.ReturnDate is { } ret)
            return FormatTranDate(ret);

        var fromBill = ParseBillDate(doc.BillDate);
        return fromBill.HasValue ? FormatTranDate(fromBill) : FormatTranDate(doc.BillDate);
    }

    private static string PurchaseDocumentTranDate(NumberedPurchaseDocumentDto doc) =>
        doc.InvoiceDate is { } invoice
            ? FormatTranDate(invoice)
            : doc.GrnDate is { } grn
                ? FormatTranDate(grn)
                : doc.PoDate is { } po
                    ? FormatTranDate(po)
                    : doc.ReturnDate is { } ret
                        ? FormatTranDate(ret)
                        : FormatTranDate(doc.BillDate);

    public static MockRow ProductToMockRow(ProductDto p) => new()
    {
        Col1 = p.Code,
        Col2 = p.Name,
        Col3 = p.Category ?? "General",
        Col4 = p.Unit ?? "EA",
        Status = p.ActiveStatus ? "Active" : "Inactive",
        Source = p
    };

    public static MockRow ProductionOrderToMockRow(ProductionOrderDto order) => new()
    {
        Col1 = order.ProductionNo.ToString(CultureInfo.InvariantCulture),
        Col2 = string.IsNullOrWhiteSpace(order.ManufacturingItemName)
            ? order.ManufacturingItemId ?? "—"
            : order.ManufacturingItemName,
        Col3 = order.FinalQty > 0
            ? order.FinalQty.ToString("N0", CultureInfo.InvariantCulture)
            : order.ProduceQty.ToString("N0", CultureInfo.InvariantCulture),
        Col4 = order.Status,
        Status = order.Status,
        Source = order
    };

    public static MockRow BomToMockRow(BomDto bom) => new()
    {
        Col1 = bom.ProductCode,
        Col2 = bom.ProductName ?? bom.ProductCode,
        Col3 = (bom.RawMaterials?.Count ?? 0).ToString(CultureInfo.InvariantCulture),
        Col4 = bom.Revision ?? "Rev A",
        Status = string.IsNullOrWhiteSpace(bom.Status) ? "Active" : bom.Status,
        Source = bom
    };

    public static MockRow StockTransferToMockRow(StockTransferDto transfer) => new()
    {
        Col1 = transfer.EntryNo,
        Col2 = transfer.FromGodown ?? "—",
        Col3 = transfer.ToGodown ?? "—",
        Col4 = FormatTranDate(transfer.TransferDate),
        Status = string.IsNullOrWhiteSpace(transfer.Status) ? "Posted" : transfer.Status
    };

    public static MockRow PaymentVoucherToMockRow(PaymentVoucherDto v) => new()
    {
        Col1 = v.VoucherNo.ToString(CultureInfo.InvariantCulture),
        Col2 = string.IsNullOrWhiteSpace(v.AccountName) ? v.AccountCode ?? "—" : v.AccountName,
        Col3 = v.Amount.ToString("N2", CultureInfo.InvariantCulture),
        Col4 = FormatTranDate(v.VoucherDate),
        Status = v.Status
    };

    public static MockRow BankEntryToMockRow(BankEntryDto v) => new()
    {
        Col1 = v.VoucherNo.ToString(CultureInfo.InvariantCulture),
        Col2 = Capitalize(v.CashBank ?? "—"),
        Col3 = v.Amount.ToString("N2", CultureInfo.InvariantCulture),
        Col4 = FormatTranDate(v.VoucherDate),
        Status = v.Status
    };

    public static BankEntryDto FromBankEntryEntry(BankEntryEntryViewModel vm, int voucherNo) => new()
    {
        VoucherType = "bank_entry",
        VoucherNo = voucherNo,
        RefNo = vm.RefNo?.Trim(),
        VoucherDate = vm.VoucherDate ?? DateTime.Today,
        CashBank = vm.CashBank?.Trim().ToUpperInvariant() ?? "DEPOSIT",
        AccountCode = vm.AccountCode?.Trim().ToUpperInvariant(),
        AccountName = vm.AccountName?.Trim(),
        Amount = ParseDecimal(vm.Amount),
        Narration = vm.Narration?.Trim(),
        Status = "Posted"
    };

    public static PaymentVoucherDto FromPaymentVoucherEntry(PaymentVoucherEntryViewModel vm, int voucherNo)
    {
        var dto = new PaymentVoucherDto
        {
            VoucherType = "payment",
            VoucherNo = voucherNo,
            RefNo = vm.RefNo?.Trim(),
            VoucherDate = vm.VoucherDate ?? DateTime.Today,
            CashBank = vm.CashBank?.Trim() ?? "CASH",
            AccountCode = vm.AccountCode?.Trim().ToUpperInvariant(),
            AccountName = vm.AccountName?.Trim(),
            Amount = ParseDecimal(vm.Amount),
            Narration = vm.Narration?.Trim(),
            Status = "Posted"
        };

        if (vm.LinkedInvoiceSeed is { } seed)
        {
            dto.SourceDocType = seed.SourceDocType;
            dto.SourceDocId = seed.SourceDocId;
            dto.SourceFormattedDocNo = seed.FormattedDocNo;
            if (string.IsNullOrWhiteSpace(dto.RefNo))
                dto.RefNo = seed.FormattedDocNo;
        }

        return dto;
    }

    public static MockRow CreditNoteToMockRow(CreditNoteDto n) => new()
    {
        Col1 = n.VoucherNo.ToString(CultureInfo.InvariantCulture),
        Col2 = string.IsNullOrWhiteSpace(n.AccountName) ? n.AccountCode ?? "—" : n.AccountName,
        Col3 = n.TotalAmount.ToString("N2", CultureInfo.InvariantCulture),
        Col4 = FormatTranDate(n.VoucherDate),
        Status = n.Status
    };

    public static CreditNoteDto FromCreditNoteEntry(
        CreditNoteEntryViewModel vm,
        int voucherNo,
        decimal amount,
        decimal gstRate,
        decimal totalAmount) => new()
    {
        VoucherType = "credit_note",
        VoucherNo = voucherNo,
        RefNo = vm.RefNo?.Trim(),
        VoucherDate = vm.VoucherDate ?? DateTime.Today,
        AccountCode = vm.AccountCode?.Trim().ToUpperInvariant(),
        AccountName = vm.AccountName?.Trim(),
        Amount = amount,
        GstRate = gstRate,
        TotalAmount = totalAmount,
        IsIgst = vm.IsIgst,
        Narration = vm.Narration?.Trim(),
        Status = "Posted"
    };

    public static MockRow DebitNoteToMockRow(DebitNoteDto n) => new()
    {
        Col1 = n.VoucherNo.ToString(CultureInfo.InvariantCulture),
        Col2 = string.IsNullOrWhiteSpace(n.AccountName) ? n.AccountCode ?? "—" : n.AccountName,
        Col3 = n.TotalAmount.ToString("N2", CultureInfo.InvariantCulture),
        Col4 = FormatTranDate(n.VoucherDate),
        Status = n.Status
    };

    public static DebitNoteDto FromDebitNoteEntry(
        DebitNoteEntryViewModel vm,
        int voucherNo,
        decimal amount,
        decimal gstRate,
        decimal totalAmount) => new()
    {
        VoucherType = "debit_note",
        VoucherNo = voucherNo,
        RefNo = vm.RefNo?.Trim(),
        VoucherDate = vm.VoucherDate ?? DateTime.Today,
        AccountCode = vm.AccountCode?.Trim().ToUpperInvariant(),
        AccountName = vm.AccountName?.Trim(),
        Amount = amount,
        GstRate = gstRate,
        TotalAmount = totalAmount,
        IsIgst = vm.IsIgst,
        Narration = vm.Narration?.Trim(),
        Status = "Posted"
    };

    public static MockRow CashEntryToMockRow(CashEntryDto entry)
    {
        var category = entry.Lines.Count > 0
            ? entry.Lines[0].Particular ?? "—"
            : "—";
        if (entry.Lines.Count > 1)
            category += $" (+{entry.Lines.Count - 1})";

        return new()
        {
            Col1 = entry.EntryNo.ToString(CultureInfo.InvariantCulture),
            Col2 = category,
            Col3 = entry.TotalAmount.ToString("N2", CultureInfo.InvariantCulture),
            Col4 = FormatTranDate(entry.EntryDate),
            Status = entry.Status
        };
    }

    public static CashEntryDto FromCashEntryEntry(
        CashEntryEntryViewModel vm,
        int entryNo,
        decimal totalAmount) => new()
    {
        EntryType = "cash_entry",
        EntryNo = entryNo,
        EntryDate = vm.EntryDate ?? DateTime.Today,
        Lines = vm.LineItems.Select((line, index) => new CashEntryLineDto
        {
            SrNo = index + 1,
            Particular = line.Particular?.Trim(),
            Amount = ParseDecimal(line.Amount)
        }).ToList(),
        TotalAmount = totalAmount,
        Status = "Posted"
    };

    public static MockRow ReceiptVoucherToMockRow(ReceiptVoucherDto v) => new()
    {
        Col1 = v.VoucherNo.ToString(CultureInfo.InvariantCulture),
        Col2 = string.IsNullOrWhiteSpace(v.AccountName) ? v.AccountCode ?? "—" : v.AccountName,
        Col3 = v.Amount.ToString("N2", CultureInfo.InvariantCulture),
        Col4 = FormatTranDate(v.VoucherDate),
        Status = v.Status
    };

    public static ReceiptVoucherDto FromReceiptVoucherEntry(ReceiptVoucherEntryViewModel vm, int voucherNo)
    {
        var dto = new ReceiptVoucherDto
        {
            VoucherType = "receipt",
            VoucherNo = voucherNo,
            RefNo = vm.RefNo?.Trim(),
            VoucherDate = vm.VoucherDate ?? DateTime.Today,
            CashBank = vm.CashBank?.Trim() ?? "CASH",
            AccountCode = vm.AccountCode?.Trim().ToUpperInvariant(),
            AccountName = vm.AccountName?.Trim(),
            Amount = ParseDecimal(vm.Amount),
            Narration = vm.Narration?.Trim(),
            Status = "Posted"
        };

        if (vm.LinkedInvoiceSeed is { } seed)
        {
            dto.SourceDocType = seed.SourceDocType;
            dto.SourceDocId = seed.SourceDocId;
            dto.SourceFormattedDocNo = seed.FormattedDocNo;
            if (string.IsNullOrWhiteSpace(dto.RefNo))
                dto.RefNo = seed.FormattedDocNo;
        }

        return dto;
    }

    public static MockRow AccountToMockRow(AccountDto a) => new()
    {
        Col1 = a.Code,
        Col2 = a.Name,
        Col3 = Capitalize(a.AccountType),
        Col4 = a.ActiveStatus ? "Active" : "Inactive",
        Status = a.ActiveStatus ? "Active" : "Inactive"
    };

    public static MockRow ProductTypeToMockRow(ProductTypeDto pt) => new()
    {
        Col1 = pt.Code,
        Col2 = pt.Name,
        Col3 = pt.Description ?? "—",
        Col4 = pt.ActiveStatus ? "Active" : "Inactive",
        Status = pt.ActiveStatus ? "Active" : "Inactive"
    };

    public static ProductTypeDto FromProductTypeForm(
        string code,
        string name,
        string? description,
        bool activeStatus,
        string? id = null) => new()
    {
        Id = id,
        Code = code.Trim().ToUpperInvariant(),
        Name = name.Trim(),
        Description = description?.Trim(),
        ActiveStatus = activeStatus
    };

    public static MockRow ProductMainGroupToMockRow(ProductMainGroupDto item) => new()
    {
        Col1 = item.Code,
        Col2 = item.Name,
        Col3 = item.Description ?? "—",
        Col4 = item.ActiveStatus ? "Active" : "Inactive",
        Status = item.ActiveStatus ? "Active" : "Inactive"
    };

    public static MockRow AssemblyTypeToMockRow(AssemblyTypeDto item) => new()
    {
        Col1 = item.Code,
        Col2 = item.Name,
        Col3 = item.Description ?? "—",
        Col4 = item.ActiveStatus ? "Active" : "Inactive",
        Status = item.ActiveStatus ? "Active" : "Inactive"
    };

    public static AssemblyTypeDto FromAssemblyTypeForm(
        string code,
        string name,
        string? description,
        bool activeStatus,
        string? id = null) => new()
    {
        Id = id,
        Code = code.Trim().ToUpperInvariant(),
        Name = name.Trim(),
        Description = description?.Trim(),
        ActiveStatus = activeStatus
    };

    public static MockRow MachineToMockRow(MachineDto item) => new()
    {
        Col1 = item.Code,
        Col2 = item.Name,
        Col3 = item.Description ?? "—",
        Col4 = item.ActiveStatus ? "Active" : "Inactive",
        Status = item.ActiveStatus ? "Active" : "Inactive"
    };

    public static MockRow BillFormatToMockRow(SalesBillTemplateDto item, IReadOnlyDictionary<string, string>? typeLabels = null)
    {
        var code = string.IsNullOrWhiteSpace(item.FormatCode)
            ? item.TemplateKey.ToUpperInvariant()
            : item.FormatCode;
        var typeLabel = typeLabels is not null && typeLabels.TryGetValue(item.TransactionType, out var label)
            ? label
            : item.TransactionType.Replace('_', ' ');
        return new MockRow
        {
            Col1 = code,
            Col2 = item.Name,
            Col3 = typeLabel,
            Col4 = item.IsDefault ? "Yes" : "—",
            Status = item.IsActive ? "Active" : "Inactive",
            Source = item
        };
    }

    public static MachineDto FromMachineForm(
        string code,
        string name,
        string? description,
        bool activeStatus,
        string? id = null) => new()
    {
        Id = id,
        Code = code.Trim().ToUpperInvariant(),
        Name = name.Trim(),
        Description = description?.Trim(),
        ActiveStatus = activeStatus
    };

    public static MockRow PayrollEmployeeToMockRow(PayrollEmployeeDto item) => new()
    {
        Col1 = item.EmployeeCode,
        Col2 = item.FullName,
        Col3 = PayrollEmployeeFormFields.ToDisplayEmployeeType(item.EmployeeType),
        Col4 = PayrollEmployeeFormFields.FormatCompensation(item),
        Status = item.ActiveStatus ? "Active" : "Inactive",
        Source = item
    };

    public static PayrollEmployeeDto FromPayrollEmployeeForm(
        string code,
        string name,
        string employeeTypeDisplay,
        string department,
        string designation,
        string pan,
        string payableAccountCode,
        string monthlySalaryText,
        string dailyWageText,
        string contractStartText,
        string contractEndText,
        string hraPercentText,
        string bonusPercentText,
        string tdsPercentText,
        bool activeStatus,
        string? id = null)
    {
        decimal Parse(string? t) =>
            decimal.TryParse(t, NumberStyles.Any, CultureInfo.InvariantCulture, out var v) ? v : 0;

        DateTime? ParseDate(string? text) =>
            DateTime.TryParse(text, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var d)
                ? d.Date
                : null;

        var employeeType = PayrollEmployeeFormFields.ToApiEmployeeType(employeeTypeDisplay);
        var monthlySalary = Parse(monthlySalaryText);
        var dailyWage = Parse(dailyWageText);

        return new PayrollEmployeeDto
        {
            Id = id,
            EmployeeCode = code.Trim().ToUpperInvariant(),
            FullName = name.Trim(),
            EmployeeType = employeeType,
            Department = department.Trim(),
            Designation = designation.Trim(),
            PanNo = pan.Trim().ToUpperInvariant(),
            PayableAccountCode = payableAccountCode.Trim().ToUpperInvariant(),
            PayableAccountName = name.Trim(),
            MonthlySalary = employeeType == "daily" ? 0 : monthlySalary,
            DailyWage = employeeType == "daily" ? dailyWage : 0,
            BasicSalary = employeeType == "daily" ? 0 : monthlySalary,
            ContractStartDate = employeeType == "temporary" ? ParseDate(contractStartText) : null,
            ContractEndDate = employeeType == "temporary" ? ParseDate(contractEndText) : null,
            HraPercent = employeeType == "daily" ? 0 : Parse(hraPercentText),
            BonusPercent = employeeType == "daily" ? 0 : Parse(bonusPercentText),
            TdsPercent = Parse(tdsPercentText),
            PfApplicable = true,
            EsiApplicable = true,
            PtApplicable = true,
            ActiveStatus = activeStatus
        };
    }

    public static MockRow AttendanceToMockRow(AttendanceRecordDto item) => new()
    {
        Col1 = item.AttendanceDate?.ToString("dd-MMM-yyyy", CultureInfo.InvariantCulture) ?? "—",
        Col2 = item.EmployeeCode,
        Col3 = item.EmployeeName ?? "—",
        Col4 = item.Status,
        Status = item.Status,
        Source = item
    };

    public static AttendanceRecordDto FromAttendanceForm(
        string employeeCode,
        string employeeName,
        DateTime date,
        string status,
        string workedHoursText,
        string otHoursText,
        string? id = null) =>
        new()
        {
            Id = id,
            EmployeeCode = employeeCode.Trim().ToUpperInvariant(),
            EmployeeName = employeeName.Trim(),
            AttendanceDate = date,
            Status = status.ToLowerInvariant(),
            WorkedHours = decimal.TryParse(workedHoursText, NumberStyles.Any, CultureInfo.InvariantCulture, out var wh) ? wh : 8,
            OvertimeHours = decimal.TryParse(otHoursText, NumberStyles.Any, CultureInfo.InvariantCulture, out var ot) ? ot : 0
        };

    public static MockRow PayrollRunToMockRow(PayrollRunDto item) => new()
    {
        Col1 = item.RunNo.ToString(CultureInfo.InvariantCulture),
        Col2 = item.PeriodMonth ?? "—",
        Col3 = item.TotalNet.ToString("N2", CultureInfo.InvariantCulture),
        Col4 = FormatPayrollRunStatus(item),
        Status = item.Status,
        Source = item
    };

    private static string FormatPayrollRunStatus(PayrollRunDto item)
    {
        if (item.Status == "paid" && item.PaymentVoucherNos?.Count > 0)
            return $"paid · PV {string.Join(", ", item.PaymentVoucherNos.Take(2))}";
        return item.Status ?? "—";
    }

    public static MockRow WarehouseToMockRow(WarehouseDto item) => new()
    {
        Col1 = item.Code,
        Col2 = item.Name,
        Col3 = string.IsNullOrWhiteSpace(item.Location) ? "—" : item.Location,
        Col4 = item.ActiveStatus ? "Active" : "Inactive",
        Status = item.ActiveStatus ? "Active" : "Inactive"
    };

    public static WarehouseDto FromWarehouseForm(
        string code,
        string name,
        string? location,
        bool activeStatus,
        string? id = null) => new()
    {
        Id = id,
        Code = code.Trim().ToUpperInvariant(),
        Name = name.Trim(),
        Location = location?.Trim(),
        ActiveStatus = activeStatus
    };

    public static MockRow SaleUomToMockRow(SaleUomDto item) => new()
    {
        Col1 = item.Code,
        Col2 = item.Name,
        Col3 = item.Decimals.ToString(CultureInfo.InvariantCulture),
        Col4 = item.ActiveStatus ? "Active" : "Inactive",
        Status = item.ActiveStatus ? "Active" : "Inactive"
    };

    public static SaleUomDto FromSaleUomForm(
        string code,
        string name,
        string? symbol,
        int decimals,
        bool activeStatus,
        string? id = null) => new()
    {
        Id = id,
        Code = code.Trim().ToUpperInvariant(),
        Name = name.Trim(),
        Symbol = symbol?.Trim(),
        Decimals = decimals,
        ActiveStatus = activeStatus
    };

    public static MockRow CustomerTypeToMockRow(CustomerTypeDto item) => new()
    {
        Col1 = item.Code,
        Col2 = item.Name,
        Col3 = item.Description ?? "—",
        Col4 = item.ActiveStatus ? "Active" : "Inactive",
        Status = item.ActiveStatus ? "Active" : "Inactive"
    };

    public static CustomerTypeDto FromCustomerTypeForm(
        string code,
        string name,
        string? description,
        bool activeStatus,
        string? id = null) => new()
    {
        Id = id,
        Code = code.Trim().ToUpperInvariant(),
        Name = name.Trim(),
        Description = description?.Trim(),
        ActiveStatus = activeStatus
    };

    public static MockRow CompanyToMockRow(CompanyDto item) => new()
    {
        Col1 = item.Code,
        Col2 = item.BusinessName,
        Col3 = string.IsNullOrWhiteSpace(item.Gstin) ? "—" : item.Gstin,
        Col4 = item.IsDefault ? "Yes" : "No",
        Status = item.ActiveStatus ? "Active" : "Inactive"
    };

    public static CompanyDto FromCompanyForm(
        string code,
        string businessName,
        string? address,
        string? phone,
        string? email,
        string? gstin,
        string? state,
        string? placeOfSupply,
        string? bankName,
        string? bankAccountNo,
        string? bankIfsc,
        string? bankAccountHolder,
        string? logoText,
        string? logoImage,
        IEnumerable<string> terms,
        bool isDefault,
        bool activeStatus,
        string? id = null) => new()
    {
        Id = id,
        Code = code.Trim().ToUpperInvariant(),
        BusinessName = businessName.Trim(),
        Address = address?.Trim(),
        Phone = phone?.Trim(),
        Email = email?.Trim(),
        Gstin = gstin?.Trim(),
        State = state?.Trim(),
        PlaceOfSupply = placeOfSupply?.Trim(),
        BankName = bankName?.Trim(),
        BankAccountNo = bankAccountNo?.Trim(),
        BankIfsc = bankIfsc?.Trim(),
        BankAccountHolder = bankAccountHolder?.Trim(),
        LogoText = logoText?.Trim(),
        LogoImage = logoImage?.Trim(),
        Terms = terms.Where(t => !string.IsNullOrWhiteSpace(t)).Select(t => t.Trim()).ToList(),
        IsDefault = isDefault,
        ActiveStatus = activeStatus
    };

    public static MockRow UserToMockRow(AppUserDto user) => new()
    {
        Col1 = user.Username,
        Col2 = user.Role,
        Col3 = string.IsNullOrWhiteSpace(user.Department) ? "—" : user.Department.Trim(),
        Col4 = user.ActiveStatus ? "Active" : "Inactive",
        Status = user.ActiveStatus ? "Active" : "Inactive"
    };

    public static AppUserDto FromUserForm(
        string username,
        string fullName,
        string role,
        string? department,
        string? email,
        string? password,
        bool activeStatus,
        bool canPrintBarcodeLabels = false,
        string? id = null) => new()
    {
        Id = id,
        Username = username.Trim().ToLowerInvariant(),
        FullName = fullName.Trim(),
        Role = role.Trim(),
        Department = department?.Trim(),
        Email = string.IsNullOrWhiteSpace(email) ? null : email.Trim(),
        Password = string.IsNullOrWhiteSpace(password) ? null : password,
        ActiveStatus = activeStatus,
        CanPrintBarcodeLabels = canPrintBarcodeLabels
    };

    public static ProductMainGroupDto FromProductMainGroupForm(
        string code,
        string name,
        string? description,
        bool activeStatus,
        string? id = null) => new()
    {
        Id = id,
        Code = code.Trim().ToUpperInvariant(),
        Name = name.Trim(),
        Description = description?.Trim(),
        ActiveStatus = activeStatus
    };

    public static MockRow ProductSubGroupToMockRow(ProductSubGroupDto item) => new()
    {
        Col1 = item.Code,
        Col2 = item.Name,
        Col3 = item.MainGroup,
        Col4 = item.ActiveStatus ? "Active" : "Inactive",
        Status = item.ActiveStatus ? "Active" : "Inactive"
    };

    public static ProductSubGroupDto FromProductSubGroupForm(
        string code,
        string name,
        string mainGroup,
        bool activeStatus,
        string? id = null) => new()
    {
        Id = id,
        Code = code.Trim().ToUpperInvariant(),
        Name = name.Trim(),
        MainGroup = string.IsNullOrWhiteSpace(mainGroup) ? "General" : mainGroup.Trim(),
        ActiveStatus = activeStatus
    };

    public static MockRow SalesDocumentToMockRow(NumberedSalesDocumentDto doc, string? col3Header)
    {
        var header = col3Header ?? "Amount";
        var totals = doc.Totals;
        var amount = totals?.SaleAmount ?? totals?.OrderAmount ?? totals?.Net ?? totals?.Gross ?? "0";
        var col3 = header.Contains("Qty", StringComparison.OrdinalIgnoreCase)
            ? totals?.TotQty ?? "0"
            : FormatAmount(amount);

        return new MockRow
        {
            Col1 = doc.FormattedDocNo ?? $"{doc.DocPrefix}-{doc.DocNo}",
            Col2 = doc.Customer ?? "—",
            Col3 = col3,
            Col4 = SalesDocumentTranDate(doc),
            Status = Capitalize(doc.Status)
        };
    }

    public static MockRow SalesOrderToMockRow(SalesOrderDto order, string? col3Header)
    {
        var header = col3Header ?? "Amount";
        var totals = order.Totals;
        var amount = totals?.SaleAmount ?? totals?.OrderAmount ?? totals?.Net ?? totals?.Gross ?? "0";
        var col3 = header.Contains("Qty", StringComparison.OrdinalIgnoreCase)
            ? totals?.TotQty ?? "0"
            : FormatAmount(amount);

        return new MockRow
        {
            Col1 = order.FormattedDocNo ?? $"SO-{order.DocNo}",
            Col2 = order.Customer ?? "—",
            Col3 = col3,
            Col4 = order.SoDate is { } soDate ? FormatTranDate(soDate) : FormatTranDate(order.BillDate),
            Status = Capitalize(order.Status)
        };
    }

    public static SalesOrderDto FromSalesOrderForm(AddSalesOrderViewModel form, string? id = null)
    {
        if (!int.TryParse(form.BillNo, out var docNo))
            docNo = 0;

        return new SalesOrderDto
        {
            Id = id,
            SoPrefix = form.SoPrefix,
            DocNo = docNo,
            FormattedDocNo = form.FormattedDocNo,
            SoDate = form.SoDate ?? DateTime.Today,
            BillDate = form.BillDate,
            SalesMan = form.SalesMan,
            Customer = form.Customer,
            CustomerDetails = form.CustomerDetails,
            PaymentTerms = form.PaymentTerms?.Trim(),
            DeliveryPriority = string.IsNullOrWhiteSpace(form.DeliveryPriority) || form.DeliveryPriority == "Select"
                ? "Normal"
                : form.DeliveryPriority.Trim(),
            BillingAddress = form.BillingAddress?.Trim(),
            ShippingAddress = form.ShippingAddress?.Trim(),
            Narration = form.Narration?.Trim(),
            Status = "open",
            Lines = form.LineItems.Select(MapSalesOrderLine).ToList(),
            Totals = MapFormTotals(form)
        };
    }

    public static SalesOrderDto FromSalesInvoiceForm(AddSalesInvoiceViewModel form, string? id = null)
    {
        if (!int.TryParse(form.BillNo, out var docNo))
            docNo = 0;

        return new SalesOrderDto
        {
            Id = id,
            SoPrefix = form.DocPrefix,
            DocNo = docNo,
            FormattedDocNo = form.FormattedDocNo,
            SoDate = form.InvoiceDate ?? DateTime.Today,
            BillDate = form.BillDate,
            SalesMan = form.SalesMan,
            Customer = form.Customer,
            CustomerDetails = form.CustomerDetails,
            BillingAddress = form.PlaceOfSupply?.Trim(),
            ShippingAddress = form.Gstin?.Trim(),
            Narration = form.Narration?.Trim(),
            PaymentTerms = string.IsNullOrWhiteSpace(form.DcReference) ? null : form.DcReference.Trim(),
            Status = "open",
            Lines = form.LineItems.Select(MapSalesOrderLine).ToList(),
            Totals = MapFormTotals(form)
        };
    }

    public static SalesOrderDto FromDeliveryChallanForm(AddDeliveryChallanViewModel form, string? id = null)
    {
        if (!int.TryParse(form.BillNo, out var docNo))
            docNo = 0;

        return new SalesOrderDto
        {
            Id = id,
            SoPrefix = form.DocPrefix,
            DocNo = docNo,
            FormattedDocNo = form.FormattedDocNo,
            SoDate = form.DcDate ?? DateTime.Today,
            BillDate = form.BillDate,
            SalesMan = form.SalesMan,
            Customer = form.Customer,
            CustomerDetails = form.CustomerDetails,
            PaymentTerms = form.SoReference?.Trim(),
            BillingAddress = form.Warehouse?.Trim(),
            ShippingAddress = JoinNonEmpty(form.VehicleNo, form.Transporter),
            Narration = form.Narration?.Trim(),
            Status = "open",
            Lines = form.LineItems.Select(MapSalesOrderLine).ToList(),
            Totals = MapFormTotals(form)
        };
    }

    public static SalesOrderDto FromSalesReturnForm(AddSalesReturnViewModel form, string? id = null)
    {
        if (!int.TryParse(form.BillNo, out var docNo))
            docNo = 0;

        return new SalesOrderDto
        {
            Id = id,
            SoPrefix = form.DocPrefix,
            DocNo = docNo,
            FormattedDocNo = form.FormattedDocNo,
            SoDate = form.ReturnDate ?? DateTime.Today,
            BillDate = form.BillDate,
            SalesMan = form.SalesMan,
            Customer = form.Customer,
            CustomerDetails = form.CustomerDetails,
            PaymentTerms = form.InvoiceReference?.Trim(),
            BillingAddress = form.ReturnWarehouse?.Trim(),
            Narration = JoinNarration(form.ReturnReason, form.QcRemark, form.Narration),
            Status = "open",
            Lines = form.LineItems.Select(MapSalesOrderLine).ToList(),
            Totals = MapFormTotals(form)
        };
    }

    public static SalesOrderDto NumberedSalesDocumentToSalesOrderDto(NumberedSalesDocumentDto doc)
    {
        var soDate = doc.InvoiceDate?.Date
            ?? doc.DcDate?.Date
            ?? doc.ReturnDate?.Date
            ?? ParseBillDate(doc.BillDate)
            ?? DateTime.Today;

        string? paymentTerms = null;
        string? billingAddress = null;
        string? shippingAddress = null;
        var narration = doc.Narration;

        if (doc.DcDate is not null || !string.IsNullOrWhiteSpace(doc.SoReference))
        {
            paymentTerms = doc.SoReference;
            billingAddress = doc.Warehouse;
            shippingAddress = JoinNonEmpty(doc.VehicleNo, doc.Transporter);
        }
        else if (doc.InvoiceDate is not null || !string.IsNullOrWhiteSpace(doc.Gstin))
        {
            paymentTerms = doc.DcReference;
            billingAddress = doc.PlaceOfSupply;
            shippingAddress = doc.Gstin;
        }
        else if (doc.ReturnDate is not null || !string.IsNullOrWhiteSpace(doc.InvoiceReference))
        {
            paymentTerms = doc.InvoiceReference;
            billingAddress = doc.ReturnWarehouse;
            narration = JoinNarration(doc.ReturnReason, doc.QcRemark, doc.Narration);
        }

        var dto = new SalesOrderDto
        {
            Id = doc.Id,
            SoPrefix = string.IsNullOrWhiteSpace(doc.DocPrefix) ? "SO" : doc.DocPrefix,
            DocNo = doc.DocNo,
            FormattedDocNo = doc.FormattedDocNo,
            SoDate = soDate,
            BillDate = doc.BillDate,
            SalesMan = doc.SalesMan,
            Customer = doc.Customer,
            CustomerDetails = doc.CustomerDetails,
            PaymentTerms = paymentTerms,
            BillingAddress = billingAddress,
            ShippingAddress = shippingAddress,
            Narration = narration,
            Status = doc.Status ?? "open",
            Lines = doc.Lines,
            Totals = doc.Totals
        };

        return ApplyPrintTitle(dto, InferSalesDocumentType(doc));
    }

    public static SalesOrderDto ToSalesOrderDtoForPrint(SalesEntryFormViewModelBase form, string? id = null)
    {
        var dto = form switch
        {
            AddSalesOrderViewModel salesOrder => FromSalesOrderForm(salesOrder, id ?? salesOrder.SavedOrderId),
            AddSalesInvoiceViewModel invoice => FromSalesInvoiceForm(invoice, id ?? invoice.SavedDocumentId),
            AddDeliveryChallanViewModel challan => FromDeliveryChallanForm(challan, id ?? challan.SavedDocumentId),
            AddSalesReturnViewModel salesReturn => FromSalesReturnForm(salesReturn, id ?? salesReturn.SavedDocumentId),
            _ => throw new ArgumentException($"Unsupported sales form type: {form.GetType().Name}", nameof(form))
        };
        return ApplyPrintTitle(dto, form.EntryType);
    }

    public static SalesEntryType InferSalesDocumentType(NumberedSalesDocumentDto doc)
    {
        if (doc.DcDate is not null || !string.IsNullOrWhiteSpace(doc.SoReference))
            return SalesEntryType.DeliveryChallan;
        if (doc.InvoiceDate is not null || !string.IsNullOrWhiteSpace(doc.Gstin))
            return SalesEntryType.SalesInvoice;
        if (doc.ReturnDate is not null || !string.IsNullOrWhiteSpace(doc.InvoiceReference))
            return SalesEntryType.SalesReturn;
        return SalesEntryType.SalesOrder;
    }

    private static SalesOrderDto ApplyPrintTitle(SalesOrderDto dto, SalesEntryType entryType)
    {
        dto.DocumentTitle = SalesEntryCatalog.GetPrintHeaderTitle(entryType);
        return dto;
    }

    private static SalesOrderTotalsDto MapFormTotals(SalesEntryFormViewModelBase form) => new()
    {
        TotQty = form.TotQty,
        Gross = form.Gross,
        Discount = form.Discount,
        SpDiscount = form.SpDiscount,
        AddOther = form.AddOther,
        Net = form.Net,
        SaleAmount = form.SaleAmount,
        OrderAmount = form.SaleAmount,
        CustomerReturn = form.CustomerReturn,
        ReceivableToCustomer = form.ReceivableToCustomer
    };

    private static string? JoinNonEmpty(params string?[] parts)
    {
        var values = parts.Where(p => !string.IsNullOrWhiteSpace(p)).Select(p => p!.Trim()).ToList();
        return values.Count == 0 ? null : string.Join(" • ", values);
    }

    private static string? JoinNarration(params string?[] parts) =>
        JoinNonEmpty(parts);

    private static DateTime? ParseBillDate(string? billDate)
    {
        if (string.IsNullOrWhiteSpace(billDate))
            return null;

        if (DateTime.TryParseExact(billDate, "dd/MM/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
            return dt;

        return DateTime.TryParse(billDate, CultureInfo.CurrentCulture, DateTimeStyles.None, out dt) ? dt : null;
    }

    private static SalesOrderLineDto MapSalesOrderLine(SalesLineItem line)
    {
        var dto = new SalesOrderLineDto
        {
            Sr = line.Sr,
            ProductRetailCode = line.ProductRetailCode,
            ItemDescription = line.ItemDescription,
            Qty = line.Qty,
            Rate = line.Rate,
            SalesRate = line.SalesRate,
            DiscPercent = line.DiscPercent,
            DiscValue = line.DiscValue,
            TaxType = line.TaxType,
            TaxPercent = line.TaxPercent,
            Amount = line.Amount
        };

        if (line.HasSalesOrderSource)
        {
            dto.SoPrefix = string.IsNullOrWhiteSpace(line.SoPrefix) ? "SO" : line.SoPrefix;
            dto.SoDocNo = line.SoDocNo;
            dto.SoFormattedDocNo = line.SoFormattedDocNo;
            dto.SoLineSr = line.SoLineSr;
            if (line.MaxDeliverQty is decimal soMax)
                dto.SoPendingQty = soMax.ToString("0.###", CultureInfo.InvariantCulture);
        }

        if (line.HasDeliveryChallanSource)
        {
            dto.DcPrefix = string.IsNullOrWhiteSpace(line.DcPrefix) ? "DC" : line.DcPrefix;
            dto.DcDocNo = line.DcDocNo;
            dto.DcFormattedDocNo = line.DcFormattedDocNo;
            dto.DcLineSr = line.DcLineSr;
            if (line.MaxDeliverQty is decimal dcMax)
                dto.DcPendingQty = dcMax.ToString("0.###", CultureInfo.InvariantCulture);
        }

        if (line.HasPurchaseOrderSource)
        {
            dto.PoPrefix = string.IsNullOrWhiteSpace(line.PoPrefix) ? "PO" : line.PoPrefix;
            dto.PoDocNo = line.PoDocNo;
            dto.PoFormattedDocNo = line.PoFormattedDocNo;
            dto.PoLineSr = line.PoLineSr;
            if (line.MaxDeliverQty is decimal poMax)
                dto.PoPendingQty = poMax.ToString("0.###", CultureInfo.InvariantCulture);
        }

        if (line.HasGrnSource)
        {
            dto.GrnPrefix = string.IsNullOrWhiteSpace(line.GrnPrefix) ? "GRN" : line.GrnPrefix;
            dto.GrnDocNo = line.GrnDocNo;
            dto.GrnFormattedDocNo = line.GrnFormattedDocNo;
            dto.GrnLineSr = line.GrnLineSr;
            if (line.MaxDeliverQty is decimal grnMax)
                dto.GrnPendingQty = grnMax.ToString("0.###", CultureInfo.InvariantCulture);
        }

        return dto;
    }

    public static TransactionDocumentDto FromSalesForm(SalesEntryFormViewModelBase form, string? id = null)
    {
        if (!int.TryParse(form.BillNo, out var docNo))
            docNo = 0;

        return new TransactionDocumentDto
        {
            Id = id,
            DocType = ToApiType(form.EntryType),
            DocNo = docNo,
            FormattedDocNo = form.FormattedDocNo,
            BillDate = form.BillDate,
            SalesMan = form.SalesMan,
            Customer = form.Customer,
            CustomerDetails = form.CustomerDetails,
            Narration = form.Narration,
            Status = "open",
            Lines = form.LineItems.Select(MapLine).ToList(),
            Totals = new TransactionTotalsDto
            {
                TotQty = form.TotQty,
                Gross = form.Gross,
                Discount = form.Discount,
                SpDiscount = form.SpDiscount,
                AddOther = form.AddOther,
                Net = form.Net,
                SaleAmount = form.SaleAmount,
                CustomerReturn = form.CustomerReturn,
                ReceivableToCustomer = form.ReceivableToCustomer
            }
        };
    }

    public static MockRow PurchaseDocumentToMockRow(NumberedPurchaseDocumentDto doc, string? col3Header)
    {
        var header = col3Header ?? "Amount";
        var totals = doc.Totals;
        var amount = totals?.OrderAmount ?? totals?.SaleAmount ?? totals?.Net ?? totals?.Gross ?? "0";
        var col3 = header.Contains("Qty", StringComparison.OrdinalIgnoreCase)
            ? totals?.TotQty ?? "0"
            : FormatAmount(amount);

        return new MockRow
        {
            Col1 = doc.FormattedDocNo ?? $"{doc.DocPrefix}-{doc.DocNo}",
            Col2 = doc.Supplier ?? "—",
            Col3 = col3,
            Col4 = PurchaseDocumentTranDate(doc),
            Status = Capitalize(doc.Status)
        };
    }

    public static NumberedPurchaseDocumentDto ToPurchaseDocumentDto(PurchaseDocumentEntryViewModelBase form, string? id = null)
    {
        if (!int.TryParse(form.BillNo, out var docNo))
            docNo = 0;

        var dto = new NumberedPurchaseDocumentDto
        {
            Id = id,
            DocPrefix = form.EffectiveDocPrefix(),
            DocNo = docNo,
            FormattedDocNo = form.FormattedDocNo,
            BillDate = form.BillDate,
            Buyer = form.Buyer,
            Supplier = form.Supplier,
            SupplierDetails = form.SupplierDetails,
            Narration = form.Narration?.Trim(),
            Status = "open",
            Lines = form.LineItems.Select(MapSalesOrderLine).ToList(),
            Totals = new PurchaseOrderTotalsDto
            {
                TotQty = form.TotQty,
                Gross = form.Gross,
                Discount = form.Discount,
                SpDiscount = form.SpDiscount,
                AddOther = form.AddOther,
                Net = form.Net,
                OrderAmount = form.OrderAmount,
                SaleAmount = form.OrderAmount,
                SupplierReturn = form.SupplierReturn,
                PayableToSupplier = form.PayableToSupplier
            }
        };
        form.MapModuleToDto(dto);
        return dto;
    }

    public static PurchaseEntryType InferPurchaseDocumentType(NumberedPurchaseDocumentDto doc)
    {
        if (doc.GrnDate is not null || !string.IsNullOrWhiteSpace(doc.PoReference))
            return PurchaseEntryType.Grn;
        if (doc.InvoiceDate is not null || !string.IsNullOrWhiteSpace(doc.Gstin))
            return PurchaseEntryType.PurchaseInvoice;
        if (doc.ReturnDate is not null || !string.IsNullOrWhiteSpace(doc.InvoiceReference))
            return PurchaseEntryType.PurchaseReturn;
        return PurchaseEntryType.PurchaseOrder;
    }

    public static NumberedPurchaseDocumentDto NumberedPurchaseDocumentToPrintDto(NumberedPurchaseDocumentDto doc)
    {
        doc.DocumentTitle = PurchaseEntryCatalog.GetPrintHeaderTitle(InferPurchaseDocumentType(doc));
        return doc;
    }

    /// <summary>Maps purchase/GRN documents to <see cref="SalesOrderDto"/> for bill-format print renderer (supplier → customer fields).</summary>
    public static SalesOrderDto NumberedPurchaseDocumentToSalesOrderDto(NumberedPurchaseDocumentDto doc)
    {
        var entryType = InferPurchaseDocumentType(doc);
        var docDate = doc.GrnDate?.Date
            ?? doc.InvoiceDate?.Date
            ?? doc.ReturnDate?.Date
            ?? doc.PoDate?.Date
            ?? ParseBillDate(doc.BillDate)
            ?? DateTime.Today;

        var paymentTerms = doc.PoReference
            ?? doc.GrnReference
            ?? doc.InvoiceReference;

        return new SalesOrderDto
        {
            Id = doc.Id,
            SoPrefix = string.IsNullOrWhiteSpace(doc.DocPrefix) ? "PO" : doc.DocPrefix,
            DocNo = doc.DocNo,
            FormattedDocNo = doc.FormattedDocNo,
            SoDate = docDate,
            BillDate = doc.BillDate,
            Customer = doc.Supplier,
            CustomerDetails = doc.SupplierDetails,
            PaymentTerms = paymentTerms,
            BillingAddress = doc.Warehouse ?? doc.PlaceOfSupply,
            ShippingAddress = JoinNonEmpty(doc.VehicleNo, doc.Transporter),
            Narration = doc.Narration,
            Status = doc.Status ?? "open",
            Lines = doc.Lines ?? [],
            Totals = MapPurchaseTotals(doc.Totals),
            DocumentTitle = doc.DocumentTitle ?? PurchaseEntryCatalog.GetPrintHeaderTitle(entryType)
        };
    }

    public static SalesOrderDto ToSalesOrderDtoForPurchasePrint(PurchaseEntryFormViewModelBase form, string? id = null)
    {
        if (form is not PurchaseDocumentEntryViewModelBase docForm)
            throw new ArgumentException($"Purchase print requires {nameof(PurchaseDocumentEntryViewModelBase)}.", nameof(form));

        id ??= docForm.SavedDocumentId;
        var doc = ToPurchaseDocumentDto(docForm, id);
        return NumberedPurchaseDocumentToSalesOrderDto(doc);
    }

    private static SalesOrderTotalsDto? MapPurchaseTotals(PurchaseOrderTotalsDto? totals)
    {
        if (totals is null)
            return null;

        return new SalesOrderTotalsDto
        {
            TotQty = totals.TotQty,
            Gross = totals.Gross,
            Discount = totals.Discount,
            SpDiscount = totals.SpDiscount,
            AddOther = totals.AddOther,
            Net = totals.Net,
            SaleAmount = totals.SaleAmount ?? totals.OrderAmount,
            OrderAmount = totals.OrderAmount
        };
    }

    public static TransactionDocumentDto FromPurchaseForm(PurchaseEntryFormViewModelBase form, string? id = null)
    {
        if (!int.TryParse(form.BillNo, out var docNo))
            docNo = 0;

        return new TransactionDocumentDto
        {
            Id = id,
            DocType = ToApiType(form.EntryType),
            DocNo = docNo,
            FormattedDocNo = form.FormattedDocNo,
            BillDate = form.BillDate,
            Buyer = form.Buyer,
            Supplier = form.Supplier,
            SupplierDetails = form.SupplierDetails,
            Narration = form.Narration,
            Status = "open",
            Lines = form.LineItems.Select(MapLine).ToList(),
            Totals = new TransactionTotalsDto
            {
                TotQty = form.TotQty,
                Gross = form.Gross,
                Discount = form.Discount,
                SpDiscount = form.SpDiscount,
                AddOther = form.AddOther,
                Net = form.Net,
                OrderAmount = form.OrderAmount,
                SupplierReturn = form.SupplierReturn,
                PayableToSupplier = form.PayableToSupplier
            }
        };
    }

    public static void ApplyProductToForm(ProductDto product, AddProductViewModel vm)
    {
        vm.SetText("product_code", product.Code);
        vm.SetText("product_name", product.Name);
        vm.SetText("product_type", product.ProductType ?? product.Category ?? string.Empty);
        vm.SetText("product_main_group", product.ProductMainGroup ?? string.Empty);
        vm.SetText("product_sub_group", product.ProductSubGroup ?? string.Empty);
        vm.SetText("assembly_type", product.AssemblyType ?? string.Empty);
        vm.SetText("sale_uom", product.SaleUom ?? product.Unit ?? string.Empty);
        vm.SetText("purchase_uom", product.PurchaseUom ?? string.Empty);
        vm.SetText("size", product.Size ?? string.Empty);
        vm.SetText("length", product.Length ?? string.Empty);
        vm.SetText("manufactured_brand", product.Brand ?? string.Empty);
        vm.SetText("hsn_code", product.HsnCode ?? string.Empty);
        vm.SetText("sale_price", product.SalePrice.ToString("N2"));
        vm.SetText("purchase_price", product.PurchasePrice.ToString("N2"));
        vm.SetText("reorder_qty", product.ReorderQty.ToString("N0"));
        vm.SetText("min_order_qty", product.MinOrderQty.ToString("N0"));
        vm.SetText("cgst", product.Cgst.ToString("N0"));
        vm.SetText("sgst", product.Sgst.ToString("N0"));
        vm.SetText("igst", product.Igst.ToString("N0"));
        vm.SetBool("serial_applicable", product.SerialApplicable);
        vm.SetBool("gst_exempt", product.GstExempt);
        vm.SetBool("active_status", product.ActiveStatus);
        vm.SetText("product_image", product.ProductImage ?? string.Empty);
    }

    public static ProductDto FromAddProduct(AddProductViewModel vm) => new()
    {
        Code = vm.GetText("product_code").ToUpperInvariant(),
        Name = vm.GetText("product_name"),
        Category = vm.GetText("product_type"),
        Unit = string.IsNullOrWhiteSpace(vm.GetText("sale_uom")) ? "EA" : vm.GetText("sale_uom"),
        Size = vm.GetText("size"),
        Length = vm.GetText("length"),
        Brand = vm.GetText("manufactured_brand"),
        HsnCode = vm.GetText("hsn_code"),
        SalePrice = ParseDecimal(vm.GetText("sale_price")),
        PurchasePrice = ParseDecimal(vm.GetText("purchase_price")),
        ReorderQty = ParseDecimal(vm.GetText("reorder_qty")),
        MinOrderQty = ParseDecimal(vm.GetText("min_order_qty")),
        Cgst = ParseDecimal(vm.GetText("cgst")),
        Sgst = ParseDecimal(vm.GetText("sgst")),
        Igst = ParseDecimal(vm.GetText("igst")),
        ProductType = vm.GetText("product_type"),
        ProductMainGroup = vm.GetText("product_main_group"),
        ProductSubGroup = vm.GetText("product_sub_group"),
        AssemblyType = vm.GetText("assembly_type"),
        SaleUom = vm.GetText("sale_uom"),
        PurchaseUom = vm.GetText("purchase_uom"),
        SerialApplicable = vm.GetBool("serial_applicable"),
        GstExempt = vm.GetBool("gst_exempt"),
        ActiveStatus = vm.GetBool("active_status"),
        ProductImage = vm.GetText("product_image"),
        TaxType = "GST",
        TaxPercent = vm.GetBool("gst_exempt") ? "0" : "18"
    };

    public static AccountDto FromAddAccount(
        AddAccountMasterViewModel vm,
        string? id = null,
        string? accountType = null)
    {
        var customerCode = vm.GetText("customer_code");
        return new AccountDto
        {
            Id = id,
            AccountType = accountType ?? InferAccountType(vm.GetText("customer_type")),
            Code = string.IsNullOrWhiteSpace(customerCode)
                ? $"CUS-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}"
                : customerCode.ToUpperInvariant(),
            Name = vm.GetText("customer_name"),
            ContactPerson = vm.GetText("contact_person"),
            Designation = vm.GetText("designation"),
            Email = vm.GetText("email"),
            City = vm.GetText("city"),
            State = vm.GetText("state"),
            Country = vm.GetText("country"),
            Pincode = vm.GetText("pincode"),
            Address = vm.GetText("address"),
            MobileNo = vm.GetText("mobile_no"),
            ContactNo = vm.GetText("contact_no"),
            Fax = vm.GetText("fax"),
            CstNo = vm.GetText("cst_no"),
            TinNo = vm.GetText("tin_no"),
            PanNo = vm.GetText("pan_no"),
            GstNo = vm.GetText("gst_no"),
            ExciseNo = vm.GetText("excise_no"),
            CreditLimit = ParseDecimal(vm.GetText("credit_limit")),
            CreditDays = ParseDecimal(vm.GetText("credit_days")),
            CustomerType = vm.GetText("customer_type"),
            AnnualTurnover = vm.GetText("annual_turnover"),
            SourceEmployee = vm.GetText("source_employee"),
            ActiveStatus = vm.GetBool("active_status"),
            GstExempt = vm.GetBool("gst_exempt"),
            BillFormatAssignments = BuildBillFormatAssignments(vm)
        };
    }

    private static Dictionary<string, string> BuildBillFormatAssignments(AddAccountMasterViewModel vm)
    {
        var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        AssignFormat(map, "salesInvoice", vm.GetText("bill_format_sales_invoice"));
        AssignFormat(map, "salesOrder", vm.GetText("bill_format_sales_order"));
        AssignFormat(map, "salesReturn", vm.GetText("bill_format_sales_return"));
        AssignFormat(map, "deliveryChallan", vm.GetText("bill_format_delivery_challan"));
        AssignFormat(map, "purchaseInvoice", vm.GetText("bill_format_purchase_invoice"));
        AssignFormat(map, "purchaseOrder", vm.GetText("bill_format_purchase_order"));
        AssignFormat(map, "purchaseReturn", vm.GetText("bill_format_purchase_return"));
        AssignFormat(map, "grn", vm.GetText("bill_format_grn"));
        return map;
    }

    private static void AssignFormat(Dictionary<string, string> map, string key, string value)
    {
        var v = value?.Trim();
        if (string.IsNullOrWhiteSpace(v))
            return;
        map[key] = v.ToLowerInvariant();
    }

    public static void ApplyAccountToViewModel(AccountDto account, AddAccountMasterViewModel vm)
    {
        vm.SetAccountId(account.Id);
        vm.SetAccountType(account.AccountType);
        vm.SetText("customer_code", account.Code);
        vm.SetText("customer_name", account.Name);
        vm.SetText("contact_person", account.ContactPerson ?? string.Empty);
        vm.SetText("designation", account.Designation ?? string.Empty);
        vm.SetText("email", account.Email ?? string.Empty);
        vm.SetText("city", account.City ?? string.Empty);
        vm.SetText("state", account.State ?? string.Empty);
        vm.SetText("country", account.Country ?? string.Empty);
        vm.SetText("pincode", account.Pincode ?? string.Empty);
        vm.SetText("address", account.Address ?? string.Empty);
        vm.SetText("mobile_no", account.MobileNo ?? string.Empty);
        vm.SetText("contact_no", account.ContactNo ?? string.Empty);
        vm.SetText("fax", account.Fax ?? string.Empty);
        vm.SetText("cst_no", account.CstNo ?? string.Empty);
        vm.SetText("tin_no", account.TinNo ?? string.Empty);
        vm.SetText("pan_no", account.PanNo ?? string.Empty);
        vm.SetText("gst_no", account.GstNo ?? string.Empty);
        vm.SetText("excise_no", account.ExciseNo ?? string.Empty);
        vm.SetText("credit_limit", account.CreditLimit.ToString(CultureInfo.InvariantCulture));
        vm.SetText("credit_days", account.CreditDays.ToString(CultureInfo.InvariantCulture));
        vm.SetText("customer_type", account.CustomerType ?? string.Empty);
        vm.SetText("annual_turnover", account.AnnualTurnover ?? string.Empty);
        vm.SetText("source_employee", account.SourceEmployee ?? string.Empty);
        vm.SetBool("active_status", account.ActiveStatus);
        vm.SetBool("gst_exempt", account.GstExempt);
        vm.SetText("bill_format_sales_invoice", FormatAssignmentDisplay(account.BillFormatAssignments, "salesInvoice"));
        vm.SetText("bill_format_sales_order", FormatAssignmentDisplay(account.BillFormatAssignments, "salesOrder"));
        vm.SetText("bill_format_sales_return", FormatAssignmentDisplay(account.BillFormatAssignments, "salesReturn"));
        vm.SetText("bill_format_delivery_challan", FormatAssignmentDisplay(account.BillFormatAssignments, "deliveryChallan"));
        vm.SetText("bill_format_purchase_invoice", FormatAssignmentDisplay(account.BillFormatAssignments, "purchaseInvoice"));
        vm.SetText("bill_format_purchase_order", FormatAssignmentDisplay(account.BillFormatAssignments, "purchaseOrder"));
        vm.SetText("bill_format_purchase_return", FormatAssignmentDisplay(account.BillFormatAssignments, "purchaseReturn"));
        vm.SetText("bill_format_grn", FormatAssignmentDisplay(account.BillFormatAssignments, "grn"));
    }

    private static string FormatAssignmentDisplay(Dictionary<string, string> assignments, string key) =>
        assignments.TryGetValue(key, out var v) && !string.IsNullOrWhiteSpace(v) ? v : string.Empty;

    private static string InferAccountType(string? customerType) =>
        string.Equals(customerType, "Supplier", StringComparison.OrdinalIgnoreCase)
            ? "supplier"
            : "customer";

    private static TransactionLineDto MapLine(SalesLineItem line) => new()
    {
        Sr = line.Sr,
        ProductRetailCode = line.ProductRetailCode,
        ItemDescription = line.ItemDescription,
        Qty = line.Qty,
        Rate = line.Rate,
        SalesRate = line.SalesRate,
        DiscPercent = line.DiscPercent,
        DiscValue = line.DiscValue,
        TaxType = line.TaxType,
        TaxPercent = line.TaxPercent,
        Amount = line.Amount
    };

    private static decimal ParseDecimal(string? value) =>
        decimal.TryParse(value, out var d) ? d : 0;

    private static string Capitalize(string value) =>
        string.IsNullOrEmpty(value)
            ? value
            : char.ToUpper(value[0]) + value[1..].ToLowerInvariant();
}
