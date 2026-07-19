using System.Text.Json.Serialization;

namespace IMS.Services.Api.Dtos;

public sealed class RoleDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("roleName")]
    public string RoleName { get; set; } = string.Empty;

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }

    [JsonPropertyName("isSystem")]
    public bool IsSystem { get; set; }

    [JsonPropertyName("isDeleted")]
    public bool IsDeleted { get; set; }
}

public sealed class RoleListResponseDto
{
    [JsonPropertyName("items")]
    public List<RoleDto> Items { get; set; } = [];
}

public sealed class RoleNamesResponseDto
{
    [JsonPropertyName("items")]
    public List<string> Items { get; set; } = [];
}

public sealed class MenuMasterDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("menuKey")]
    public string MenuKey { get; set; } = string.Empty;

    [JsonPropertyName("menuName")]
    public string MenuName { get; set; } = string.Empty;

    [JsonPropertyName("parentMenuKey")]
    public string? ParentMenuKey { get; set; }

    [JsonPropertyName("menuUrl")]
    public string MenuUrl { get; set; } = string.Empty;

    [JsonPropertyName("menuOrder")]
    public int MenuOrder { get; set; }

    [JsonPropertyName("isSection")]
    public bool IsSection { get; set; }

    [JsonPropertyName("children")]
    public List<MenuMasterDto> Children { get; set; } = [];
}

public sealed class MenuPermissionDto
{
    [JsonPropertyName("menuKey")]
    public string MenuKey { get; set; } = string.Empty;

    [JsonPropertyName("menuId")]
    public string? MenuId { get; set; }

    [JsonPropertyName("canView")]
    public bool CanView { get; set; }

    [JsonPropertyName("canAdd")]
    public bool CanAdd { get; set; }

    [JsonPropertyName("canEdit")]
    public bool CanEdit { get; set; }

    [JsonPropertyName("canDelete")]
    public bool CanDelete { get; set; }

    [JsonPropertyName("canExport")]
    public bool CanExport { get; set; }
}

public sealed class RoleDetailResponseDto
{
    [JsonPropertyName("role")]
    public RoleDto? Role { get; set; }

    [JsonPropertyName("menus")]
    public List<MenuMasterDto> Menus { get; set; } = [];

    [JsonPropertyName("permissions")]
    public List<MenuPermissionDto> Permissions { get; set; } = [];
}

public sealed class MenuTreeResponseDto
{
    [JsonPropertyName("menus")]
    public List<MenuMasterDto> Menus { get; set; } = [];
}

public sealed class RoleSaveRequestDto
{
    [JsonPropertyName("roleName")]
    public string RoleName { get; set; } = string.Empty;

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;

    [JsonPropertyName("permissions")]
    public List<MenuPermissionDto> Permissions { get; set; } = [];
}
