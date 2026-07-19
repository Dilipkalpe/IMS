-- =============================================================================
-- ERP Custom Reporting Framework — SQL Server Schema
-- No third-party report designers; layouts stored as JSON.
-- =============================================================================

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- -----------------------------------------------------------------------------
-- Entry types (extensible without code changes)
-- -----------------------------------------------------------------------------
CREATE TABLE dbo.ReportEntryType (
    EntryTypeKey       NVARCHAR(40)  NOT NULL PRIMARY KEY,  -- sales_invoice, grn, ...
    DisplayName        NVARCHAR(120) NOT NULL,
    Category           NVARCHAR(20)  NOT NULL,              -- sales | purchase | inventory
    PartyKind          NVARCHAR(20)  NOT NULL DEFAULT N'customer', -- customer | supplier | none
    IsActive           BIT           NOT NULL DEFAULT 1,
    SortOrder          INT           NOT NULL DEFAULT 0
);
GO

INSERT INTO dbo.ReportEntryType (EntryTypeKey, DisplayName, Category, PartyKind, SortOrder) VALUES
(N'sales_invoice',     N'Sales Invoice',       N'sales',    N'customer', 10),
(N'sales_order',       N'Sales Order',         N'sales',    N'customer', 20),
(N'sales_return',      N'Sales Return',        N'sales',    N'customer', 30),
(N'delivery_challan',  N'Delivery Challan',    N'sales',    N'customer', 40),
(N'purchase_invoice',  N'Purchase Invoice',    N'purchase', N'supplier', 50),
(N'purchase_order',    N'Purchase Order',      N'purchase', N'supplier', 60),
(N'purchase_return',   N'Purchase Return',     N'purchase', N'supplier', 70),
(N'grn',               N'GRN',                 N'purchase', N'supplier', 80);
GO

-- -----------------------------------------------------------------------------
-- Paper presets (built-in + custom)
-- -----------------------------------------------------------------------------
CREATE TABLE dbo.ReportPaperPreset (
    PaperKey           NVARCHAR(40)  NOT NULL PRIMARY KEY,
    DisplayName        NVARCHAR(80)  NOT NULL,
    WidthMm            DECIMAL(8,2)  NOT NULL,
    HeightMm           DECIMAL(8,2)  NOT NULL,
    IsThermal          BIT           NOT NULL DEFAULT 0,
    IsSystem           BIT           NOT NULL DEFAULT 1
);
GO

INSERT INTO dbo.ReportPaperPreset (PaperKey, DisplayName, WidthMm, HeightMm, IsThermal) VALUES
(N'A4_PORTRAIT',   N'A4 Portrait',   210, 297, 0),
(N'A4_LANDSCAPE',  N'A4 Landscape',  297, 210, 0),
(N'A5_PORTRAIT',   N'A5 Portrait',   148, 210, 0),
(N'A5_LANDSCAPE',  N'A5 Landscape',  210, 148, 0),
(N'LETTER',        N'Letter',        216, 279, 0),
(N'THERMAL_58',    N'Thermal 58mm',   58, 297, 1),
(N'THERMAL_80',    N'Thermal 80mm',   80, 297, 1),
(N'CUSTOM',        N'Custom',        210, 297, 0);
GO

-- -----------------------------------------------------------------------------
-- Report format master
-- -----------------------------------------------------------------------------
CREATE TABLE dbo.ReportFormatMaster (
    ReportFormatId     BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    FormatCode         NVARCHAR(40)  NOT NULL,
    FormatName         NVARCHAR(120) NOT NULL,
    EntryTypeKey       NVARCHAR(40)  NOT NULL,
    PaperKey           NVARCHAR(40)  NOT NULL DEFAULT N'A4_PORTRAIT',
    Orientation        NVARCHAR(20)  NOT NULL DEFAULT N'portrait', -- portrait | landscape
    -- Custom paper when PaperKey = CUSTOM (overrides preset mm if set)
    CustomWidthMm      DECIMAL(8,2)  NULL,
    CustomHeightMm     DECIMAL(8,2)  NULL,
    MarginTopMm        DECIMAL(8,2)  NOT NULL DEFAULT 10,
    MarginRightMm      DECIMAL(8,2)  NOT NULL DEFAULT 10,
    MarginBottomMm     DECIMAL(8,2)  NOT NULL DEFAULT 10,
    MarginLeftMm       DECIMAL(8,2)  NOT NULL DEFAULT 10,
    LayoutJson         NVARCHAR(MAX) NOT NULL,
    SchemaVersion      INT           NOT NULL DEFAULT 1,
    IsDefault          BIT           NOT NULL DEFAULT 0,
    IsActive           BIT           NOT NULL DEFAULT 1,
    PrintPreviewOnSave BIT           NOT NULL DEFAULT 0,
    AutoPrintOnSave    BIT           NOT NULL DEFAULT 0,
    DefaultCopies      INT           NOT NULL DEFAULT 1,
    WatermarkType      NVARCHAR(30)  NOT NULL DEFAULT N'original',
    CreatedAtUtc       DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedAtUtc      DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy          NVARCHAR(80)  NULL,
    ModifiedBy         NVARCHAR(80)  NULL,
    CONSTRAINT FK_ReportFormatMaster_EntryType
        FOREIGN KEY (EntryTypeKey) REFERENCES dbo.ReportEntryType(EntryTypeKey),
    CONSTRAINT FK_ReportFormatMaster_Paper
        FOREIGN KEY (PaperKey) REFERENCES dbo.ReportPaperPreset(PaperKey),
    CONSTRAINT UQ_ReportFormatMaster_Code UNIQUE (FormatCode)
);
GO

