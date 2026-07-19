namespace IMS.Helpers;

public static class ApplicationState
{
    public static bool IsShuttingDown { get; set; }
    public static bool IsSigningOut { get; set; }
}
