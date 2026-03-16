using HandyLink.Core.Entities;

namespace HandyLink.Core.Interfaces;

public interface INotificationRepository
{
    Task<IReadOnlyList<Notification>> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<Notification?> GetByIdTrackedAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Notification notification, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
