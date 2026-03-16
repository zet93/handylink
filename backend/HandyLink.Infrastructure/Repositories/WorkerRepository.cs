using HandyLink.Core.DTOs;
using HandyLink.Core.Entities;
using HandyLink.Core.Interfaces;
using HandyLink.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.Infrastructure.Repositories;

public class WorkerRepository(HandyLinkDbContext context) : IWorkerRepository
{
    public async Task<PagedResult<WorkerProfile>> GetPagedAsync(int page, int pageSize, CancellationToken ct = default)
    {
        var query = context.WorkerProfiles.Include(w => w.Profile).AsNoTracking();
        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(w => w.AverageRating)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
        return new PagedResult<WorkerProfile>(items, total, page, pageSize);
    }

    public Task<WorkerProfile?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => context.WorkerProfiles.Include(w => w.Profile).AsNoTracking().FirstOrDefaultAsync(w => w.Id == id, ct);

    public Task<WorkerProfile?> GetByIdTrackedAsync(Guid id, CancellationToken ct = default)
        => context.WorkerProfiles.FirstOrDefaultAsync(w => w.Id == id, ct);

    public Task SaveChangesAsync(CancellationToken ct = default)
        => context.SaveChangesAsync(ct);
}
