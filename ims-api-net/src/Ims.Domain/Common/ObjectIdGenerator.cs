using System.Security.Cryptography;

namespace Ims.Domain.Common;

/// <summary>Generates 24-char hex strings compatible with MongoDB ObjectId format for API parity.</summary>
public static class ObjectIdGenerator
{
    public static string NewId()
    {
        Span<byte> bytes = stackalloc byte[12];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
