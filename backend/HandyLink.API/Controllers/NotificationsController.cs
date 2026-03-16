using HandyLink.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HandyLink.API.Controllers;

[Route("api/notifications")]
[Authorize]
public class NotificationsController(NotificationService notificationService) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetNotifications(CancellationToken ct)
        => Ok(await notificationService.GetForUserAsync(GetUserId(), ct));

    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken ct)
    {
        await notificationService.MarkReadAsync(GetUserId(), id, ct);
        return NoContent();
    }
}
