-- Reference SQL schema for Role-Based Menu Permission Management.
-- IMS production API uses MongoDB; collections map as noted below.

-- Role_Master  ->  MongoDB collection: Role_Master
CREATE TABLE Role_Master (
    RoleId          INT IDENTITY(1,1) PRIMARY KEY,
    RoleName        NVARCHAR(100) NOT NULL UNIQUE,
    IsActive        BIT NOT NULL DEFAULT 1,
    IsDeleted       BIT NOT NULL DEFAULT 0,
    IsSystem        BIT NOT NULL DEFAULT 0,
    CreatedBy       NVARCHAR(100) NULL,
    CreatedDate     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedBy      NVARCHAR(100) NULL,
    ModifiedDate    DATETIME2 NULL
);

-- Menu_Master  ->  MongoDB collection: Menu_Master
CREATE TABLE Menu_Master (
    MenuId          INT IDENTITY(1,1) PRIMARY KEY,
    MenuKey         NVARCHAR(100) NOT NULL UNIQUE,
    MenuName        NVARCHAR(200) NOT NULL,
    ParentMenuId    INT NULL REFERENCES Menu_Master(MenuId),
    MenuUrl         NVARCHAR(500) NULL,
    MenuOrder       INT NOT NULL DEFAULT 0,
    Icon            NVARCHAR(50) NULL,
    IsActive        BIT NOT NULL DEFAULT 1,
    IsSection       BIT NOT NULL DEFAULT 0
);

-- Role_Menu_Permission  ->  MongoDB collection: Role_Menu_Permission
CREATE TABLE Role_Menu_Permission (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    RoleId          INT NOT NULL REFERENCES Role_Master(RoleId),
    MenuId          INT NOT NULL REFERENCES Menu_Master(MenuId),
    CanView         BIT NOT NULL DEFAULT 0,
    CanAdd          BIT NOT NULL DEFAULT 0,
    CanEdit         BIT NOT NULL DEFAULT 0,
    CanDelete       BIT NOT NULL DEFAULT 0,
    CanExport       BIT NOT NULL DEFAULT 0,
    CreatedDate     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_Role_Menu UNIQUE (RoleId, MenuId)
);

-- App user role link (optional FK)
-- ALTER TABLE AppUser ADD RoleId INT NULL REFERENCES Role_Master(RoleId);

CREATE INDEX IX_Menu_Master_Parent ON Menu_Master(ParentMenuId, MenuOrder);
CREATE INDEX IX_Role_Menu_Permission_Role ON Role_Menu_Permission(RoleId);
