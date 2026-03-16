using HandyLink.Core.DTOs;
using HandyLink.Core.Entities;

namespace HandyLink.Core.Interfaces;

public interface IJobRepository
{
    Task<Job?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Job?> GetByIdTrackedAsync(Guid id, CancellationToken ct = default);
    Task<PagedResult<Job>> GetPagedAsync(JobFilter filter, CancellationToken ct = default);
    Task AddAsync(Job job, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
