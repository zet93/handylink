using HandyLink.Core.Entities;

namespace HandyLink.Core.Interfaces;

public interface IReviewRepository
{
    Task<bool> ExistsAsync(Guid jobId, Guid reviewerId, CancellationToken ct = default);
    Task<decimal> GetAverageRatingAsync(Guid workerId, CancellationToken ct = default);
    Task<int> GetTotalReviewsAsync(Guid workerId, CancellationToken ct = default);
    Task AddAsync(Review review, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
