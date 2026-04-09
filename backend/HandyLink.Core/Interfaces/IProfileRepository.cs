using HandyLink.Core.Entities;

namespace HandyLink.Core.Interfaces;

public interface IProfileRepository
{
    Task<Profile?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Profile?> GetByIdTrackedAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Profile profile, CancellationToken ct = default);
    Task AddWorkerProfileAsync(WorkerProfile workerProfile, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
