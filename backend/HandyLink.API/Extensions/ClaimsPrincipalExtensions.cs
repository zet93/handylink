using System.Security.Claims;
using HandyLink.Core.Exceptions;

namespace HandyLink.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetSupabaseUserId(this ClaimsPrincipal user)
    {
        var sub = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
               ?? user.FindFirst("sub")?.Value
               ?? throw new ForbiddenException("User ID not found in token");
        return Guid.Parse(sub);
    }
}
