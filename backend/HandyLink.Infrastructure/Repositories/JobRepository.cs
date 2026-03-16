using HandyLink.Core.DTOs;
using HandyLink.Core.Entities;
using HandyLink.Core.Interfaces;
using HandyLink.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.Infrastructure.Repositories;

public class JobRepository(HandyLinkDbContext context) : IJobRepository
{
    public Task<Job?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => context.Jobs.AsNoTracking().FirstOrDefaultAsync(j => j.Id == id, ct);

    public Task<Job?> GetByIdTrackedAsync(Guid id, CancellationToken ct = default)
        => context.Jobs.FirstOrDefaultAsync(j => j.Id == id, ct);

    public async Task<PagedResult<Job>> GetPagedAsync(JobFilter filter, CancellationToken ct = default)
    {
        var query = context.Jobs.AsNoTracking().AsQueryable();
        if (filter.Category.HasValue) query = query.Where(j => j.Category == filter.Category);
        if (filter.Status.HasValue)   query = query.Where(j => j.Status == filter.Status);
        if (!string.IsNullOrEmpty(filter.City))    query = query.Where(j => j.City == filter.City);
        if (!string.IsNullOrEmpty(filter.Country)) query = query.Where(j => j.Country == filter.Country);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(j => j.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(ct);

        return new PagedResult<Job>(items, total, filter.Page, filter.PageSize);
    }

    public Task AddAsync(Job job, CancellationToken ct = default)
    {
        context.Jobs.Add(job);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken ct = default)
        => context.SaveChangesAsync(ct);
}