CREATE INDEX IX_ReportFormatMaster_EntryType ON dbo.ReportFormatMaster(EntryTypeKey, IsActive, IsDefault);
GO

-- Only one default per entry type
CREATE UNIQUE INDEX UX_ReportFormatMaster_DefaultPerEntry
    ON dbo.ReportFormatMaster(EntryTypeKey)
    WHERE IsDefault = 1 AND IsActive = 1;
GO

-- -----------------------------------------------------------------------------
-- Optional version history (audit / rollback)
-- -----------------------------------------------------------------------------
CREATE TABLE dbo.ReportFormatVersion (
    VersionId          BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ReportFormatId     BIGINT NOT NULL,
    LayoutJson         NVARCHAR(MAX) NOT NULL,
    SchemaVersion      INT NOT NULL,
    SavedAtUtc         DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    SavedBy            NVARCHAR(80) NULL,
    CONSTRAINT FK_ReportFormatVersion_Master
        FOREIGN KEY (ReportFormatId) REFERENCES dbo.ReportFormatMaster(ReportFormatId) ON DELETE CASCADE
);
GO

-- -----------------------------------------------------------------------------
-- Dynamic field catalog (designer + binding without code changes)
-- -----------------------------------------------------------------------------
CREATE TABLE dbo.ReportFieldCatalog (
    FieldKey           NVARCHAR(80)  NOT NULL,
    EntryTypeKey       NVARCHAR(40)  NOT NULL,  -- or '*' for all
    DisplayLabel       NVARCHAR(120) NOT NULL,
    Token              NVARCHAR(120) NOT NULL,  -- {{invoiceNo}}
    DataType           NVARCHAR(20)  NOT NULL DEFAULT N'string', -- string|decimal|date|image|lines
    Category           NVARCHAR(40)  NOT NULL,  -- company|document|party|lines|tax|footer
    SortOrder          INT NOT NULL DEFAULT 0,
    IsActive           BIT NOT NULL DEFAULT 1,
    PRIMARY KEY (FieldKey, EntryTypeKey),
    CONSTRAINT FK_ReportFieldCatalog_EntryType
        FOREIGN KEY (EntryTypeKey) REFERENCES dbo.ReportEntryType(EntryTypeKey)
);
GO

-- -----------------------------------------------------------------------------
-- Customer format mapping
-- -----------------------------------------------------------------------------
CREATE TABLE dbo.CustomerReportFormatMapping (
    MappingId          BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    CustomerCode       NVARCHAR(40)  NOT NULL,
    EntryTypeKey       NVARCHAR(40)  NOT NULL,
    ReportFormatId     BIGINT        NOT NULL,
    IsActive           BIT           NOT NULL DEFAULT 1,
    CreatedAtUtc       DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_CustMap_EntryType FOREIGN KEY (EntryTypeKey) REFERENCES dbo.ReportEntryType(EntryTypeKey),
    CONSTRAINT FK_CustMap_Format FOREIGN KEY (ReportFormatId) REFERENCES dbo.ReportFormatMaster(ReportFormatId),
    CONSTRAINT UQ_CustMap UNIQUE (CustomerCode, EntryTypeKey)
);
GO

