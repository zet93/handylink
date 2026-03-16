using HandyLink.Core.Entities;
using HandyLink.Core.Interfaces;
using HandyLink.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.Infrastructure.Repositories;

public class ReviewRepository(HandyLinkDbContext context) : IReviewRepository
{
    public Task<bool> ExistsAsync(Guid jobId, Guid reviewerId, CancellationToken ct = default)
        => context.Reviews.AnyAsync(r => r.JobId == jobId && r.ReviewerId == reviewerId, ct);

    public async Task<decimal> GetAverageRatingAsync(Guid workerId, CancellationToken ct = default)
        => await context.Reviews.Where(r => r.WorkerId == workerId)
            .AverageAsync(r => (decimal?)r.Rating, ct) ?? 0m;

    public Task<int> GetTotalReviewsAsync(Guid workerId, CancellationToken ct = default)
        => context.Reviews.CountAsync(r => r.WorkerId == workerId, ct);

    public Task AddAsync(Review review, CancellationToken ct = default)
    {
        context.Reviews.Add(review);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken ct = default)
        => context.SaveChangesAsync(ct);
}
