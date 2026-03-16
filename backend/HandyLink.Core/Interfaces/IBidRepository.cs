using HandyLink.Core.Entities;

namespace HandyLink.Core.Interfaces;

public interface IBidRepository
{
    Task<Bid?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Bid?> GetByIdTrackedAsync(Guid id, CancellationToken ct = default);
    Task<bool> ExistsAsync(Guid jobId, Guid workerId, CancellationToken ct = default);
    Task<IReadOnlyList<Bid>> GetByJobIdAsync(Guid jobId, CancellationToken ct = default);
    Task<IReadOnlyList<Bid>> GetByJobIdTrackedAsync(Guid jobId, CancellationToken ct = default);
    Task AddAsync(Bid bid, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
