using HandyLink.Core.DTOs;
using HandyLink.Core.Entities;

namespace HandyLink.Core.Interfaces;

public interface IWorkerRepository
{
    Task<PagedResult<WorkerProfile>> GetPagedAsync(int page, int pageSize, CancellationToken ct = default);
    Task<WorkerProfile?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<WorkerProfile?> GetByIdTrackedAsync(Guid id, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
