using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ims.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "accounts",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    year_database_name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AccountType = table.Column<string>(type: "text", nullable: false),
                    Code = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    ContactPerson = table.Column<string>(type: "text", nullable: true),
                    Address = table.Column<string>(type: "text", nullable: true),
                    City = table.Column<string>(type: "text", nullable: true),
                    State = table.Column<string>(type: "text", nullable: true),
                    Pincode = table.Column<string>(type: "text", nullable: true),
                    Phone = table.Column<string>(type: "text", nullable: true),
                    MobileNo = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true),
                    Gstin = table.Column<string>(type: "text", nullable: true),
                    Pan = table.Column<string>(type: "text", nullable: true),
                    CreditLimit = table.Column<decimal>(type: "numeric", nullable: false),
                    CreditDays = table.Column<int>(type: "integer", nullable: false),
                    OpeningBalance = table.Column<decimal>(type: "numeric", nullable: false),
                    OpeningBalanceType = table.Column<string>(type: "text", nullable: false),
                    CustomerType = table.Column<string>(type: "text", nullable: true),
                    ActiveStatus = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_accounts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "app_users",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    year_database_name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    EmployeeId = table.Column<string>(type: "text", nullable: false),
                    Username = table.Column<string>(type: "text", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    FullName = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    RoleId = table.Column<string>(type: "text", nullable: true),
                    Department = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true),
                    ActiveStatus = table.Column<bool>(type: "boolean", nullable: false),
                    CanPrintBarcodeLabels = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "companies",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    year_database_name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Code = table.Column<string>(type: "text", nullable: false),
                    BusinessName = table.Column<string>(type: "text", nullable: false),
                    Tagline = table.Column<string>(type: "text", nullable: true),
                    Address = table.Column<string>(type: "text", nullable: true),
                    Phone = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true),
                    Gstin = table.Column<string>(type: "text", nullable: true),
                    State = table.Column<string>(type: "text", nullable: true),
                    PlaceOfSupply = table.Column<string>(type: "text", nullable: true),
                    LogoText = table.Column<string>(type: "text", nullable: true),
                    LogoImage = table.Column<string>(type: "text", nullable: true),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    ActiveStatus = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_companies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "financial_years",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    FinancialYearName = table.Column<string>(type: "text", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DatabaseName = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Closed = table.Column<bool>(type: "boolean", nullable: false),
                    PreviousYearId = table.Column<string>(type: "text", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_financial_years", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "products",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    year_database_name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Code = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    Unit = table.Column<string>(type: "text", nullable: false),
                    Size = table.Column<string>(type: "text", nullable: true),
                    Length = table.Column<string>(type: "text", nullable: true),
                    Brand = table.Column<string>(type: "text", nullable: true),
                    HsnCode = table.Column<string>(type: "text", nullable: true),
                    SalePrice = table.Column<decimal>(type: "numeric", nullable: false),
                    PurchasePrice = table.Column<decimal>(type: "numeric", nullable: false),
                    ReorderQty = table.Column<decimal>(type: "numeric", nullable: false),
                    MinOrderQty = table.Column<decimal>(type: "numeric", nullable: false),
                    Cgst = table.Column<decimal>(type: "numeric", nullable: false),
                    Sgst = table.Column<decimal>(type: "numeric", nullable: false),
                    Igst = table.Column<decimal>(type: "numeric", nullable: false),
                    ProductType = table.Column<string>(type: "text", nullable: true),
                    ProductMainGroup = table.Column<string>(type: "text", nullable: true),
                    ProductSubGroup = table.Column<string>(type: "text", nullable: true),
                    AssemblyType = table.Column<string>(type: "text", nullable: true),
                    SaleUom = table.Column<string>(type: "text", nullable: true),
                    PurchaseUom = table.Column<string>(type: "text", nullable: true),
                    SerialApplicable = table.Column<bool>(type: "boolean", nullable: false),
                    GstExempt = table.Column<bool>(type: "boolean", nullable: false),
                    ActiveStatus = table.Column<bool>(type: "boolean", nullable: false),
                    ProductImage = table.Column<string>(type: "text", nullable: true),
                    TaxType = table.Column<string>(type: "text", nullable: false),
                    TaxPercent = table.Column<string>(type: "text", nullable: false),
                    StockQty = table.Column<decimal>(type: "numeric", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_products", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "software_licenses",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    Key = table.Column<string>(type: "text", nullable: false),
                    LicenseType = table.Column<string>(type: "text", nullable: false),
                    PlanDays = table.Column<int>(type: "integer", nullable: true),
                    ActivatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    extensions_json = table.Column<string>(type: "jsonb", nullable: false),
                    TotalExtensionDays = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_software_licenses", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_accounts_year_database_name_Code",
                table: "accounts",
                columns: new[] { "year_database_name", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_app_users_year_database_name_Username",
                table: "app_users",
                columns: new[] { "year_database_name", "Username" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_companies_year_database_name_Code",
                table: "companies",
                columns: new[] { "year_database_name", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_financial_years_DatabaseName",
                table: "financial_years",
                column: "DatabaseName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_financial_years_FinancialYearName",
                table: "financial_years",
                column: "FinancialYearName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_products_year_database_name_Code",
                table: "products",
                columns: new[] { "year_database_name", "Code" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "accounts");

            migrationBuilder.DropTable(
                name: "app_users");

            migrationBuilder.DropTable(
                name: "companies");

            migrationBuilder.DropTable(
                name: "financial_years");

            migrationBuilder.DropTable(
                name: "products");

            migrationBuilder.DropTable(
                name: "software_licenses");
        }
    }
}
