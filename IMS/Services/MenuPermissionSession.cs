using IMS.Services.Api.Dtos;

namespace IMS.Services;

public static class MenuPermissionSession
{
    private static readonly Dictionary<string, MenuPermissionDto> ByKey =
        new(StringComparer.OrdinalIgnoreCase);

    public static void Set(IEnumerable<MenuPermissionDto>? permissions)
    {
        ByKey.Clear();
        if (permissions is null) return;
        foreach (var p in permissions)
        {
            if (string.IsNullOrWhiteSpace(p.MenuKey)) continue;
            ByKey[p.MenuKey] = p;
        }
    }

    public static void Clear() => ByKey.Clear();

    public static bool CanView(string menuKey) => Get(menuKey)?.CanView == true || AuthSession.IsAdministrator;

    public static bool CanAdd(string menuKey) => Get(menuKey)?.CanAdd == true || AuthSession.IsAdministrator;

    public static bool CanEdit(string menuKey) => Get(menuKey)?.CanEdit == true || AuthSession.IsAdministrator;

    public static bool CanDelete(string menuKey) => Get(menuKey)?.CanDelete == true || AuthSession.IsAdministrator;

    public static bool CanExport(string menuKey) => Get(menuKey)?.CanExport == true || AuthSession.IsAdministrator;

    public static bool CanManageRoles =>
        AuthSession.IsAdministrator || CanEdit(NavKeys.RoleMaster);

    public static MenuPermissionDto? Get(string menuKey) =>
        ByKey.TryGetValue(menuKey, out var p) ? p : null;

    public static IReadOnlyCollection<MenuPermissionDto> All => ByKey.Values;
}
