using System.Security.Claims;
using HandyLink.Core.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace HandyLink.API.Controllers;

[ApiController]
public abstract class BaseController : ControllerBase
{
    protected Guid GetUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? throw new ForbiddenException("User ID not found in token");
        return Guid.Parse(sub);
    }
}
