using IMS.Services.Api;

namespace IMS.Models;

public sealed class AppSettings
{
    /// <summary>Increment when a one-time migration is required in SettingsStore.</summary>
    public int SettingsVersion { get; set; }

    public string ThemeId { get; set; } = "EmeraldForest";
    public string ApiBaseUrl { get; set; } = ApiEndpointProfiles.OnlineApiBaseUrl;
    /// <summary>online | local | iis | custom — see ApiEndpointProfiles.</summary>
    public string ApiEndpointProfile { get; set; } = ApiEndpointProfiles.OnlineId;
    /// <summary>Host name for IIS presets (e.g. localhost or server PC name).</summary>
    public string IisServerHost { get; set; } = "localhost";
    /// <summary>Optional override for IMSWebApp URL. When empty, derived from IIS host.</summary>
    public string WebAppBaseUrl { get; set; } = string.Empty;
    public string? RememberedLoginId { get; set; }
    public bool RememberLogin { get; set; }
    public bool LoginDarkMode { get; set; }
    public List<string> PinnedNavKeys { get; set; } = [];
    public List<string> CollapsedSections { get; set; } = [];
    public bool SidebarCollapsed { get; set; }
    public SalesOrderPrintSettings SalesOrderPrint { get; set; } = new();
    public string DatabaseBackupFolder { get; set; } = string.Empty;
    public string MongoDbConnectionUri { get; set; } = string.Empty;
    public ExitBackupPreference ExitBackupPreference { get; set; } = ExitBackupPreference.AlwaysAsk;
    public CommunicationSettings Communication { get; set; } = new();
    public SalesPurchaseSettings SalesPurchase { get; set; } = new();
}
