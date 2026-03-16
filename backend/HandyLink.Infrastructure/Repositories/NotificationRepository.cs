using HandyLink.Core.Entities;
using HandyLink.Core.Interfaces;
using HandyLink.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.Infrastructure.Repositories;

public class NotificationRepository(HandyLinkDbContext context) : INotificationRepository
{
    public async Task<IReadOnlyList<Notification>> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
        => await context.Notifications.AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync(ct);

    public Task<Notification?> GetByIdTrackedAsync(Guid id, CancellationToken ct = default)
        => context.Notifications.FirstOrDefaultAsync(n => n.Id == id, ct);

    public Task AddAsync(Notification notification, CancellationToken ct = default)
    {
        context.Notifications.Add(notification);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken ct = default)
        => context.SaveChangesAsync(ct);
}
