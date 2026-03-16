using HandyLink.Core.Entities;
using HandyLink.Core.Interfaces;
using HandyLink.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.Infrastructure.Repositories;

public class BidRepository(HandyLinkDbContext context) : IBidRepository
{
    public Task<Bid?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => context.Bids.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id, ct);

    public Task<Bid?> GetByIdTrackedAsync(Guid id, CancellationToken ct = default)
        => context.Bids.FirstOrDefaultAsync(b => b.Id == id, ct);

    public Task<bool> ExistsAsync(Guid jobId, Guid workerId, CancellationToken ct = default)
        => context.Bids.AnyAsync(b => b.JobId == jobId && b.WorkerId == workerId, ct);

    public async Task<IReadOnlyList<Bid>> GetByJobIdAsync(Guid jobId, CancellationToken ct = default)
        => await context.Bids.AsNoTracking().Where(b => b.JobId == jobId).ToListAsync(ct);

    public async Task<IReadOnlyList<Bid>> GetByJobIdTrackedAsync(Guid jobId, CancellationToken ct = default)
        => await context.Bids.Where(b => b.JobId == jobId).ToListAsync(ct);

    public Task AddAsync(Bid bid, CancellationToken ct = default)
    {
        context.Bids.Add(bid);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken ct = default)
        => context.SaveChangesAsync(ct);
}