-- -----------------------------------------------------------------------------
-- Supplier format mapping
-- -----------------------------------------------------------------------------
CREATE TABLE dbo.SupplierReportFormatMapping (
    MappingId          BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    SupplierCode       NVARCHAR(40)  NOT NULL,
    EntryTypeKey       NVARCHAR(40)  NOT NULL,
    ReportFormatId     BIGINT        NOT NULL,
    IsActive           BIT           NOT NULL DEFAULT 1,
    CreatedAtUtc       DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_SuppMap_EntryType FOREIGN KEY (EntryTypeKey) REFERENCES dbo.ReportEntryType(EntryTypeKey),
    CONSTRAINT FK_SuppMap_Format FOREIGN KEY (ReportFormatId) REFERENCES dbo.ReportFormatMaster(ReportFormatId),
    CONSTRAINT UQ_SuppMap UNIQUE (SupplierCode, EntryTypeKey)
);
GO

-- -----------------------------------------------------------------------------
-- Label format master (barcode / QR labels — separate from documents)
-- -----------------------------------------------------------------------------
CREATE TABLE dbo.LabelFormatMaster (
    LabelFormatId      BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    FormatCode         NVARCHAR(40)  NOT NULL,
    FormatName         NVARCHAR(120) NOT NULL,
    LabelCategory      NVARCHAR(40)  NOT NULL DEFAULT N'product', -- product|batch|inventory|payment
    WidthMm            DECIMAL(8,2)  NOT NULL,
    HeightMm           DECIMAL(8,2)  NOT NULL,
    LayoutJson         NVARCHAR(MAX) NOT NULL,
    SchemaVersion      INT           NOT NULL DEFAULT 1,
    IsDefault          BIT           NOT NULL DEFAULT 0,
    IsActive           BIT           NOT NULL DEFAULT 1,
    CreatedAtUtc       DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedAtUtc      DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_LabelFormatMaster_Code UNIQUE (FormatCode)
);
GO

CREATE TABLE dbo.LabelSizePreset (
    SizeKey            NVARCHAR(40) NOT NULL PRIMARY KEY,
    DisplayName        NVARCHAR(80) NOT NULL,
    WidthMm            DECIMAL(8,2) NOT NULL,
    HeightMm           DECIMAL(8,2) NOT NULL
);
GO

INSERT INTO dbo.LabelSizePreset (SizeKey, DisplayName, WidthMm, HeightMm) VALUES
(N'25x15',   N'25 × 15 mm',  25, 15),
(N'38x25',   N'38 × 25 mm',  38, 25),
(N'50x25',   N'50 × 25 mm',  50, 25),
(N'50x50',   N'50 × 50 mm',  50, 50),
(N'75x50',   N'75 × 50 mm',  75, 50),
(N'100x50',  N'100 × 50 mm', 100, 50),
(N'100x150', N'100 × 150 mm', 100, 150);
GO

-- -----------------------------------------------------------------------------
-- Resolve format (example stored procedure)
-- -----------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.usp_ReportFormat_Resolve
    @EntryTypeKey NVARCHAR(40),
    @PartyKind    NVARCHAR(20),  -- customer | supplier | none
    @PartyCode    NVARCHAR(40)  = NULL,
    @ReportFormatId BIGINT OUTPUT
AS
SET NOCOUNT ON;

SET @ReportFormatId = NULL;

IF @PartyKind = N'customer' AND @PartyCode IS NOT NULL
BEGIN
    SELECT @ReportFormatId = m.ReportFormatId
    FROM dbo.CustomerReportFormatMapping map
    INNER JOIN dbo.ReportFormatMaster m ON m.ReportFormatId = map.ReportFormatId AND m.IsActive = 1
    WHERE map.CustomerCode = @PartyCode AND map.EntryTypeKey = @EntryTypeKey AND map.IsActive = 1;
END

IF @ReportFormatId IS NULL AND @PartyKind = N'supplier' AND @PartyCode IS NOT NULL
BEGIN
    SELECT @ReportFormatId = m.ReportFormatId
    FROM dbo.SupplierReportFormatMapping map
    INNER JOIN dbo.ReportFormatMaster m ON m.ReportFormatId = map.ReportFormatId AND m.IsActive = 1
    WHERE map.SupplierCode = @PartyCode AND map.EntryTypeKey = @EntryTypeKey AND map.IsActive = 1;
END

IF @ReportFormatId IS NULL
BEGIN
    SELECT TOP (1) @ReportFormatId = ReportFormatId
    FROM dbo.ReportFormatMaster
    WHERE EntryTypeKey = @EntryTypeKey AND IsDefault = 1 AND IsActive = 1
    ORDER BY ReportFormatId;
END
GO
