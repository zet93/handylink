using HandyLink.Core.DTOs;
using HandyLink.Core.Entities;
using HandyLink.Core.Exceptions;
using HandyLink.Core.Interfaces;

namespace HandyLink.Core.Services;

public class NotificationService(INotificationRepository notifications)
{
    public async Task CreateAsync(Guid userId, string title, string body, string type, Guid? referenceId = null, CancellationToken ct = default)
    {
        var n = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = title,
            Body = body,
            Type = type,
            ReferenceId = referenceId,
            IsRead = false,
            CreatedAt = DateTimeOffset.UtcNow
        };
        await notifications.AddAsync(n, ct);
        await notifications.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<NotificationResponseDto>> GetForUserAsync(Guid userId, CancellationToken ct = default)
    {
        var items = await notifications.GetByUserIdAsync(userId, ct);
        return items.Select(n => new NotificationResponseDto(
            n.Id, n.Title, n.Body, n.Type, n.ReferenceId, n.IsRead, n.CreatedAt)).ToList();
    }

    public async Task MarkReadAsync(Guid userId, Guid notificationId, CancellationToken ct = default)
    {
        var n = await notifications.GetByIdTrackedAsync(notificationId, ct)
            ?? throw new NotFoundException($"Notification {notificationId} not found");
        if (n.UserId != userId) throw new ForbiddenException("Not your notification");
        n.IsRead = true;
        await notifications.SaveChangesAsync(ct);
    }
}
