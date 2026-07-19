using System.Globalization;
using System.IO;
using System.Net.Http;
using System.Net.Sockets;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using IMS.Models;
using IMS.Reporting.Data;
using IMS.Services.Api.Dtos;

namespace IMS.Services.Api;

public static class ImsApiClient
{
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(30) };
    private static readonly HttpClient ConsolidationHttp = new() { Timeout = TimeSpan.FromSeconds(90) };
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        NumberHandling = JsonNumberHandling.AllowReadingFromString
    };

    public static JsonSerializerOptions SerializerOptions => JsonOptions;

    public static bool IsAvailable { get; private set; }

    public static void Initialize() => ApiConfiguration.LoadFromSettings();

    public static async Task<bool> CheckHealthAsync()
    {
        try
        {
            var health = await GetWithRetryAsync<HealthDto>("/api/health", maxAttempts: 2);
            IsAvailable = health?.Ok == true;
            return IsAvailable;
        }
        catch
        {
            IsAvailable = false;
            return false;
        }
    }

    public static void ApplyAuthToken(string? token)
    {
        var auth = string.IsNullOrWhiteSpace(token)
            ? null
            : new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        Http.DefaultRequestHeaders.Authorization = auth;
        ConsolidationHttp.DefaultRequestHeaders.Authorization = auth;
    }

    public static async Task<LoginResponseDto> LoginAsync(string loginId, string password)
    {
        using var response = await PostJsonWithRetryAsync(
            "/api/auth/login",
            new { loginId, password },
            maxAttempts: 5);
        await EnsureSuccessAsync(response);
        var result = await response.Content.ReadFromJsonAsync<LoginResponseDto>(JsonOptions)
                     ?? throw new ApiException("Login failed.");
        ApplyAuthToken(result.Token);
        IsAvailable = true;
        return result;
    }

    public static async Task<List<FinancialYearDto>> GetFinancialYearsAsync()
    {
        var years = await GetWithRetryAsync<List<FinancialYearDto>>("/api/financial-years");
        return years ?? [];
    }

    public static async Task<FinancialYearDto> CreateFinancialYearAsync(string financialYearName, DateTime startDate, DateTime endDate)
    {
        var body = new
        {
            financialYearName,
            startDate = startDate.ToString("o"),
            endDate = endDate.ToString("o")
        };
        return await PostAsync<FinancialYearDto>("/api/financial-years", body)
               ?? throw new ApiException("Failed to create financial year.");
    }

    public static async Task<YearEndResultDto> RunYearEndAsync(
        string fromYearId,
        string toFinancialYearName,
        DateTime toStartDate,
        DateTime toEndDate)
    {
        var body = new
        {
            fromYearId,
            toFinancialYearName,
            toStartDate = toStartDate.ToString("o"),
            toEndDate = toEndDate.ToString("o")
        };
        return await PostAsync<YearEndResultDto>("/api/financial-years/year-end", body)
               ?? throw new ApiException("Year-end closing failed.");
    }

    public static async Task DeleteFinancialYearAsync(string financialYearId)
    {
        using var response = await Http.DeleteAsync(Url($"/api/financial-years/{Uri.EscapeDataString(financialYearId)}"));
        await EnsureSuccessAsync(response);
    }

    public static async Task<LoginResponseDto> LoginAsync(string loginId, string password, string financialYearId)
    {
        using var response = await PostJsonWithRetryAsync(
            "/api/auth/login",
            new { loginId, password, financialYearId },
            maxAttempts: 5);
        await EnsureSuccessAsync(response);
        var result = await response.Content.ReadFromJsonAsync<LoginResponseDto>(JsonOptions)
                     ?? throw new ApiException("Login failed.");
        ApplyAuthToken(result.Token);
        IsAvailable = true;
        return result;
    }

    public static async Task<List<ProductDto>> GetProductsAsync() =>
        await GetAllPagedAsync<ProductDto>("/api/products");

    public static async Task<PagedResponse<ProductDto>> GetProductsPageAsync(
        int page,
        int limit,
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>
        {
            $"page={Math.Max(page, 1)}",
            $"limit={Math.Clamp(limit, 1, 10000)}"
        };

        if (!string.IsNullOrWhiteSpace(search))
            queryParts.Add($"search={Uri.EscapeDataString(search.Trim())}");

        using var response = await Http.GetAsync(
            Url($"/api/products?{string.Join("&", queryParts)}"),
            cancellationToken);
        await EnsureSuccessAsync(response);
        return await response.Content.ReadFromJsonAsync<PagedResponse<ProductDto>>(JsonOptions, cancellationToken)
               ?? new PagedResponse<ProductDto>();
    }

    private static async Task<PagedResponse<T>> GetMasterPageAsync<T>(
        string path,
        int page,
        int limit,
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        var queryParts = new List<string>
        {
            $"page={Math.Max(page, 1)}",
            $"limit={Math.Clamp(limit, 1, 10000)}"
        };

        if (!string.IsNullOrWhiteSpace(search))
            queryParts.Add($"search={Uri.EscapeDataString(search.Trim())}");

        using var response = await Http.GetAsync(
            Url($"{path}?{string.Join("&", queryParts)}"),
            cancellationToken);
        await EnsureSuccessAsync(response);
        return await response.Content.ReadFromJsonAsync<PagedResponse<T>>(JsonOptions, cancellationToken)
               ?? new PagedResponse<T>();
    }

    public static async Task<List<ProductLookupDto>> SearchProductsAsync(
        string term,
        int limit = 40,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(term))
            return [];

        var encoded = Uri.EscapeDataString(term.Trim());
        using var response = await Http.GetAsync(
            Url($"/api/products/search?q={encoded}&limit={limit}"),
            cancellationToken);
        await EnsureSuccessAsync(response);
        var payload = await response.Content.ReadFromJsonAsync<ProductSearchResponseDto>(JsonOptions, cancellationToken);
        return payload?.Items ?? [];
    }

    public static async Task<ProductLookupDto?> LookupProductAsync(string term)
    {
        if (string.IsNullOrWhiteSpace(term))
            return null;
        var encoded = Uri.EscapeDataString(term.Trim());
        return await GetAsync<ProductLookupDto>($"/api/products/lookup?q={encoded}");
    }

    public static async Task<ProductDto?> GetProductByCodeAsync(string code) =>
        await GetAsync<ProductDto>($"/api/products/by-code/{Uri.EscapeDataString(code)}");

    public static async Task<ProductDto> CreateProductAsync(ProductDto product) =>
        await PostAsync<ProductDto>("/api/products", product)
        ?? throw new ApiException("Failed to create product.");

    public static async Task<ProductDto> UpdateProductByCodeAsync(string originalCode, ProductDto product) =>
        await PutAsync<ProductDto>($"/api/products/by-code/{Uri.EscapeDataString(originalCode)}", product)
        ?? throw new ApiException("Failed to update product.");

    public static async Task DeleteProductByCodeAsync(string code) =>
        await DeleteAsync($"/api/products/by-code/{Uri.EscapeDataString(code)}");

    public static Task<List<AccountDto>> GetAccountsAsync(string? type = null) =>
        GetAllPagedAsync<AccountDto>(
            "/api/accounts",
            string.IsNullOrEmpty(type) ? null : [("type", type)]);

    public static async Task<List<string>> GetAccountNamesAsync(string type = "customer")
    {
        var names = await GetAsync<List<string>>($"/api/accounts/names?type={type}");
        return names ?? ["— Select —", "Walk In"];
    }

    public static async Task<AccountDto?> GetAccountByCodeAsync(string code) =>
        await GetAsync<AccountDto>($"/api/accounts/by-code/{Uri.EscapeDataString(code)}");

    public static async Task<AccountDto> CreateAccountAsync(AccountDto account) =>
        await PostAsync<AccountDto>("/api/accounts", account)
        ?? throw new ApiException("Failed to create account.");

    public static async Task<AccountDto> UpdateAccountByCodeAsync(string originalCode, AccountDto account) =>
        await PutAsync<AccountDto>($"/api/accounts/by-code/{Uri.EscapeDataString(originalCode)}", account)
        ?? throw new ApiException("Failed to update account.");

    public static async Task DeleteAccountByCodeAsync(string code) =>
        await DeleteAsync($"/api/accounts/by-code/{Uri.EscapeDataString(code)}");

    public static Task<List<TransactionDocumentDto>> GetDocumentsAsync(string docType) =>
        GetAllPagedAsync<TransactionDocumentDto>("/api/documents", [("type", docType)]);

    public static async Task<NextDocNumberDto> GetNextDocumentNumberAsync(string docType) =>
        await GetAsync<NextDocNumberDto>($"/api/documents/next-number?type={docType}")
        ?? throw new ApiException("Failed to get next document number.");

    public static async Task<(List<SalesOrderDto> Items, int Total)> GetSalesOrdersPageAsync(
        string? search = null,
        string? status = null,
        int page = 1,
        int limit = 25,
        string? sort = null,
        string? sortDir = null)
    {
        var queryParts = new List<string>
        {
            $"page={Math.Max(page, 1)}",
            $"limit={Math.Clamp(limit, 1, 500)}"
        };
        if (!string.IsNullOrWhiteSpace(search))
            queryParts.Add($"search={Uri.EscapeDataString(search.Trim())}");
        if (!string.IsNullOrWhiteSpace(status))
            queryParts.Add($"status={Uri.EscapeDataString(status.Trim())}");
        if (!string.IsNullOrWhiteSpace(sort))
            queryParts.Add($"sort={Uri.EscapeDataString(sort.Trim())}");
        if (!string.IsNullOrWhiteSpace(sortDir))
            queryParts.Add($"sortDir={Uri.EscapeDataString(sortDir.Trim())}");
        var response = await GetAsync<PagedResponse<SalesOrderDto>>($"/api/sales-orders?{string.Join("&", queryParts)}");
        return (response?.Items ?? [], response?.Total ?? 0);
    }

    public static Task<List<SalesOrderDto>> GetSalesOrdersAsync(string? search = null, string? status = null) =>
        GetAllPagedAsync<SalesOrderDto>("/api/sales-orders", BuildListQueryParams(search, status));

    public static async Task<SalesOrderStatsDto?> GetSalesOrderStatsAsync() =>
        await GetAsync<SalesOrderStatsDto>("/api/sales-orders/stats");

    public static async Task<NextDocNumberDto> GetNextSalesOrderNoAsync(string soPrefix = "SO")
    {
        var encoded = Uri.EscapeDataString(soPrefix.Trim());
        return await GetAsync<NextDocNumberDto>($"/api/sales-orders/next-no?prefix={encoded}")
            ?? throw new ApiException("Failed to get next sales order number.");
    }

    public static async Task<SalesOrderDto?> GetSalesOrderByNoAsync(int docNo, string soPrefix = "SO")
    {
        var encoded = Uri.EscapeDataString(soPrefix.Trim());
        return await GetAsync<SalesOrderDto>($"/api/sales-orders/by-no/{docNo}?prefix={encoded}");
    }

    public static async Task<SalesOrderDto?> GetSalesOrderByFormattedAsync(string formattedDocNo) =>
        await GetAsync<SalesOrderDto>($"/api/sales-orders/by-formatted/{Uri.EscapeDataString(formattedDocNo.Trim())}");

    public static async Task<PendingSalesOrdersResponseDto?> GetPendingSalesOrdersForDeliveryAsync(string customer) =>
        await GetAsync<PendingSalesOrdersResponseDto>(
            $"/api/sales-orders/pending-for-delivery?customer={Uri.EscapeDataString(customer.Trim())}");

    public static async Task<PendingDeliveryLinesResponseDto?> GetPendingDeliveryLinesAsync(
        PendingDeliveryLinesRequestDto request) =>
        await PostAsync<PendingDeliveryLinesResponseDto>("/api/sales-orders/pending-delivery-lines", request);

    public static async Task<PendingNumberedDocsResponseDto?> GetPendingDeliveryChallansForInvoiceAsync(string customer) =>
        await GetConsolidationAsync<PendingNumberedDocsResponseDto>(
            $"/api/delivery-challans/pending-for-invoice?customer={Uri.EscapeDataString(customer.Trim())}");

    public static async Task<PendingConsolidationLinesResponseDto?> GetPendingInvoiceLinesFromDeliveryChallansAsync(
        PendingConsolidationLinesRequestDto request) =>
        await PostConsolidationAsync<PendingConsolidationLinesResponseDto>("/api/delivery-challans/pending-invoice-lines", request);

    public static async Task<PendingNumberedDocsResponseDto?> GetPendingPurchaseOrdersForReceiptAsync(string supplier) =>
        await GetConsolidationAsync<PendingNumberedDocsResponseDto>(
            $"/api/purchase-orders/pending-for-receipt?supplier={Uri.EscapeDataString(supplier.Trim())}");

    public static async Task<PendingConsolidationLinesResponseDto?> GetPendingReceiptLinesFromPurchaseOrdersAsync(
        PendingConsolidationLinesRequestDto request) =>
        await PostConsolidationAsync<PendingConsolidationLinesResponseDto>("/api/purchase-orders/pending-receipt-lines", request);

    public static async Task<PendingNumberedDocsResponseDto?> GetPendingGrnsForInvoiceAsync(string supplier) =>
        await GetConsolidationAsync<PendingNumberedDocsResponseDto>(
            $"/api/grns/pending-for-invoice?supplier={Uri.EscapeDataString(supplier.Trim())}");

    public static async Task<PendingConsolidationLinesResponseDto?> GetPendingPurchaseInvoiceLinesFromGrnsAsync(
        PendingConsolidationLinesRequestDto request) =>
        await PostConsolidationAsync<PendingConsolidationLinesResponseDto>("/api/grns/pending-invoice-lines", request);

    public static async Task<SalesOrderDto> CreateSalesOrderAsync(SalesOrderDto order) =>
        await PostAsync<SalesOrderDto>("/api/sales-orders", order)
        ?? throw new ApiException("Failed to create sales order.");

    public static async Task<SalesOrderDto> UpdateSalesOrderByNoAsync(int originalDocNo, SalesOrderDto order, string? originalPrefix = null)
    {
        var prefix = Uri.EscapeDataString((originalPrefix ?? order.SoPrefix ?? "SO").Trim());
        return await PutAsync<SalesOrderDto>($"/api/sales-orders/by-no/{originalDocNo}?prefix={prefix}", order)
            ?? throw new ApiException("Failed to update sales order.");
    }

    public static async Task<SalesOrderDto> UpdateSalesOrderByIdAsync(string id, SalesOrderDto order) =>
        await PutAsync<SalesOrderDto>($"/api/sales-orders/{id}", order)
        ?? throw new ApiException("Failed to update sales order.");

    public static async Task DeleteSalesOrderByNoAsync(int docNo, string soPrefix = "SO")
    {
        var encoded = Uri.EscapeDataString(soPrefix.Trim());
        await DeleteAsync($"/api/sales-orders/by-no/{docNo}?prefix={encoded}");
    }

    private static string SalesDocRoute(SalesEntryType type) => type switch
    {
        SalesEntryType.DeliveryChallan => "/api/delivery-challans",
        SalesEntryType.SalesInvoice => "/api/sales-invoices",
        SalesEntryType.SalesReturn => "/api/sales-returns",
        _ => throw new ArgumentOutOfRangeException(nameof(type))
    };

    public static async Task<(List<NumberedSalesDocumentDto> Items, int Total)> GetSalesDocumentsPageAsync(
        SalesEntryType type,
        string? search = null,
        string? status = null,
        int page = 1,
        int limit = 500,
        string? sort = null,
        string? sortDir = null)
    {
        var queryParts = new List<string>
        {
            $"page={Math.Max(page, 1)}",
            $"limit={Math.Clamp(limit, 1, 10000)}"
        };
        if (!string.IsNullOrWhiteSpace(search))
            queryParts.Add($"search={Uri.EscapeDataString(search.Trim())}");
        if (!string.IsNullOrWhiteSpace(status))
            queryParts.Add($"status={Uri.EscapeDataString(status.Trim())}");
        if (!string.IsNullOrWhiteSpace(sort))
            queryParts.Add($"sort={Uri.EscapeDataString(sort.Trim())}");
        if (!string.IsNullOrWhiteSpace(sortDir))
            queryParts.Add($"sortDir={Uri.EscapeDataString(sortDir.Trim())}");
        var response = await GetAsync<PagedResponse<NumberedSalesDocumentDto>>(
            $"{SalesDocRoute(type)}?{string.Join("&", queryParts)}");
        return (response?.Items ?? [], response?.Total ?? 0);
    }

    public static Task<List<NumberedSalesDocumentDto>> GetSalesDocumentsAsync(
        SalesEntryType type,
        string? search = null,
        string? status = null) =>
        GetAllPagedAsync<NumberedSalesDocumentDto>(SalesDocRoute(type), BuildListQueryParams(search, status));

    public static async Task<SalesDocumentStatsDto?> GetSalesDocumentStatsAsync(SalesEntryType type) =>
        await GetAsync<SalesDocumentStatsDto>($"{SalesDocRoute(type)}/stats");

    public static async Task<NextDocNumberDto> GetNextSalesDocumentNoAsync(SalesEntryType type, string docPrefix = "SO")
    {
        var encoded = Uri.EscapeDataString(docPrefix.Trim());
        return await GetAsync<NextDocNumberDto>($"{SalesDocRoute(type)}/next-no?prefix={encoded}")
            ?? throw new ApiException("Failed to get next document number.");
    }

    public static async Task<NumberedSalesDocumentDto?> GetSalesDocumentByNoAsync(
        SalesEntryType type,
        int docNo,
        string docPrefix = "SO") =>
        await GetAsync<NumberedSalesDocumentDto>(
            $"{SalesDocRoute(type)}/by-no/{docNo}?prefix={Uri.EscapeDataString(docPrefix.Trim())}");

    public static async Task<NumberedSalesDocumentDto?> GetSalesDocumentByFormattedAsync(
        SalesEntryType type,
        string formattedDocNo) =>
        await GetAsync<NumberedSalesDocumentDto>(
            $"{SalesDocRoute(type)}/by-formatted/{Uri.EscapeDataString(formattedDocNo.Trim())}");

    public static async Task<NumberedSalesDocumentDto> CreateSalesDocumentAsync(
        SalesEntryType type,
        NumberedSalesDocumentDto document) =>
        await PostAsync<NumberedSalesDocumentDto>(SalesDocRoute(type), document)
        ?? throw new ApiException("Failed to create document.");

    public static async Task<NumberedSalesDocumentDto> UpdateSalesDocumentByNoAsync(
        SalesEntryType type,
        int originalDocNo,
        NumberedSalesDocumentDto document,
        string? originalPrefix = null)
    {
        var prefix = Uri.EscapeDataString((originalPrefix ?? document.DocPrefix ?? "SO").Trim());
        return await PutAsync<NumberedSalesDocumentDto>(
            $"{SalesDocRoute(type)}/by-no/{originalDocNo}?prefix={prefix}", document)
            ?? throw new ApiException("Failed to update document.");
    }

    public static async Task<NumberedSalesDocumentDto> UpdateSalesDocumentByIdAsync(
        SalesEntryType type,
        string id,
        NumberedSalesDocumentDto document) =>
        await PutAsync<NumberedSalesDocumentDto>($"{SalesDocRoute(type)}/{id}", document)
        ?? throw new ApiException("Failed to update document.");

    public static async Task DeleteSalesDocumentByNoAsync(SalesEntryType type, int docNo, string docPrefix = "SO") =>
        await DeleteAsync(
            $"{SalesDocRoute(type)}/by-no/{docNo}?prefix={Uri.EscapeDataString(docPrefix.Trim())}");

    private static string PurchaseDocRoute(PurchaseEntryType type) => type switch
    {
        PurchaseEntryType.PurchaseOrder => "/api/purchase-orders",
        PurchaseEntryType.Grn => "/api/grns",
        PurchaseEntryType.PurchaseInvoice => "/api/purchase-invoices",
        PurchaseEntryType.PurchaseReturn => "/api/purchase-returns",
        _ => throw new ArgumentOutOfRangeException(nameof(type))
    };

    public static async Task<(List<NumberedPurchaseDocumentDto> Items, int Total)> GetPurchaseDocumentsPageAsync(
        PurchaseEntryType type,
        string? search = null,
        string? status = null,
        int page = 1,
        int limit = 500)
    {
        var queryParts = new List<string>
        {
            $"page={Math.Max(page, 1)}",
            $"limit={Math.Clamp(limit, 1, 10000)}"
        };
        if (!string.IsNullOrWhiteSpace(search))
            queryParts.Add($"search={Uri.EscapeDataString(search.Trim())}");
        if (!string.IsNullOrWhiteSpace(status))
            queryParts.Add($"status={Uri.EscapeDataString(status.Trim())}");
        var response = await GetAsync<PagedResponse<NumberedPurchaseDocumentDto>>(
            $"{PurchaseDocRoute(type)}?{string.Join("&", queryParts)}");
        return (response?.Items ?? [], response?.Total ?? 0);
    }

    public static Task<List<NumberedPurchaseDocumentDto>> GetPurchaseDocumentsAsync(
        PurchaseEntryType type,
        string? search = null,
        string? status = null) =>
        GetAllPagedAsync<NumberedPurchaseDocumentDto>(PurchaseDocRoute(type), BuildListQueryParams(search, status));

    public static async Task<SalesDocumentStatsDto?> GetPurchaseDocumentStatsAsync(PurchaseEntryType type) =>
        await GetAsync<SalesDocumentStatsDto>($"{PurchaseDocRoute(type)}/stats");

    public static async Task<NextDocNumberDto> GetNextPurchaseDocumentNoAsync(PurchaseEntryType type, string docPrefix = "PO")
    {
        var encoded = Uri.EscapeDataString(docPrefix.Trim());
        return await GetAsync<NextDocNumberDto>($"{PurchaseDocRoute(type)}/next-no?prefix={encoded}")
            ?? throw new ApiException("Failed to get next document number.");
    }

    public static async Task<NumberedPurchaseDocumentDto?> GetPurchaseDocumentByNoAsync(
        PurchaseEntryType type,
        int docNo,
        string docPrefix = "PO") =>
        await GetAsync<NumberedPurchaseDocumentDto>(
            $"{PurchaseDocRoute(type)}/by-no/{docNo}?prefix={Uri.EscapeDataString(docPrefix.Trim())}");

    public static async Task<NumberedPurchaseDocumentDto?> GetPurchaseDocumentByFormattedAsync(
        PurchaseEntryType type,
        string formattedDocNo) =>
        await GetAsync<NumberedPurchaseDocumentDto>(
            $"{PurchaseDocRoute(type)}/by-formatted/{Uri.EscapeDataString(formattedDocNo.Trim())}");

    public static async Task<NumberedPurchaseDocumentDto> CreatePurchaseDocumentAsync(
        PurchaseEntryType type,
        NumberedPurchaseDocumentDto document) =>
        await PostAsync<NumberedPurchaseDocumentDto>(PurchaseDocRoute(type), document)
        ?? throw new ApiException("Failed to create document.");

    public static async Task<NumberedPurchaseDocumentDto> UpdatePurchaseDocumentByNoAsync(
        PurchaseEntryType type,
        int originalDocNo,
        NumberedPurchaseDocumentDto document,
        string? originalPrefix = null)
    {
        var prefix = Uri.EscapeDataString((originalPrefix ?? document.DocPrefix ?? "PO").Trim());
        return await PutAsync<NumberedPurchaseDocumentDto>(
            $"{PurchaseDocRoute(type)}/by-no/{originalDocNo}?prefix={prefix}", document)
            ?? throw new ApiException("Failed to update document.");
    }

    public static async Task<NumberedPurchaseDocumentDto> UpdatePurchaseDocumentByIdAsync(
        PurchaseEntryType type,
        string id,
        NumberedPurchaseDocumentDto document) =>
        await PutAsync<NumberedPurchaseDocumentDto>($"{PurchaseDocRoute(type)}/{id}", document)
        ?? throw new ApiException("Failed to update document.");

    public static async Task DeletePurchaseDocumentByNoAsync(PurchaseEntryType type, int docNo, string docPrefix = "PO") =>
        await DeleteAsync(
            $"{PurchaseDocRoute(type)}/by-no/{docNo}?prefix={Uri.EscapeDataString(docPrefix.Trim())}");

    public static async Task<TransactionDocumentDto> SaveDocumentAsync(TransactionDocumentDto document)
    {
        if (!string.IsNullOrEmpty(document.Id))
        {
            return await PutAsync<TransactionDocumentDto>($"/api/documents/{document.Id}", document)
                   ?? throw new ApiException("Failed to update document.");
        }

        return await PostAsync<TransactionDocumentDto>("/api/documents", document)
               ?? throw new ApiException("Failed to save document.");
    }

    public static async Task<BomDto?> GetBomByProductCodeAsync(string productCode)
    {
        try
        {
            return await GetAsync<BomDto>($"/api/boms/by-product/{Uri.EscapeDataString(productCode)}");
        }
        catch (ApiException ex) when (ex.Message.StartsWith("404", StringComparison.Ordinal))
        {
            return null;
        }
    }

    public static async Task<BomDto> UpsertBomByProductCodeAsync(string productCode, BomDto bom) =>
        await PutAsync<BomDto>($"/api/boms/by-product/{Uri.EscapeDataString(productCode)}", bom)
        ?? throw new InvalidOperationException("BOM save returned no data.");

    public static Task<List<BomDto>> GetBomsAsync(string? search = null) =>
        GetAllPagedAsync<BomDto>("/api/boms", BuildListQueryParams(search));

    public static Task<List<ProductionOrderDto>> GetProductionOrdersAsync(string? search = null, string? status = null) =>
        GetAllPagedAsync<ProductionOrderDto>("/api/production-orders", BuildListQueryParams(search, status));

    public static async Task<ProductionOrderStatsDto?> GetProductionOrderStatsAsync() =>
        await GetAsync<ProductionOrderStatsDto>("/api/production-orders/stats");

    public static async Task<int> GetNextProductionNoAsync()
    {
        var result = await GetAsync<NextProductionNoDto>("/api/production-orders/next-no");
        return result?.ProductionNo ?? 1;
    }

    public static async Task<ProductionOrderDto?> GetProductionOrderByNoAsync(int productionNo) =>
        await GetAsync<ProductionOrderDto>($"/api/production-orders/by-no/{productionNo}");

    public static async Task<ProductionMaterialTrackingDto?> GetProductionMaterialTrackingAsync(int productionNo) =>
        await GetAsync<ProductionMaterialTrackingDto>(
            $"/api/production-orders/by-no/{productionNo}/material-tracking");

    public static async Task<ProductionMaterialTrackingDto?> RecordProductionMaterialStageAsync(
        int productionNo,
        ProductionMaterialStageRequestDto request) =>
        await PostAsync<ProductionMaterialTrackingDto>(
            $"/api/production-orders/by-no/{productionNo}/material-stage",
            request);

    public static async Task<ProductionBomExpandDto?> ExpandProductionBomAsync(string productCode, decimal produceQty) =>
        await PostAsync<ProductionBomExpandDto>(
            "/api/production-orders/expand-bom",
            new { productCode, produceQty });

    public static async Task<ProductionOrderDto> CreateProductionOrderAsync(ProductionOrderDto order) =>
        await PostAsync<ProductionOrderDto>("/api/production-orders", order)
        ?? throw new InvalidOperationException("Production order create returned no data.");

    public static async Task<ProductionOrderDto> UpdateProductionOrderAsync(int productionNo, ProductionOrderDto order) =>
        await PutAsync<ProductionOrderDto>($"/api/production-orders/by-no/{productionNo}", order)
        ?? throw new InvalidOperationException("Production order update returned no data.");

    public static async Task DeleteProductionOrderByNoAsync(int productionNo) =>
        await DeleteAsync($"/api/production-orders/by-no/{productionNo}");

    public static Task<List<StockTransferDto>> GetStockTransfersAsync(string? search = null, string? status = null) =>
        GetAllPagedAsync<StockTransferDto>("/api/stock-transfers", BuildListQueryParams(search, status));

    public static async Task<StockTransferDto> CreateStockTransferAsync(StockTransferDto transfer) =>
        await PostAsync<StockTransferDto>("/api/stock-transfers", transfer)
        ?? throw new ApiException("Failed to save stock transfer.");

    public static async Task<decimal> GetStockAvailabilityAsync(string? godown, string? productCode)
    {
        var query = $"?godown={Uri.EscapeDataString(godown ?? "Counter")}&productCode={Uri.EscapeDataString(productCode ?? "")}";
        var result = await GetAsync<StockAvailabilityDto>($"/api/stock-transfers/stock-availability{query}");
        return result?.AvailableQty ?? 0;
    }

    public static async Task<List<string>> GetWarehouseNamesAsync()
    {
        var response = await GetAsync<WarehouseListResponse>("/api/warehouses");
        var items = response?.Items ?? [];
        if (items.Count == 0)
            return ["Counter", "Main"];
        return items
            .Where(w => w.ActiveStatus)
            .Select(w => w.Code)
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .ToList();
    }

    public static Task<List<WarehouseDto>> GetWarehousesAsync(string? search = null) =>
        GetAllPagedAsync<WarehouseDto>("/api/warehouses", BuildListQueryParams(search));

    public static async Task<WarehouseDto?> GetWarehouseByCodeAsync(string code) =>
        await GetAsync<WarehouseDto>($"/api/warehouses/by-code/{Uri.EscapeDataString(code)}");

    public static async Task<WarehouseDto> CreateWarehouseAsync(WarehouseDto item) =>
        await PostAsync<WarehouseDto>("/api/warehouses", item)
        ?? throw new ApiException("Failed to create warehouse.");

    public static async Task<WarehouseDto> UpdateWarehouseByCodeAsync(string originalCode, WarehouseDto item) =>
        await PutAsync<WarehouseDto>($"/api/warehouses/by-code/{Uri.EscapeDataString(originalCode)}", item)
        ?? throw new ApiException("Failed to update warehouse.");

    public static async Task DeleteWarehouseByCodeAsync(string code) =>
        await DeleteAsync($"/api/warehouses/by-code/{Uri.EscapeDataString(code)}");

    public static async Task<DashboardDto?> GetDashboardAsync() =>
        await GetAsync<DashboardDto>("/api/dashboard");

    public static async Task RecalculateStockAsync() =>
        _ = await PostAsync<Dictionary<string, object>>("/api/reports/recalculate-stock", new { });

    public static async Task<OpeningStockReportDto?> GetOpeningStockReportAsync(
        string? productCode = null,
        string? productName = null,
        string? mainName = null,
        string? productType = null,
        DateTime? asOnDate = null)
    {
        var query = new List<string>();
        if (!string.IsNullOrWhiteSpace(productCode))
            query.Add($"productCode={Uri.EscapeDataString(productCode.Trim())}");
        if (!string.IsNullOrWhiteSpace(productName))
            query.Add($"productName={Uri.EscapeDataString(productName.Trim())}");
        if (!string.IsNullOrWhiteSpace(mainName) && !string.Equals(mainName, "(All)", StringComparison.OrdinalIgnoreCase))
            query.Add($"mainName={Uri.EscapeDataString(mainName.Trim())}");
        if (!string.IsNullOrWhiteSpace(productType) && !string.Equals(productType, "(All)", StringComparison.OrdinalIgnoreCase))
            query.Add($"productType={Uri.EscapeDataString(productType.Trim())}");
        if (asOnDate.HasValue)
            query.Add($"asOnDate={Uri.EscapeDataString(asOnDate.Value.ToString("yyyy-MM-dd"))}");

        var qs = query.Count > 0 ? "?" + string.Join("&", query) : string.Empty;
        return await GetAsync<OpeningStockReportDto>($"/api/reports/opening-stock{qs}");
    }

    public static async Task<ClosingStockReportDto?> GetClosingStockReportAsync(
        string? productCode = null,
        string? productName = null,
        string? itemDescription = null,
        string? mainName = null,
        string? productType = null,
        string? godown = null,
        string? batchNo = null,
        DateTime? dateFrom = null,
        DateTime? dateTo = null)
    {
        var query = new List<string>();
        if (!string.IsNullOrWhiteSpace(productCode))
            query.Add($"productCode={Uri.EscapeDataString(productCode.Trim())}");
        if (!string.IsNullOrWhiteSpace(productName))
            query.Add($"productName={Uri.EscapeDataString(productName.Trim())}");
        if (!string.IsNullOrWhiteSpace(itemDescription))
            query.Add($"itemDescription={Uri.EscapeDataString(itemDescription.Trim())}");
        if (!string.IsNullOrWhiteSpace(mainName) && !string.Equals(mainName, "(All)", StringComparison.OrdinalIgnoreCase))
            query.Add($"mainName={Uri.EscapeDataString(mainName.Trim())}");
        if (!string.IsNullOrWhiteSpace(productType) && !string.Equals(productType, "(All)", StringComparison.OrdinalIgnoreCase))
            query.Add($"productType={Uri.EscapeDataString(productType.Trim())}");
        if (!string.IsNullOrWhiteSpace(godown) && !string.Equals(godown, "ALL", StringComparison.OrdinalIgnoreCase))
            query.Add($"godown={Uri.EscapeDataString(godown.Trim())}");
        if (!string.IsNullOrWhiteSpace(batchNo))
            query.Add($"batchNo={Uri.EscapeDataString(batchNo.Trim())}");
        if (dateFrom.HasValue)
            query.Add($"dateFrom={Uri.EscapeDataString(dateFrom.Value.ToString("yyyy-MM-dd"))}");
        if (dateTo.HasValue)
            query.Add($"dateTo={Uri.EscapeDataString(dateTo.Value.ToString("yyyy-MM-dd"))}");

        var qs = query.Count > 0 ? "?" + string.Join("&", query) : string.Empty;
        return await GetAsync<ClosingStockReportDto>($"/api/reports/closing-stock{qs}");
    }

    public static async Task<List<LedgerAccountOptionDto>> GetLedgerAccountsAsync()
    {
        var response = await GetAsync<LedgerAccountsListDto>("/api/reports/ledger-accounts");
        return response?.Accounts ?? [];
    }

    public static async Task<LedgerReportDto?> GetLedgerReportAsync(
        string accountCode,
        DateTime? dateFrom = null,
        DateTime? dateTo = null)
    {
        var query = new List<string>
        {
            $"accountCode={Uri.EscapeDataString(accountCode.Trim())}"
        };
        if (dateFrom.HasValue)
            query.Add($"dateFrom={Uri.EscapeDataString(dateFrom.Value.ToString("yyyy-MM-dd"))}");
        if (dateTo.HasValue)
            query.Add($"dateTo={Uri.EscapeDataString(dateTo.Value.ToString("yyyy-MM-dd"))}");

        return await GetAsync<LedgerReportDto>($"/api/reports/ledger?{string.Join("&", query)}");
    }

    public static async Task<TrialBalanceReportDto?> GetTrialBalanceReportAsync(
        DateTime? dateFrom = null,
        DateTime? dateTo = null,
        bool includeZero = false)
    {
        var query = new List<string>();
        if (dateFrom.HasValue)
            query.Add($"dateFrom={Uri.EscapeDataString(dateFrom.Value.ToString("yyyy-MM-dd"))}");
        if (dateTo.HasValue)
            query.Add($"dateTo={Uri.EscapeDataString(dateTo.Value.ToString("yyyy-MM-dd"))}");
        if (includeZero)
            query.Add("includeZero=true");

        var qs = query.Count > 0 ? "?" + string.Join("&", query) : string.Empty;
        return await GetConsolidationAsync<TrialBalanceReportDto>($"/api/reports/trial-balance{qs}");
    }

    public static async Task<ReorderLevelReportDto?> GetReorderLevelReportAsync(
        string? productCode = null,
        string? productName = null,
        bool includeZero = false)
    {
        var query = new List<string>();
        if (!string.IsNullOrWhiteSpace(productCode))
            query.Add($"productCode={Uri.EscapeDataString(productCode.Trim())}");
        if (!string.IsNullOrWhiteSpace(productName))
            query.Add($"productName={Uri.EscapeDataString(productName.Trim())}");
        if (includeZero)
            query.Add("includeZero=true");

        var qs = query.Count > 0 ? "?" + string.Join("&", query) : string.Empty;
        return await GetAsync<ReorderLevelReportDto>($"/api/reports/reorder-level{qs}");
    }

    public static async Task<StockMovementReportDto?> GetStockMovementReportAsync(
        DateTime? dateFrom = null,
        DateTime? dateTo = null,
        string? productCode = null,
        string? godown = null,
        string? movementType = null)
    {
        var query = new List<string>();
        if (dateFrom.HasValue)
            query.Add($"dateFrom={Uri.EscapeDataString(dateFrom.Value.ToString("yyyy-MM-dd"))}");
        if (dateTo.HasValue)
            query.Add($"dateTo={Uri.EscapeDataString(dateTo.Value.ToString("yyyy-MM-dd"))}");
        if (!string.IsNullOrWhiteSpace(productCode))
            query.Add($"productCode={Uri.EscapeDataString(productCode.Trim())}");
        if (!string.IsNullOrWhiteSpace(godown))
            query.Add($"godown={Uri.EscapeDataString(godown.Trim())}");
        if (!string.IsNullOrWhiteSpace(movementType) && !string.Equals(movementType, "All", StringComparison.OrdinalIgnoreCase))
            query.Add($"movementType={Uri.EscapeDataString(movementType.Trim())}");

        var qs = query.Count > 0 ? "?" + string.Join("&", query) : string.Empty;
        return await GetAsync<StockMovementReportDto>($"/api/reports/stock-movement{qs}");
    }

    public static async Task<StockDetailsSummaryReportDto?> GetStockDetailsSummaryReportAsync(
        string? productCode = null,
        string? productName = null,
        string? mainName = null,
        string? productType = null,
        bool includeZero = false)
    {
        var query = new List<string>();
        if (!string.IsNullOrWhiteSpace(productCode))
            query.Add($"productCode={Uri.EscapeDataString(productCode.Trim())}");
        if (!string.IsNullOrWhiteSpace(productName))
            query.Add($"productName={Uri.EscapeDataString(productName.Trim())}");
        if (!string.IsNullOrWhiteSpace(mainName) && !string.Equals(mainName, "(All)", StringComparison.OrdinalIgnoreCase))
            query.Add($"mainName={Uri.EscapeDataString(mainName.Trim())}");
        if (!string.IsNullOrWhiteSpace(productType) && !string.Equals(productType, "(All)", StringComparison.OrdinalIgnoreCase))
            query.Add($"productType={Uri.EscapeDataString(productType.Trim())}");
        if (includeZero)
            query.Add("includeZero=true");

        var qs = query.Count > 0 ? "?" + string.Join("&", query) : string.Empty;
        return await GetAsync<StockDetailsSummaryReportDto>($"/api/reports/stock-details-summary{qs}");
    }

    public static async Task<ProfitAnalysisReportDto?> GetProfitAnalysisReportAsync(
        string? productCode = null,
        string? productName = null,
        string? mainName = null,
        DateTime? dateFrom = null,
        DateTime? dateTo = null)
    {
        var query = new List<string>();
        if (!string.IsNullOrWhiteSpace(productCode))
            query.Add($"productCode={Uri.EscapeDataString(productCode.Trim())}");
        if (!string.IsNullOrWhiteSpace(productName))
            query.Add($"productName={Uri.EscapeDataString(productName.Trim())}");
        if (!string.IsNullOrWhiteSpace(mainName) && !string.Equals(mainName, "(All)", StringComparison.OrdinalIgnoreCase))
            query.Add($"mainName={Uri.EscapeDataString(mainName.Trim())}");
        if (dateFrom.HasValue)
            query.Add($"dateFrom={Uri.EscapeDataString(dateFrom.Value.ToString("yyyy-MM-dd"))}");
        if (dateTo.HasValue)
            query.Add($"dateTo={Uri.EscapeDataString(dateTo.Value.ToString("yyyy-MM-dd"))}");

        var qs = query.Count > 0 ? "?" + string.Join("&", query) : string.Empty;
        return await GetAsync<ProfitAnalysisReportDto>($"/api/reports/profit-analysis{qs}");
    }

    private static async Task<FinancialStatementReportDto?> GetFinancialStatementReportAsync(
        string endpoint,
        DateTime? dateFrom = null,
        DateTime? dateTo = null)
    {
        var query = new List<string>();
        if (dateFrom.HasValue)
            query.Add($"dateFrom={Uri.EscapeDataString(dateFrom.Value.ToString("yyyy-MM-dd"))}");
        if (dateTo.HasValue)
            query.Add($"dateTo={Uri.EscapeDataString(dateTo.Value.ToString("yyyy-MM-dd"))}");

        var qs = query.Count > 0 ? "?" + string.Join("&", query) : string.Empty;
        return await GetConsolidationAsync<FinancialStatementReportDto>($"/api/reports/{endpoint}{qs}");
    }

    public static async Task<FinancialStatementReportDto?> GetTradingAccountReportAsync(
        DateTime? dateFrom = null,
        DateTime? dateTo = null) =>
        await GetFinancialStatementReportAsync("trading-account", dateFrom, dateTo);

    public static async Task<FinancialStatementReportDto?> GetProfitLossReportAsync(
        DateTime? dateFrom = null,
        DateTime? dateTo = null) =>
        await GetFinancialStatementReportAsync("profit-loss", dateFrom, dateTo);

    public static async Task<FinancialStatementReportDto?> GetProfitLossWithTradingReportAsync(
        DateTime? dateFrom = null,
        DateTime? dateTo = null) =>
        await GetFinancialStatementReportAsync("profit-loss-trading", dateFrom, dateTo);

    public static async Task<FinancialStatementReportDto?> GetBalanceSheetReportAsync(
        DateTime? dateFrom = null,
        DateTime? dateTo = null) =>
        await GetFinancialStatementReportAsync("balance-sheet", dateFrom, dateTo);

    public static async Task<PurchaseAnalysisReportDto?> GetPurchaseAnalysisReportAsync(
        string? productCode = null,
        string? productName = null,
        string? mainName = null,
        string? supplier = null,
        DateTime? dateFrom = null,
        DateTime? dateTo = null)
    {
        var query = new List<string>();
        if (!string.IsNullOrWhiteSpace(productCode))
            query.Add($"productCode={Uri.EscapeDataString(productCode.Trim())}");
        if (!string.IsNullOrWhiteSpace(productName))
            query.Add($"productName={Uri.EscapeDataString(productName.Trim())}");
        if (!string.IsNullOrWhiteSpace(mainName) && !string.Equals(mainName, "(All)", StringComparison.OrdinalIgnoreCase))
            query.Add($"mainName={Uri.EscapeDataString(mainName.Trim())}");
        if (!string.IsNullOrWhiteSpace(supplier))
            query.Add($"supplier={Uri.EscapeDataString(supplier.Trim())}");
        if (dateFrom.HasValue)
            query.Add($"dateFrom={Uri.EscapeDataString(dateFrom.Value.ToString("yyyy-MM-dd"))}");
        if (dateTo.HasValue)
            query.Add($"dateTo={Uri.EscapeDataString(dateTo.Value.ToString("yyyy-MM-dd"))}");

        var qs = query.Count > 0 ? "?" + string.Join("&", query) : string.Empty;
        return await GetAsync<PurchaseAnalysisReportDto>($"/api/reports/purchase-analysis{qs}");
    }

    public static async Task<SalesAnalysisReportDto?> GetSalesAnalysisReportAsync(
        string? productCode = null,
        string? productName = null,
        string? mainName = null,
        string? customer = null,
        DateTime? dateFrom = null,
        DateTime? dateTo = null)
    {
        var query = new List<string>();
        if (!string.IsNullOrWhiteSpace(productCode))
            query.Add($"productCode={Uri.EscapeDataString(productCode.Trim())}");
        if (!string.IsNullOrWhiteSpace(productName))
            query.Add($"productName={Uri.EscapeDataString(productName.Trim())}");
        if (!string.IsNullOrWhiteSpace(mainName) && !string.Equals(mainName, "(All)", StringComparison.OrdinalIgnoreCase))
            query.Add($"mainName={Uri.EscapeDataString(mainName.Trim())}");
        if (!string.IsNullOrWhiteSpace(customer))
            query.Add($"customer={Uri.EscapeDataString(customer.Trim())}");
        if (dateFrom.HasValue)
            query.Add($"dateFrom={Uri.EscapeDataString(dateFrom.Value.ToString("yyyy-MM-dd"))}");
        if (dateTo.HasValue)
            query.Add($"dateTo={Uri.EscapeDataString(dateTo.Value.ToString("yyyy-MM-dd"))}");

        var qs = query.Count > 0 ? "?" + string.Join("&", query) : string.Empty;
        return await GetAsync<SalesAnalysisReportDto>($"/api/reports/sales-analysis{qs}");
    }

    public static async Task<DocumentRegisterReportDto?> GetDocumentRegisterReportAsync(
        string registerType,
        DateTime? dateFrom = null,
        DateTime? dateTo = null,
        string? billNo = null)
    {
        var query = new List<string>
        {
            $"type={Uri.EscapeDataString(registerType.Trim())}"
        };
        if (dateFrom.HasValue)
            query.Add($"dateFrom={Uri.EscapeDataString(dateFrom.Value.ToString("yyyy-MM-dd"))}");
        if (dateTo.HasValue)
            query.Add($"dateTo={Uri.EscapeDataString(dateTo.Value.ToString("yyyy-MM-dd"))}");
        if (!string.IsNullOrWhiteSpace(billNo))
            query.Add($"billNo={Uri.EscapeDataString(billNo.Trim())}");

        return await GetAsync<DocumentRegisterReportDto>($"/api/reports/document-register?{string.Join("&", query)}");
    }

    public static async Task<bool> VerifyEditDeletePasswordAsync(
        string password,
        string action,
        string module,
        string recordKey)
    {
        var body = new
        {
            password,
            action,
            module,
            recordKey
        };
        using var response = await Http.PostAsJsonAsync(
            Url("/api/security/edit-delete-password/verify"),
            body,
            JsonOptions);
        if (response.StatusCode == System.Net.HttpStatusCode.Forbidden)
            return false;
        await EnsureSuccessAsync(response);
        var result = await response.Content.ReadFromJsonAsync<EditDeleteVerifyResponseDto>(JsonOptions);
        return result?.Authorized == true;
    }

    public static async Task<EditDeletePasswordStatusDto?> GetEditDeletePasswordStatusAsync() =>
        await GetAsync<EditDeletePasswordStatusDto>("/api/security/edit-delete-password/status");

    public static async Task<EditDeleteConfirmationPolicyDto?> GetEditDeleteConfirmationPolicyAsync() =>
        await GetAsync<EditDeleteConfirmationPolicyDto>("/api/security/edit-delete-password/policy");

    public static async Task<SoftwareLicenseStatusDto?> GetSoftwareLicenseStatusAsync() =>
        await GetAsync<SoftwareLicenseStatusDto>("/api/license/status");

    public static async Task<SoftwareLicenseStatusDto?> GetSoftwareLicenseAdminDetailsAsync() =>
        await GetAsync<SoftwareLicenseStatusDto>("/api/license/admin");

    public static async Task<SoftwareLicenseStatusDto> SetSoftwareLicenseAsync(string licenseType, int? planDays = null)
    {
        using var response = await Http.PostAsJsonAsync(
            Url("/api/license/renew"),
            new { licenseType, planDays },
            JsonOptions);
        await EnsureSuccessAsync(response);
        return await response.Content.ReadFromJsonAsync<SoftwareLicenseStatusDto>(JsonOptions)
               ?? throw new ApiException("License update failed.");
    }

    public static async Task<SoftwareLicenseStatusDto> RenewSoftwareLicenseAsync(int planDays) =>
        await SetSoftwareLicenseAsync("trial", planDays);

    public static async Task<SoftwareLicenseStatusDto> ExtendSoftwareLicenseAsync(int days, string? note = null)
    {
        using var response = await Http.PostAsJsonAsync(
            Url("/api/license/extend"),
            new { days, note },
            JsonOptions);
        await EnsureSuccessAsync(response);
        return await response.Content.ReadFromJsonAsync<SoftwareLicenseStatusDto>(JsonOptions)
               ?? throw new ApiException("License extension failed.");
    }

    public static async Task UpdateEditDeletePasswordAsync(string newPassword)
    {
        using var response = await Http.PutAsJsonAsync(
            Url("/api/security/edit-delete-password"),
            new { newPassword },
            JsonOptions);
        await EnsureSuccessAsync(response);
        EditDeleteGuard.InvalidatePolicyCache();
    }

    public static async Task<List<SalesBillTemplateDto>> GetSalesBillTemplatesAsync() =>
        await GetAsync<List<SalesBillTemplateDto>>("/api/sales-bill-templates") ?? [];

    public static async Task<SalesBillTemplateDto?> GetSalesBillTemplateAsync(string id) =>
        await GetAsync<SalesBillTemplateDto>($"/api/sales-bill-templates/{Uri.EscapeDataString(id)}");

    public static async Task<SalesBillTemplateDto?> GetSalesBillTemplateByKeyAsync(string templateKey) =>
        await GetAsync<SalesBillTemplateDto>(
            $"/api/sales-bill-templates/by-key/{Uri.EscapeDataString(templateKey.Trim().ToLowerInvariant())}");

    public static async Task<SalesBillTemplateDto?> GetDefaultSalesBillTemplateAsync(string docTypeKey = "sales_invoice") =>
        await GetAsync<SalesBillTemplateDto>(
            $"/api/sales-bill-templates/default?docTypeKey={Uri.EscapeDataString(docTypeKey)}");

    public static async Task<SalesBillTemplateDto?> CreateSalesBillTemplateAsync(SalesBillTemplateCreateRequest request) =>
        await PostAsync<SalesBillTemplateDto>("/api/sales-bill-templates", request);

    public static async Task<SalesBillTemplateDto?> UpdateSalesBillTemplateAsync(
        string id,
        SalesBillTemplateUpdateRequest request) =>
        await PutAsync<SalesBillTemplateDto>($"/api/sales-bill-templates/{Uri.EscapeDataString(id)}", request);

    public static async Task<SalesBillTemplateDto?> UpdateSalesBillTemplateLayoutAsync(
        string id,
        SalesBillLayoutDefinition layout) =>
        await PutAsync<SalesBillTemplateDto>(
            $"/api/sales-bill-templates/{Uri.EscapeDataString(id)}/layout",
            new { layoutJson = layout });

    public static async Task DeleteSalesBillTemplateAsync(string id) =>
        await DeleteAsync($"/api/sales-bill-templates/{Uri.EscapeDataString(id)}");

    public static async Task<SalesBillTemplateDto?> DuplicateSalesBillTemplateAsync(
        string id,
        SalesBillTemplateDuplicateRequest request) =>
        await PostAsync<SalesBillTemplateDto>(
            $"/api/sales-bill-templates/{Uri.EscapeDataString(id)}/duplicate",
            request);

    public static async Task<SalesBillTemplateEnsureDefaultsResult?> EnsureSalesBillTemplateDefaultsAsync() =>
        await PostAsync<SalesBillTemplateEnsureDefaultsResult>(
            "/api/bill-formats/ensure-defaults",
            new { });

    public static async Task<BillFormatCatalogDto?> GetBillFormatCatalogAsync() =>
        await GetAsync<BillFormatCatalogDto>("/api/bill-formats/catalog");

    public static async Task<List<SalesBillTemplateDto>> GetBillFormatsAsync(string? transactionType = null)
    {
        var query = string.IsNullOrWhiteSpace(transactionType)
            ? string.Empty
            : $"?transactionType={Uri.EscapeDataString(transactionType)}";
        return await GetAsync<List<SalesBillTemplateDto>>($"/api/bill-formats{query}") ?? [];
    }

    public static async Task<BillFormatResolveResultDto?> ResolveBillFormatAsync(
        string docTypeKey,
        string? partyCode = null,
        string? accountType = null)
    {
        var q = new List<string> { $"docTypeKey={Uri.EscapeDataString(docTypeKey)}" };
        if (!string.IsNullOrWhiteSpace(partyCode))
            q.Add($"partyCode={Uri.EscapeDataString(partyCode)}");
        if (!string.IsNullOrWhiteSpace(accountType))
            q.Add($"accountType={Uri.EscapeDataString(accountType)}");
        return await GetAsync<BillFormatResolveResultDto>($"/api/bill-formats/resolve?{string.Join("&", q)}");
    }

    public static async Task<SalesBillTemplateDto?> ExportBillFormatAsync(string id) =>
        await GetAsync<SalesBillTemplateDto>($"/api/bill-formats/{Uri.EscapeDataString(id)}/export");

    public static async Task<SalesBillTemplateDto?> ImportBillFormatAsync(SalesBillTemplateCreateRequest request) =>
        await PostAsync<SalesBillTemplateDto>("/api/bill-formats/import", request);

    public static async Task<ReportingEnsureDefaultsResultDto?> EnsureReportingDefaultsAsync() =>
        await PostAsync<ReportingEnsureDefaultsResultDto>("/api/reporting/ensure-defaults", new { });

    public static async Task<ReportingApplyStandardLayoutsResultDto?> ApplyStandardReportLayoutsAsync() =>
        await PostAsync<ReportingApplyStandardLayoutsResultDto>("/api/reporting/apply-standard-layouts", new { });

    public static async Task<List<ReportPaperSizeDto>> GetReportPaperSizesAsync() =>
        await GetAsync<List<ReportPaperSizeDto>>("/api/reporting/paper-sizes") ?? [];

    public static async Task<List<ReportFormatDto>> GetReportFormatsAsync(string? transactionType = null)
    {
        var query = string.IsNullOrWhiteSpace(transactionType)
            ? string.Empty
            : $"?transactionType={Uri.EscapeDataString(transactionType)}";
        return await GetAsync<List<ReportFormatDto>>($"/api/reporting/report-formats{query}") ?? [];
    }

    public static async Task<ReportFormatDto?> GetReportFormatAsync(string id) =>
        await GetAsync<ReportFormatDto>($"/api/reporting/report-formats/{Uri.EscapeDataString(id)}");

    public static async Task<ReportFormatResolveResultDto?> ResolveReportFormatAsync(
        string transactionType,
        string? partyCode = null,
        string? partyKind = null)
    {
        var q = new List<string> { $"transactionType={Uri.EscapeDataString(transactionType)}" };
        if (!string.IsNullOrWhiteSpace(partyCode))
            q.Add($"partyCode={Uri.EscapeDataString(partyCode)}");
        if (!string.IsNullOrWhiteSpace(partyKind))
            q.Add($"partyKind={Uri.EscapeDataString(partyKind)}");
        return await GetAsync<ReportFormatResolveResultDto>(
            $"/api/reporting/report-formats/resolve?{string.Join("&", q)}");
    }

    public static async Task<ReportFieldRegistryResponseDto?> GetReportFieldRegistryAsync(string transactionType) =>
        await GetAsync<ReportFieldRegistryResponseDto>(
            $"/api/reporting/field-registry?transactionType={Uri.EscapeDataString(transactionType)}");

    public static async Task<ReportFormatDto?> UpdateReportFormatAsync(string id, ReportFormatUpdateRequest request) =>
        await PutAsync<ReportFormatDto>($"/api/reporting/report-formats/{Uri.EscapeDataString(id)}", request);

    public static async Task UpdateEditDeleteSecuritySettingsAsync(
        string? newPassword = null,
        bool? confirmationRequired = null)
    {
        using var response = await Http.PutAsJsonAsync(
            Url("/api/security/edit-delete-password"),
            new { newPassword, confirmationRequired },
            JsonOptions);
        await EnsureSuccessAsync(response);
        EditDeleteGuard.InvalidatePolicyCache();
    }

    public static async Task<GridColumnModulesResponseDto?> GetGridColumnModulesAsync() =>
        await GetAsync<GridColumnModulesResponseDto>("/api/grid-columns/modules");

    public static async Task<SalesPurchaseSettingsDto?> GetSalesPurchaseSettingsAsync() =>
        await GetAsync<SalesPurchaseSettingsDto>("/api/settings/sales-purchase");

    public static async Task<SalesPurchaseSettingsDto?> UpdateSalesPurchaseSettingsAsync(
        SalesPurchaseSettingsDto settings) =>
        await PutAsync<SalesPurchaseSettingsDto>("/api/settings/sales-purchase", settings);

    public static async Task<LatestPurchaseSalesRateDto?> GetLatestPurchaseInvoiceSalesRateAsync(string productCode) =>
        await GetAsync<LatestPurchaseSalesRateDto>(
            $"/api/purchase-invoices/latest-sales-rate/{Uri.EscapeDataString(productCode)}");

    public static async Task<GridColumnPreferencesDto?> GetGridColumnPreferencesAsync(string moduleKey) =>
        await GetAsync<GridColumnPreferencesDto>($"/api/grid-columns/{Uri.EscapeDataString(moduleKey)}");

    public static async Task<GridColumnPreferencesDto?> SaveGridColumnPreferencesAsync(
        string moduleKey,
        IReadOnlyList<string> visibleColumnKeys) =>
        await PutAsync<GridColumnPreferencesDto>(
            $"/api/grid-columns/{Uri.EscapeDataString(moduleKey)}",
            new { visibleColumnKeys });

    public static async Task<GridColumnPreferencesDto?> ResetGridColumnPreferencesAsync(string moduleKey) =>
        await PostAsync<GridColumnPreferencesDto>(
            $"/api/grid-columns/{Uri.EscapeDataString(moduleKey)}/reset",
            new { });

    public static async Task SaveGlobalGridColumnDefaultsAsync(
        string moduleKey,
        IReadOnlyList<string> visibleColumnKeys)
    {
        using var response = await Http.PutAsJsonAsync(
            Url($"/api/grid-columns/{Uri.EscapeDataString(moduleKey)}/global-default"),
            new { visibleColumnKeys },
            JsonOptions);
        await EnsureSuccessAsync(response);
    }

    public static async Task ResetGlobalGridColumnDefaultsAsync(string moduleKey)
    {
        using var response = await Http.PostAsJsonAsync(
            Url($"/api/grid-columns/{Uri.EscapeDataString(moduleKey)}/global-default/reset"),
            new { },
            JsonOptions);
        await EnsureSuccessAsync(response);
    }

    public static async Task<OutstandingReportDto?> GetOutstandingReportAsync(
        DateTime? asOnDate = null,
        string? type = null,
        string? partyName = null)
    {
        var query = new List<string>();
        if (asOnDate.HasValue)
            query.Add($"asOnDate={Uri.EscapeDataString(asOnDate.Value.ToString("yyyy-MM-dd"))}");
        if (!string.IsNullOrWhiteSpace(type) && !string.Equals(type, "(All)", StringComparison.OrdinalIgnoreCase))
            query.Add($"type={Uri.EscapeDataString(type.Trim())}");
        if (!string.IsNullOrWhiteSpace(partyName))
            query.Add($"partyName={Uri.EscapeDataString(partyName.Trim())}");

        var qs = query.Count > 0 ? "?" + string.Join("&", query) : string.Empty;
        return await GetAsync<OutstandingReportDto>($"/api/reports/outstanding{qs}");
    }

    public static async Task<DueDayReportDto?> GetDueDayReportAsync(
        DateTime? asOnDate = null,
        string? type = null,
        string? partyName = null)
    {
        var query = new List<string>();
        if (asOnDate.HasValue)
            query.Add($"asOnDate={Uri.EscapeDataString(asOnDate.Value.ToString("yyyy-MM-dd"))}");
        if (!string.IsNullOrWhiteSpace(type) && !string.Equals(type, "(All)", StringComparison.OrdinalIgnoreCase))
            query.Add($"type={Uri.EscapeDataString(type.Trim())}");
        if (!string.IsNullOrWhiteSpace(partyName))
            query.Add($"partyName={Uri.EscapeDataString(partyName.Trim())}");

        var qs = query.Count > 0 ? "?" + string.Join("&", query) : string.Empty;
        return await GetAsync<DueDayReportDto>($"/api/reports/due-day{qs}");
    }

    public static async Task<DueAmountReportDto?> GetDueAmountReportAsync(
        DateTime? asOnDate = null,
        string? type = null,
        string? partyName = null)
    {
        var query = new List<string>();
        if (asOnDate.HasValue)
            query.Add($"asOnDate={Uri.EscapeDataString(asOnDate.Value.ToString("yyyy-MM-dd"))}");
        if (!string.IsNullOrWhiteSpace(type) && !string.Equals(type, "(All)", StringComparison.OrdinalIgnoreCase))
            query.Add($"type={Uri.EscapeDataString(type.Trim())}");
        if (!string.IsNullOrWhiteSpace(partyName))
            query.Add($"partyName={Uri.EscapeDataString(partyName.Trim())}");

        var qs = query.Count > 0 ? "?" + string.Join("&", query) : string.Empty;
        return await GetAsync<DueAmountReportDto>($"/api/reports/due-amount{qs}");
    }

    public static Task<List<ProductTypeDto>> GetProductTypesAsync(string? search = null) =>
        GetAllPagedAsync<ProductTypeDto>("/api/product-types", BuildListQueryParams(search));

    public static async Task<ProductTypeDto> CreateProductTypeAsync(ProductTypeDto productType) =>
        await PostAsync<ProductTypeDto>("/api/product-types", productType)
        ?? throw new ApiException("Failed to create product type.");

    public static async Task<ProductTypeDto> UpdateProductTypeAsync(ProductTypeDto productType)
    {
        if (string.IsNullOrEmpty(productType.Id))
            throw new ApiException("Product type id is required for update.");

        return await PutAsync<ProductTypeDto>($"/api/product-types/{productType.Id}", productType)
               ?? throw new ApiException("Failed to update product type.");
    }

    public static async Task<ProductTypeDto> UpdateProductTypeByCodeAsync(string originalCode, ProductTypeDto productType) =>
        await PutAsync<ProductTypeDto>($"/api/product-types/by-code/{Uri.EscapeDataString(originalCode)}", productType)
        ?? throw new ApiException("Failed to update product type.");

    public static async Task DeleteProductTypeByCodeAsync(string code) =>
        await DeleteAsync($"/api/product-types/by-code/{Uri.EscapeDataString(code)}");

    public static Task<List<ProductMainGroupDto>> GetProductMainGroupsAsync(string? search = null) =>
        GetAllPagedAsync<ProductMainGroupDto>("/api/product-main-groups", BuildListQueryParams(search));

    public static async Task<ProductMainGroupDto> CreateProductMainGroupAsync(ProductMainGroupDto item) =>
        await PostAsync<ProductMainGroupDto>("/api/product-main-groups", item)
        ?? throw new ApiException("Failed to create product main group.");

    public static async Task<ProductMainGroupDto> UpdateProductMainGroupByCodeAsync(string originalCode, ProductMainGroupDto item) =>
        await PutAsync<ProductMainGroupDto>($"/api/product-main-groups/by-code/{Uri.EscapeDataString(originalCode)}", item)
        ?? throw new ApiException("Failed to update product main group.");

    public static async Task DeleteProductMainGroupByCodeAsync(string code) =>
        await DeleteAsync($"/api/product-main-groups/by-code/{Uri.EscapeDataString(code)}");

    public static Task<List<ProductSubGroupDto>> GetProductSubGroupsAsync(string? search = null) =>
        GetAllPagedAsync<ProductSubGroupDto>("/api/product-sub-groups", BuildListQueryParams(search));

    public static async Task<ProductSubGroupDto> CreateProductSubGroupAsync(ProductSubGroupDto item) =>
        await PostAsync<ProductSubGroupDto>("/api/product-sub-groups", item)
        ?? throw new ApiException("Failed to create product sub group.");

    public static async Task<ProductSubGroupDto> UpdateProductSubGroupByCodeAsync(string originalCode, ProductSubGroupDto item) =>
        await PutAsync<ProductSubGroupDto>($"/api/product-sub-groups/by-code/{Uri.EscapeDataString(originalCode)}", item)
        ?? throw new ApiException("Failed to update product sub group.");

    public static async Task DeleteProductSubGroupByCodeAsync(string code) =>
        await DeleteAsync($"/api/product-sub-groups/by-code/{Uri.EscapeDataString(code)}");

    public static Task<List<AssemblyTypeDto>> GetAssemblyTypesAsync(string? search = null) =>
        GetAllPagedAsync<AssemblyTypeDto>("/api/assembly-types", BuildListQueryParams(search));

    public static async Task<AssemblyTypeDto> CreateAssemblyTypeAsync(AssemblyTypeDto item) =>
        await PostAsync<AssemblyTypeDto>("/api/assembly-types", item)
        ?? throw new ApiException("Failed to create assembly type.");

    public static async Task<AssemblyTypeDto> UpdateAssemblyTypeByCodeAsync(string originalCode, AssemblyTypeDto item) =>
        await PutAsync<AssemblyTypeDto>($"/api/assembly-types/by-code/{Uri.EscapeDataString(originalCode)}", item)
        ?? throw new ApiException("Failed to update assembly type.");

    public static async Task DeleteAssemblyTypeByCodeAsync(string code) =>
        await DeleteAsync($"/api/assembly-types/by-code/{Uri.EscapeDataString(code)}");

    public static Task<List<SaleUomDto>> GetSaleUomsAsync(string? search = null) =>
        GetAllPagedAsync<SaleUomDto>("/api/sale-uoms", BuildListQueryParams(search));

    public static async Task<SaleUomDto> CreateSaleUomAsync(SaleUomDto item) =>
        await PostAsync<SaleUomDto>("/api/sale-uoms", item)
        ?? throw new ApiException("Failed to create sale UOM.");

    public static async Task<SaleUomDto> UpdateSaleUomByCodeAsync(string originalCode, SaleUomDto item) =>
        await PutAsync<SaleUomDto>($"/api/sale-uoms/by-code/{Uri.EscapeDataString(originalCode)}", item)
        ?? throw new ApiException("Failed to update sale UOM.");

    public static async Task DeleteSaleUomByCodeAsync(string code) =>
        await DeleteAsync($"/api/sale-uoms/by-code/{Uri.EscapeDataString(code)}");

    public static Task<List<CustomerTypeDto>> GetCustomerTypesAsync(string? search = null) =>
        GetAllPagedAsync<CustomerTypeDto>("/api/customer-types", BuildListQueryParams(search));

    public static async Task<CustomerTypeDto> CreateCustomerTypeAsync(CustomerTypeDto item) =>
        await PostAsync<CustomerTypeDto>("/api/customer-types", item)
        ?? throw new ApiException("Failed to create customer type.");

    public static async Task<CustomerTypeDto> UpdateCustomerTypeByCodeAsync(string originalCode, CustomerTypeDto item) =>
        await PutAsync<CustomerTypeDto>($"/api/customer-types/by-code/{Uri.EscapeDataString(originalCode)}", item)
        ?? throw new ApiException("Failed to update customer type.");

    public static async Task DeleteCustomerTypeByCodeAsync(string code) =>
        await DeleteAsync($"/api/customer-types/by-code/{Uri.EscapeDataString(code)}");

    public static Task<List<CompanyDto>> GetCompaniesAsync(string? search = null) =>
        GetAllPagedAsync<CompanyDto>("/api/companies", BuildListQueryParams(search));

    public static async Task<CompanyDto?> GetDefaultCompanyAsync()
    {
        try
        {
            return await GetAsync<CompanyDto>("/api/companies/default");
        }
        catch (ApiException)
        {
            return null;
        }
    }

    public static async Task<CompanyDto?> GetCompanyByCodeAsync(string code) =>
        await GetAsync<CompanyDto>($"/api/companies/by-code/{Uri.EscapeDataString(code)}");

    public static async Task<CompanyDto> CreateCompanyAsync(CompanyDto item) =>
        await PostAsync<CompanyDto>("/api/companies", item)
        ?? throw new ApiException("Failed to create company.");

    public static async Task<CompanyDto> UpdateCompanyByCodeAsync(string originalCode, CompanyDto item) =>
        await PutAsync<CompanyDto>($"/api/companies/by-code/{Uri.EscapeDataString(originalCode)}", item)
        ?? throw new ApiException("Failed to update company.");

    public static async Task DeleteCompanyByCodeAsync(string code) =>
        await DeleteAsync($"/api/companies/by-code/{Uri.EscapeDataString(code)}");

    public static Task<List<AppUserDto>> GetUsersAsync(string? search = null) =>
        GetAllPagedAsync<AppUserDto>("/api/users", BuildListQueryParams(search));

    public static async Task<PagedResponse<AppUserDto>> GetUsersPageAsync(
        int page,
        int limit,
        string? search = null,
        CancellationToken cancellationToken = default) =>
        await GetMasterPageAsync<AppUserDto>("/api/users", page, limit, search, cancellationToken);

    public static async Task<AppUserDto?> GetUserByUsernameAsync(string username) =>
        await GetAsync<AppUserDto>($"/api/users/by-username/{Uri.EscapeDataString(username)}");

    public static async Task<AppUserDto> CreateUserAsync(AppUserDto item) =>
        await PostAsync<AppUserDto>("/api/users", item)
        ?? throw new ApiException("Failed to create user.");

    public static async Task<AppUserDto> UpdateUserByUsernameAsync(string originalUsername, AppUserDto item) =>
        await PutAsync<AppUserDto>($"/api/users/by-username/{Uri.EscapeDataString(originalUsername)}", item)
        ?? throw new ApiException("Failed to update user.");

    public static async Task DeleteUserByUsernameAsync(string username) =>
        await DeleteAsync($"/api/users/by-username/{Uri.EscapeDataString(username)}");

    public static Task<List<MachineDto>> GetMachinesAsync(string? search = null) =>
        GetAllPagedAsync<MachineDto>("/api/machines", BuildListQueryParams(search));

    public static async Task<PagedResponse<MachineDto>> GetMachinesPageAsync(
        int page,
        int limit,
        string? search = null,
        CancellationToken cancellationToken = default) =>
        await GetMasterPageAsync<MachineDto>("/api/machines", page, limit, search, cancellationToken);

    public static async Task<MachineDto?> GetMachineByCodeAsync(string code) =>
        await GetAsync<MachineDto>($"/api/machines/by-code/{Uri.EscapeDataString(code)}");

    public static async Task<MachineDto> CreateMachineAsync(MachineDto item) =>
        await PostAsync<MachineDto>("/api/machines", item)
        ?? throw new ApiException("Failed to create machine.");

    public static async Task<MachineDto> UpdateMachineByCodeAsync(string originalCode, MachineDto item) =>
        await PutAsync<MachineDto>($"/api/machines/by-code/{Uri.EscapeDataString(originalCode)}", item)
        ?? throw new ApiException("Failed to update machine.");

    public static async Task DeleteMachineByCodeAsync(string code) =>
        await DeleteAsync($"/api/machines/by-code/{Uri.EscapeDataString(code)}");

    public static Task<List<PayrollEmployeeDto>> GetPayrollEmployeesAsync(string? search = null) =>
        GetAllPagedAsync<PayrollEmployeeDto>("/api/payroll-employees", BuildListQueryParams(search));

    public static async Task<PagedResponse<PayrollEmployeeDto>> GetPayrollEmployeesPageAsync(
        int page,
        int limit,
        string? search = null,
        bool activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        _ = cancellationToken;
        var queryParts = new List<string>
        {
            $"page={Math.Max(page, 1)}",
            $"limit={Math.Clamp(limit, 1, 10000)}"
        };

        if (!string.IsNullOrWhiteSpace(search))
            queryParts.Add($"search={Uri.EscapeDataString(search.Trim())}");
        if (activeOnly)
            queryParts.Add("activeOnly=true");

        var path = $"/api/payroll-employees?{string.Join("&", queryParts)}";
        return await GetAsync<PagedResponse<PayrollEmployeeDto>>(path)
               ?? new PagedResponse<PayrollEmployeeDto>();
    }

    public static async Task<PayrollEmployeeDto?> GetPayrollEmployeeByCodeAsync(string code) =>
        await GetAsync<PayrollEmployeeDto>($"/api/payroll-employees/by-code/{Uri.EscapeDataString(code)}");

    public static async Task<PayrollEmployeeDto> CreatePayrollEmployeeAsync(PayrollEmployeeDto item) =>
        await PostAsync<PayrollEmployeeDto>("/api/payroll-employees", item)
        ?? throw new ApiException("Failed to create payroll employee.");

    public static async Task<PayrollEmployeeDto> UpdatePayrollEmployeeByCodeAsync(string originalCode, PayrollEmployeeDto item) =>
        await PutAsync<PayrollEmployeeDto>($"/api/payroll-employees/by-code/{Uri.EscapeDataString(originalCode)}", item)
        ?? throw new ApiException("Failed to update payroll employee.");

    public static async Task DeletePayrollEmployeeByCodeAsync(string code) =>
        await DeleteAsync($"/api/payroll-employees/by-code/{Uri.EscapeDataString(code)}");

    public static Task<List<AttendanceRecordDto>> GetAttendanceAsync(string? employeeCode = null, string? periodMonth = null)
    {
        var query = new List<(string Key, string Value)>();
        if (!string.IsNullOrWhiteSpace(employeeCode))
            query.Add(("employeeCode", employeeCode));
        if (!string.IsNullOrWhiteSpace(periodMonth))
            query.Add(("periodMonth", periodMonth));
        query.Add(("limit", "500"));
        return GetAllPagedAsync<AttendanceRecordDto>("/api/attendance", query);
    }

    public static async Task<AttendanceRecordDto> CreateAttendanceAsync(AttendanceRecordDto item) =>
        await PostAsync<AttendanceRecordDto>("/api/attendance", item)
        ?? throw new ApiException("Failed to save attendance.");

    public static async Task DeleteAttendanceByIdAsync(string id) =>
        await DeleteAsync($"/api/attendance/{Uri.EscapeDataString(id)}");

    public static Task<List<PayrollRunDto>> GetPayrollRunsAsync(string? periodMonth = null) =>
        GetAllPagedAsync<PayrollRunDto>(
            "/api/payroll-runs",
            string.IsNullOrWhiteSpace(periodMonth) ? null : [("periodMonth", periodMonth)]);

    public static async Task<PayrollRunDto?> GetPayrollRunByNoAsync(int runNo) =>
        await GetAsync<PayrollRunDto>($"/api/payroll-runs/by-no/{runNo}");

    public static async Task<PayrollRunDto> ProcessPayrollAsync(ProcessPayrollRequestDto request) =>
        await PostAsync<PayrollRunDto>("/api/payroll-runs/process", request)
        ?? throw new ApiException("Failed to process payroll.");

    public static async Task DeletePayrollRunByNoAsync(int runNo) =>
        await DeleteAsync($"/api/payroll-runs/by-no/{runNo}");

    public static async Task<PostPayrollPaymentResultDto?> PostPayrollPaymentAsync(
        int runNo,
        PostPayrollPaymentRequestDto request) =>
        await PostAsync<PostPayrollPaymentResultDto>($"/api/payroll-runs/by-no/{runNo}/post-payment", request);

    public static async Task<PayslipReportDto?> GetPayslipReportAsync(int runNo, string employeeCode) =>
        await GetAsync<PayslipReportDto>(
            $"/api/payroll-reports/payslip/{runNo}/{Uri.EscapeDataString(employeeCode)}");

    public static async Task<PayslipReportDto?> GetPayslipByPeriodAsync(
        string periodMonth,
        string employeeCode,
        int? runNo = null)
    {
        var query = new List<(string Key, string Value)>
        {
            ("employeeCode", employeeCode.Trim()),
            ("periodMonth", periodMonth.Trim())
        };
        if (runNo is int n)
            query.Add(("runNo", n.ToString(CultureInfo.InvariantCulture)));
        var qs = string.Join("&", query.Select(p =>
            $"{Uri.EscapeDataString(p.Key)}={Uri.EscapeDataString(p.Value)}"));
        return await GetAsync<PayslipReportDto>($"/api/payroll-reports/payslip-by-period?{qs}");
    }

    public static async Task<PayrollTaxSummaryDto?> GetPayrollTaxSummaryAsync(string periodMonth) =>
        await GetAsync<PayrollTaxSummaryDto>(
            $"/api/payroll-reports/tax-summary?periodMonth={Uri.EscapeDataString(periodMonth)}");

    public static async Task<StaffHoursReportDto?> GetStaffHoursReportAsync(string periodMonth) =>
        await GetAsync<StaffHoursReportDto>(
            $"/api/payroll-reports/staff-hours?periodMonth={Uri.EscapeDataString(periodMonth)}");

    public static Task<List<PaymentVoucherDto>> GetPaymentVouchersAsync(string? search = null) =>
        GetAllPagedAsync<PaymentVoucherDto>("/api/payment-vouchers", BuildListQueryParams(search));

    public static async Task<int> GetNextPaymentVoucherNoAsync()
    {
        var result = await GetAsync<NextVoucherNoDto>("/api/payment-vouchers/next-no");
        return result?.VoucherNo ?? 1;
    }

    public static async Task<PaymentVoucherDto?> GetPaymentVoucherByNoAsync(int voucherNo) =>
        await GetAsync<PaymentVoucherDto>($"/api/payment-vouchers/by-no/{voucherNo}");

    public static async Task<PaymentVoucherDto> CreatePaymentVoucherAsync(PaymentVoucherDto item) =>
        await PostAsync<PaymentVoucherDto>("/api/payment-vouchers", item)
        ?? throw new ApiException("Failed to create payment voucher.");

    public static async Task<PaymentVoucherDto> UpdatePaymentVoucherByNoAsync(int originalVoucherNo, PaymentVoucherDto item) =>
        await PutAsync<PaymentVoucherDto>($"/api/payment-vouchers/by-no/{originalVoucherNo}", item)
        ?? throw new ApiException("Failed to update payment voucher.");

    public static async Task DeletePaymentVoucherByNoAsync(int voucherNo) =>
        await DeleteAsync($"/api/payment-vouchers/by-no/{voucherNo}");

    public static Task<List<ReceiptVoucherDto>> GetReceiptVouchersAsync(string? search = null) =>
        GetAllPagedAsync<ReceiptVoucherDto>("/api/receipt-vouchers", BuildListQueryParams(search));

    public static async Task<int> GetNextReceiptVoucherNoAsync()
    {
        var result = await GetAsync<NextVoucherNoDto>("/api/receipt-vouchers/next-no");
        return result?.VoucherNo ?? 1;
    }

    public static async Task<ReceiptVoucherDto?> GetReceiptVoucherByNoAsync(int voucherNo) =>
        await GetAsync<ReceiptVoucherDto>($"/api/receipt-vouchers/by-no/{voucherNo}");

    public static async Task<ReceiptVoucherDto> CreateReceiptVoucherAsync(ReceiptVoucherDto item) =>
        await PostAsync<ReceiptVoucherDto>("/api/receipt-vouchers", item)
        ?? throw new ApiException("Failed to create receipt voucher.");

    public static async Task<ReceiptVoucherDto> UpdateReceiptVoucherByNoAsync(int originalVoucherNo, ReceiptVoucherDto item) =>
        await PutAsync<ReceiptVoucherDto>($"/api/receipt-vouchers/by-no/{originalVoucherNo}", item)
        ?? throw new ApiException("Failed to update receipt voucher.");

    public static async Task DeleteReceiptVoucherByNoAsync(int voucherNo) =>
        await DeleteAsync($"/api/receipt-vouchers/by-no/{voucherNo}");

    public static Task<List<CreditNoteDto>> GetCreditNotesAsync(string? search = null) =>
        GetAllPagedAsync<CreditNoteDto>("/api/credit-notes", BuildListQueryParams(search));

    public static async Task<int> GetNextCreditNoteNoAsync()
    {
        var result = await GetAsync<NextVoucherNoDto>("/api/credit-notes/next-no");
        return result?.VoucherNo ?? 1;
    }

    public static async Task<CreditNoteDto?> GetCreditNoteByNoAsync(int voucherNo) =>
        await GetAsync<CreditNoteDto>($"/api/credit-notes/by-no/{voucherNo}");

    public static async Task<CreditNoteDto> CreateCreditNoteAsync(CreditNoteDto item) =>
        await PostAsync<CreditNoteDto>("/api/credit-notes", item)
        ?? throw new ApiException("Failed to create credit note.");

    public static async Task<CreditNoteDto> UpdateCreditNoteByNoAsync(int originalVoucherNo, CreditNoteDto item) =>
        await PutAsync<CreditNoteDto>($"/api/credit-notes/by-no/{originalVoucherNo}", item)
        ?? throw new ApiException("Failed to update credit note.");

    public static async Task DeleteCreditNoteByNoAsync(int voucherNo) =>
        await DeleteAsync($"/api/credit-notes/by-no/{voucherNo}");

    public static Task<List<DebitNoteDto>> GetDebitNotesAsync(string? search = null) =>
        GetAllPagedAsync<DebitNoteDto>("/api/debit-notes", BuildListQueryParams(search));

    public static async Task<int> GetNextDebitNoteNoAsync()
    {
        var result = await GetAsync<NextVoucherNoDto>("/api/debit-notes/next-no");
        return result?.VoucherNo ?? 1;
    }

    public static async Task<DebitNoteDto?> GetDebitNoteByNoAsync(int voucherNo) =>
        await GetAsync<DebitNoteDto>($"/api/debit-notes/by-no/{voucherNo}");

    public static async Task<DebitNoteDto> CreateDebitNoteAsync(DebitNoteDto item) =>
        await PostAsync<DebitNoteDto>("/api/debit-notes", item)
        ?? throw new ApiException("Failed to create debit note.");

    public static async Task<DebitNoteDto> UpdateDebitNoteByNoAsync(int originalVoucherNo, DebitNoteDto item) =>
        await PutAsync<DebitNoteDto>($"/api/debit-notes/by-no/{originalVoucherNo}", item)
        ?? throw new ApiException("Failed to update debit note.");

    public static async Task DeleteDebitNoteByNoAsync(int voucherNo) =>
        await DeleteAsync($"/api/debit-notes/by-no/{voucherNo}");

    public static Task<List<CashEntryDto>> GetCashEntriesAsync(string? search = null) =>
        GetAllPagedAsync<CashEntryDto>("/api/cash-entries", BuildListQueryParams(search));

    public static async Task<int> GetNextCashEntryNoAsync()
    {
        var result = await GetAsync<NextEntryNoDto>("/api/cash-entries/next-no");
        return result?.EntryNo ?? 1;
    }

    public static async Task<CashEntryDto?> GetCashEntryByNoAsync(int entryNo) =>
        await GetAsync<CashEntryDto>($"/api/cash-entries/by-no/{entryNo}");

    public static async Task<CashEntryDto> CreateCashEntryAsync(CashEntryDto item) =>
        await PostAsync<CashEntryDto>("/api/cash-entries", item)
        ?? throw new ApiException("Failed to create cash entry.");

    public static async Task<CashEntryDto> UpdateCashEntryByNoAsync(int originalEntryNo, CashEntryDto item) =>
        await PutAsync<CashEntryDto>($"/api/cash-entries/by-no/{originalEntryNo}", item)
        ?? throw new ApiException("Failed to update cash entry.");

    public static async Task DeleteCashEntryByNoAsync(int entryNo) =>
        await DeleteAsync($"/api/cash-entries/by-no/{entryNo}");

    public static Task<List<BankEntryDto>> GetBankEntriesAsync(string? search = null) =>
        GetAllPagedAsync<BankEntryDto>("/api/bank-entries", BuildListQueryParams(search));

    public static async Task<int> GetNextBankEntryNoAsync()
    {
        var result = await GetAsync<NextVoucherNoDto>("/api/bank-entries/next-no");
        return result?.VoucherNo ?? 1;
    }

    public static async Task<BankEntryDto?> GetBankEntryByNoAsync(int voucherNo) =>
        await GetAsync<BankEntryDto>($"/api/bank-entries/by-no/{voucherNo}");

    public static async Task<BankEntryDto> CreateBankEntryAsync(BankEntryDto item) =>
        await PostAsync<BankEntryDto>("/api/bank-entries", item)
        ?? throw new ApiException("Failed to create bank entry.");

    public static async Task<BankEntryDto> UpdateBankEntryByNoAsync(int originalVoucherNo, BankEntryDto item) =>
        await PutAsync<BankEntryDto>($"/api/bank-entries/by-no/{originalVoucherNo}", item)
        ?? throw new ApiException("Failed to update bank entry.");

    public static async Task DeleteBankEntryByNoAsync(int voucherNo) =>
        await DeleteAsync($"/api/bank-entries/by-no/{voucherNo}");

    public static async Task<byte[]?> DownloadImportTemplateAsync(string importType)
    {
        using var response = await Http.GetAsync(Url($"/api/import/{importType}/template"));
        await EnsureSuccessAsync(response);
        return await response.Content.ReadAsByteArrayAsync();
    }

    public const string PurgeConfirmPhrase = "DELETE ALL IMS DATA";

    public static async Task<DataSummaryDto?> GetDataSummaryAsync() =>
        await GetAsync<DataSummaryDto>("/api/admin/data/summary");

    public static async Task<DataPurgeResultDto?> DeleteAllDataAsync(string confirmPhrase) =>
        await PostAsync<DataPurgeResultDto>("/api/admin/data/purge", new { confirmPhrase });

    public static async Task<DatabaseBackupResultDto?> CreateDatabaseBackupAsync(
        string outputDirectory,
        string fileName) =>
        await PostAsync<DatabaseBackupResultDto>(
            "/api/admin/database/backup",
            new { outputDirectory, fileName });

    public static async Task<ImportResultDto?> ImportExcelAsync(string importType, string filePath)
    {
        if (!File.Exists(filePath))
            throw new ApiException("File not found.");

        var bytes = await File.ReadAllBytesAsync(filePath);
        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(bytes);
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        content.Add(fileContent, "file", Path.GetFileName(filePath));

        using var response = await Http.PostAsync(Url($"/api/import/{importType}"), content);
        await EnsureSuccessAsync(response);
        return await response.Content.ReadFromJsonAsync<ImportResultDto>(JsonOptions);
    }

    private static string Url(string path) => $"{ApiConfiguration.BaseUrl}{path}";

    private const int DefaultFetchPageSize = 2000;

    private static IReadOnlyList<(string Key, string Value)>? BuildListQueryParams(
        string? search = null,
        string? status = null)
    {
        var list = new List<(string Key, string Value)>();
        if (!string.IsNullOrWhiteSpace(search))
            list.Add(("search", search.Trim()));
        if (!string.IsNullOrWhiteSpace(status))
            list.Add(("status", status.Trim()));
        return list.Count == 0 ? null : list;
    }

    private static string BuildPagedUrl(
        string path,
        int page,
        int pageSize,
        IReadOnlyList<(string Key, string Value)>? queryParams)
    {
        var queryParts = new List<string> { $"limit={pageSize}", $"page={page}" };
        if (queryParams is not null)
        {
            foreach (var (key, value) in queryParams)
                queryParts.Add($"{key}={Uri.EscapeDataString(value)}");
        }

        var separator = path.Contains('?') ? "&" : "?";
        return $"{path}{separator}{string.Join("&", queryParts)}";
    }

    /// <summary>Fetches every page until all API records are loaded.</summary>
    private static async Task<List<T>> GetAllPagedAsync<T>(
        string path,
        IReadOnlyList<(string Key, string Value)>? queryParams = null,
        int pageSize = DefaultFetchPageSize)
    {
        var all = new List<T>();
        var page = 1;

        while (true)
        {
            var url = BuildPagedUrl(path, page, pageSize, queryParams);
            var response = await GetAsync<PagedResponse<T>>(url);
            if (response?.Items is not { Count: > 0 })
                break;

            all.AddRange(response.Items);
            if (response.Items.Count < pageSize)
                break;
            if (response.Total > 0 && all.Count >= response.Total)
                break;

            page++;
        }

        return all;
    }

    private static async Task<T?> GetAsync<T>(string path)
    {
        using var response = await Http.GetAsync(Url(path));
        await EnsureSuccessAsync(response);
        return await response.Content.ReadFromJsonAsync<T>(JsonOptions);
    }

    private static async Task<T?> GetConsolidationAsync<T>(string path)
    {
        using var response = await SendWithRetryAsync(
            () => ConsolidationHttp.GetAsync(Url(path)),
            maxAttempts: 3);
        await EnsureSuccessAsync(response);
        return await response.Content.ReadFromJsonAsync<T>(JsonOptions);
    }

    private static async Task<T?> PostAsync<T>(string path, object body)
    {
        using var response = await Http.PostAsJsonAsync(Url(path), body, JsonOptions);
        await EnsureSuccessAsync(response);
        return await response.Content.ReadFromJsonAsync<T>(JsonOptions);
    }

    private static async Task<T?> PostConsolidationAsync<T>(string path, object body)
    {
        using var response = await ConsolidationHttp.PostAsJsonAsync(Url(path), body, JsonOptions);
        await EnsureSuccessAsync(response);
        return await response.Content.ReadFromJsonAsync<T>(JsonOptions);
    }

    private static async Task<T?> PutAsync<T>(string path, object body)
    {
        using var response = await Http.PutAsJsonAsync(Url(path), body, JsonOptions);
        await EnsureSuccessAsync(response);
        return await response.Content.ReadFromJsonAsync<T>(JsonOptions);
    }

    private static async Task DeleteAsync(string path)
    {
        using var response = await Http.DeleteAsync(Url(path));
        await EnsureSuccessAsync(response);
    }

    public static async Task<List<RoleDto>> GetRolesAsync()
    {
        var result = await GetAsync<RoleListResponseDto>("/api/roles");
        return result?.Items ?? [];
    }

    public static async Task<List<string>> GetActiveRoleNamesAsync()
    {
        var result = await GetAsync<RoleNamesResponseDto>("/api/roles/active-names");
        return result?.Items ?? [];
    }

    public static async Task<RoleDetailResponseDto> GetRoleAsync(string roleId)
    {
        return await GetAsync<RoleDetailResponseDto>($"/api/roles/{Uri.EscapeDataString(roleId)}")
               ?? throw new ApiException("Role not found.");
    }

    public static async Task<MenuTreeResponseDto> GetMenuTreeAsync()
    {
        return await GetAsync<MenuTreeResponseDto>("/api/menus")
               ?? new MenuTreeResponseDto();
    }

    public static async Task<RoleDetailResponseDto> CreateRoleAsync(RoleSaveRequestDto body)
    {
        return await PostAsync<RoleDetailResponseDto>("/api/roles", body)
               ?? throw new ApiException("Failed to create role.");
    }

    public static async Task<RoleDetailResponseDto> UpdateRoleAsync(string roleId, RoleSaveRequestDto body)
    {
        return await PutAsync<RoleDetailResponseDto>($"/api/roles/{Uri.EscapeDataString(roleId)}", body)
               ?? throw new ApiException("Failed to update role.");
    }

    public static async Task DeleteRoleAsync(string roleId)
    {
        await DeleteAsync($"/api/roles/{Uri.EscapeDataString(roleId)}");
    }

    public static async Task<RoleDetailResponseDto> SetRoleActiveAsync(string roleId, bool isActive)
    {
        return await PatchAsync<RoleDetailResponseDto>($"/api/roles/{Uri.EscapeDataString(roleId)}/active", new { isActive })
               ?? throw new ApiException("Failed to update role status.");
    }

    private static async Task<T?> PatchAsync<T>(string path, object body)
    {
        using var request = new HttpRequestMessage(HttpMethod.Patch, Url(path))
        {
            Content = JsonContent.Create(body, options: JsonOptions)
        };
        using var response = await Http.SendAsync(request);
        await EnsureSuccessAsync(response);
        return await response.Content.ReadFromJsonAsync<T>(JsonOptions);
    }

    private static async Task<T?> GetWithRetryAsync<T>(string path, int maxAttempts = 3)
    {
        using var response = await SendWithRetryAsync(
            () => Http.GetAsync(Url(path)),
            maxAttempts);
        await EnsureSuccessAsync(response);
        return await response.Content.ReadFromJsonAsync<T>(JsonOptions);
    }

    private static async Task<HttpResponseMessage> PostJsonWithRetryAsync(string path, object body, int maxAttempts = 3)
    {
        return await SendWithRetryAsync(
            () => Http.PostAsJsonAsync(Url(path), body, JsonOptions),
            maxAttempts);
    }

    private static bool IsTransientRequestFailure(Exception ex)
    {
        for (var current = ex; current is not null; current = current.InnerException)
        {
            if (current is HttpRequestException or IOException or SocketException)
                return true;
            if (current is TaskCanceledException tce && !tce.CancellationToken.IsCancellationRequested)
                return true;
        }

        return false;
    }

    private static async Task<HttpResponseMessage> SendWithRetryAsync(
        Func<Task<HttpResponseMessage>> send,
        int maxAttempts)
    {
        Exception? last = null;
        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                return await send();
            }
            catch (Exception ex) when (IsTransientRequestFailure(ex) && attempt < maxAttempts)
            {
                last = ex;
                await Task.Delay(TimeSpan.FromMilliseconds(Math.Min(500 * attempt, 2500)));
            }
        }

        throw last ?? new HttpRequestException("Request failed.");
    }

    private static async Task EnsureSuccessAsync(HttpResponseMessage response)
    {
        if (response.IsSuccessStatusCode)
            return;

        var body = await response.Content.ReadAsStringAsync();
        string message;
        try
        {
            using var doc = JsonDocument.Parse(body);
            message = doc.RootElement.TryGetProperty("error", out var err)
                ? err.GetString() ?? response.ReasonPhrase ?? "API error"
                : response.ReasonPhrase ?? "API error";
        }
        catch
        {
            message = string.IsNullOrWhiteSpace(body) ? response.ReasonPhrase ?? "API error" : body;
        }

        throw new ApiException($"{(int)response.StatusCode} {message}");
    }
}
