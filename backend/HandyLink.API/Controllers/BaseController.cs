using HandyLink.API.Extensions;
using Microsoft.AspNetCore.Mvc;

namespace HandyLink.API.Controllers;

[ApiController]
public abstract class BaseController : ControllerBase
{
    protected Guid GetUserId() => User.GetSupabaseUserId();
}
