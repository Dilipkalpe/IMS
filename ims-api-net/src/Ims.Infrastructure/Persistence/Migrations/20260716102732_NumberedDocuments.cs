using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ims.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class NumberedDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "counters",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    year_database_name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Key = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Value = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_counters", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "delivery_challans",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    year_database_name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    doc_prefix = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    DocNo = table.Column<int>(type: "integer", nullable: false),
                    formatted_doc_no = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Status = table.Column<string>(type: "text", nullable: true),
                    Customer = table.Column<string>(type: "text", nullable: true),
                    Supplier = table.Column<string>(type: "text", nullable: true),
                    SalesMan = table.Column<string>(type: "text", nullable: true),
                    Narration = table.Column<string>(type: "text", nullable: true),
                    tran_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    body_json = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_delivery_challans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "grns",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    year_database_name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    doc_prefix = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    DocNo = table.Column<int>(type: "integer", nullable: false),
                    formatted_doc_no = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Status = table.Column<string>(type: "text", nullable: true),
                    Customer = table.Column<string>(type: "text", nullable: true),
                    Supplier = table.Column<string>(type: "text", nullable: true),
                    SalesMan = table.Column<string>(type: "text", nullable: true),
                    Narration = table.Column<string>(type: "text", nullable: true),
                    tran_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    body_json = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_grns", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "purchase_invoices",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    year_database_name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    doc_prefix = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    DocNo = table.Column<int>(type: "integer", nullable: false),
                    formatted_doc_no = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Status = table.Column<string>(type: "text", nullable: true),
                    Customer = table.Column<string>(type: "text", nullable: true),
                    Supplier = table.Column<string>(type: "text", nullable: true),
                    SalesMan = table.Column<string>(type: "text", nullable: true),
                    Narration = table.Column<string>(type: "text", nullable: true),
                    tran_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    body_json = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_purchase_invoices", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "purchase_orders",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    year_database_name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    doc_prefix = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    DocNo = table.Column<int>(type: "integer", nullable: false),
                    formatted_doc_no = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Status = table.Column<string>(type: "text", nullable: true),
                    Customer = table.Column<string>(type: "text", nullable: true),
                    Supplier = table.Column<string>(type: "text", nullable: true),
                    SalesMan = table.Column<string>(type: "text", nullable: true),
                    Narration = table.Column<string>(type: "text", nullable: true),
                    tran_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    body_json = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_purchase_orders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "purchase_returns",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    year_database_name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    doc_prefix = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    DocNo = table.Column<int>(type: "integer", nullable: false),
                    formatted_doc_no = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Status = table.Column<string>(type: "text", nullable: true),
                    Customer = table.Column<string>(type: "text", nullable: true),
                    Supplier = table.Column<string>(type: "text", nullable: true),
                    SalesMan = table.Column<string>(type: "text", nullable: true),
                    Narration = table.Column<string>(type: "text", nullable: true),
                    tran_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    body_json = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_purchase_returns", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "sales_invoices",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    year_database_name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    doc_prefix = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    DocNo = table.Column<int>(type: "integer", nullable: false),
                    formatted_doc_no = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Status = table.Column<string>(type: "text", nullable: true),
                    Customer = table.Column<string>(type: "text", nullable: true),
                    Supplier = table.Column<string>(type: "text", nullable: true),
                    SalesMan = table.Column<string>(type: "text", nullable: true),
                    Narration = table.Column<string>(type: "text", nullable: true),
                    tran_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    body_json = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sales_invoices", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "sales_returns",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    year_database_name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    doc_prefix = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    DocNo = table.Column<int>(type: "integer", nullable: false),
                    formatted_doc_no = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Status = table.Column<string>(type: "text", nullable: true),
                    Customer = table.Column<string>(type: "text", nullable: true),
                    Supplier = table.Column<string>(type: "text", nullable: true),
                    SalesMan = table.Column<string>(type: "text", nullable: true),
                    Narration = table.Column<string>(type: "text", nullable: true),
                    tran_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    body_json = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sales_returns", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_counters_year_database_name_Key",
                table: "counters",
                columns: new[] { "year_database_name", "Key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_delivery_challans_year_database_name_doc_prefix_DocNo",
                table: "delivery_challans",
                columns: new[] { "year_database_name", "doc_prefix", "DocNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_delivery_challans_year_database_name_formatted_doc_no",
                table: "delivery_challans",
                columns: new[] { "year_database_name", "formatted_doc_no" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_grns_year_database_name_doc_prefix_DocNo",
                table: "grns",
                columns: new[] { "year_database_name", "doc_prefix", "DocNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_grns_year_database_name_formatted_doc_no",
                table: "grns",
                columns: new[] { "year_database_name", "formatted_doc_no" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_purchase_invoices_year_database_name_doc_prefix_DocNo",
                table: "purchase_invoices",
                columns: new[] { "year_database_name", "doc_prefix", "DocNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_purchase_invoices_year_database_name_formatted_doc_no",
                table: "purchase_invoices",
                columns: new[] { "year_database_name", "formatted_doc_no" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_purchase_orders_year_database_name_doc_prefix_DocNo",
                table: "purchase_orders",
                columns: new[] { "year_database_name", "doc_prefix", "DocNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_purchase_orders_year_database_name_formatted_doc_no",
                table: "purchase_orders",
                columns: new[] { "year_database_name", "formatted_doc_no" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_purchase_returns_year_database_name_doc_prefix_DocNo",
                table: "purchase_returns",
                columns: new[] { "year_database_name", "doc_prefix", "DocNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_purchase_returns_year_database_name_formatted_doc_no",
                table: "purchase_returns",
                columns: new[] { "year_database_name", "formatted_doc_no" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sales_invoices_year_database_name_doc_prefix_DocNo",
                table: "sales_invoices",
                columns: new[] { "year_database_name", "doc_prefix", "DocNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sales_invoices_year_database_name_formatted_doc_no",
                table: "sales_invoices",
                columns: new[] { "year_database_name", "formatted_doc_no" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sales_returns_year_database_name_doc_prefix_DocNo",
                table: "sales_returns",
                columns: new[] { "year_database_name", "doc_prefix", "DocNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sales_returns_year_database_name_formatted_doc_no",
                table: "sales_returns",
                columns: new[] { "year_database_name", "formatted_doc_no" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "counters");

            migrationBuilder.DropTable(
                name: "delivery_challans");

            migrationBuilder.DropTable(
                name: "grns");

            migrationBuilder.DropTable(
                name: "purchase_invoices");

            migrationBuilder.DropTable(
                name: "purchase_orders");

            migrationBuilder.DropTable(
                name: "purchase_returns");

            migrationBuilder.DropTable(
                name: "sales_invoices");

            migrationBuilder.DropTable(
                name: "sales_returns");
        }
    }
}
