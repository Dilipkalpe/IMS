using System.Text.Json;
using Ims.Domain.Common;
using Ims.Domain.Config;
using Ims.Domain.Entities;
using Ims.Domain.Masters;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ims.Infrastructure;

public sealed class ImsDbContext : DbContext
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public ImsDbContext(DbContextOptions<ImsDbContext> options) : base(options) { }

    public DbSet<FinancialYear> FinancialYears => Set<FinancialYear>();
    public DbSet<SoftwareLicense> SoftwareLicenses => Set<SoftwareLicense>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<AppUser> AppUsers => Set<AppUser>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Counter> Counters => Set<Counter>();
    public DbSet<SalesInvoiceDocument> SalesInvoices => Set<SalesInvoiceDocument>();
    public DbSet<DeliveryChallanDocument> DeliveryChallans => Set<DeliveryChallanDocument>();
    public DbSet<SalesReturnDocument> SalesReturns => Set<SalesReturnDocument>();
    public DbSet<PurchaseInvoiceDocument> PurchaseInvoices => Set<PurchaseInvoiceDocument>();
    public DbSet<GrnDocument> Grns => Set<GrnDocument>();
    public DbSet<PurchaseReturnDocument> PurchaseReturns => Set<PurchaseReturnDocument>();
    public DbSet<PurchaseOrderDocument> PurchaseOrders => Set<PurchaseOrderDocument>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<FinancialYear>(entity =>
        {
            entity.ToTable("financial_years");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasMaxLength(24);
            entity.HasIndex(x => x.FinancialYearName).IsUnique();
            entity.HasIndex(x => x.DatabaseName).IsUnique();
        });

        modelBuilder.Entity<SoftwareLicense>(entity =>
        {
            entity.ToTable("software_licenses");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasMaxLength(24);
            entity.Property(x => x.Extensions)
                .HasColumnName("extensions_json")
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonOptions),
                    v => JsonSerializer.Deserialize<List<LicenseExtension>>(v, JsonOptions) ?? new List<LicenseExtension>());
        });

        ConfigureYearScoped<Product>(modelBuilder, "products", e => e.HasIndex(x => new { x.YearDatabaseName, x.Code }).IsUnique());
        ConfigureYearScoped<Account>(modelBuilder, "accounts", e => e.HasIndex(x => new { x.YearDatabaseName, x.Code }).IsUnique());
        ConfigureYearScoped<AppUser>(modelBuilder, "app_users", e => e.HasIndex(x => new { x.YearDatabaseName, x.Username }).IsUnique());
        ConfigureYearScoped<Company>(modelBuilder, "companies", e => e.HasIndex(x => new { x.YearDatabaseName, x.Code }).IsUnique());

        modelBuilder.Entity<Counter>(entity =>
        {
            entity.ToTable("counters");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasMaxLength(24);
            entity.Property(x => x.YearDatabaseName).HasColumnName("year_database_name").HasMaxLength(64);
            entity.Property(x => x.Key).HasMaxLength(128);
            entity.HasIndex(x => new { x.YearDatabaseName, x.Key }).IsUnique();
        });

        ConfigureNumberedDocument<SalesInvoiceDocument>(modelBuilder, "sales_invoices");
        ConfigureNumberedDocument<DeliveryChallanDocument>(modelBuilder, "delivery_challans");
        ConfigureNumberedDocument<SalesReturnDocument>(modelBuilder, "sales_returns");
        ConfigureNumberedDocument<PurchaseInvoiceDocument>(modelBuilder, "purchase_invoices");
        ConfigureNumberedDocument<GrnDocument>(modelBuilder, "grns");
        ConfigureNumberedDocument<PurchaseReturnDocument>(modelBuilder, "purchase_returns");
        ConfigureNumberedDocument<PurchaseOrderDocument>(modelBuilder, "purchase_orders");
    }

    private static void ConfigureNumberedDocument<T>(ModelBuilder modelBuilder, string table)
        where T : NumberedDocumentBase
    {
        var entity = modelBuilder.Entity<T>();
        entity.ToTable(table);
        entity.HasKey(x => x.Id);
        entity.Property(x => x.Id).HasMaxLength(24);
        entity.Property(x => x.YearDatabaseName).HasColumnName("year_database_name").HasMaxLength(64);
        entity.Property(x => x.DocPrefix).HasColumnName("doc_prefix").HasMaxLength(16);
        entity.Property(x => x.FormattedDocNo).HasColumnName("formatted_doc_no").HasMaxLength(64);
        entity.Property(x => x.BodyJson).HasColumnName("body_json").HasColumnType("jsonb");
        entity.Property(x => x.CreatedAt).HasColumnName("created_at");
        entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        entity.Property(x => x.TranDate).HasColumnName("tran_date");
        entity.HasIndex(x => new { x.YearDatabaseName, x.DocPrefix, x.DocNo }).IsUnique();
        entity.HasIndex(x => new { x.YearDatabaseName, x.FormattedDocNo }).IsUnique();
    }

    private static void ConfigureYearScoped<T>(
        ModelBuilder modelBuilder,
        string table,
        Action<EntityTypeBuilder<T>> configure)
        where T : EntityBase, IYearScoped
    {
        var entity = modelBuilder.Entity<T>();
        entity.ToTable(table);
        entity.HasKey(x => x.Id);
        entity.Property(x => x.Id).HasMaxLength(24);
        entity.Property(x => x.YearDatabaseName).HasColumnName("year_database_name").HasMaxLength(64);
        entity.Property(x => x.CreatedAt).HasColumnName("created_at");
        entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        configure(entity);
    }
}
