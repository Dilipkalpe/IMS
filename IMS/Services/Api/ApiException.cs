namespace IMS.Services.Api;

public sealed class ApiException : Exception
{
    public ApiException(string message) : base(message) { }

    public ApiException(string message, Exception inner) : base(message, inner) { }
}
