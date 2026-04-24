using HandyLink.Core.Entities;
using HandyLink.Core.Interfaces;
using HandyLink.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.Infrastructure.Repositories;

public class ProfileRepository(HandyLinkDbContext context) : IProfileRepository
{
    public Task<Profile?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => context.Profiles.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, ct);

    public Task<Profile?> GetByIdTrackedAsync(Guid id, CancellationToken ct = default)
        => context.Profiles.FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task AddAsync(Profile profile, CancellationToken ct = default)
        => await context.Profiles.AddAsync(profile, ct);

    public async Task AddWorkerProfileAsync(WorkerProfile workerProfile, CancellationToken ct = default)
        => await context.WorkerProfiles.AddAsync(workerProfile, ct);

    public Task SaveChangesAsync(CancellationToken ct = default)
        => context.SaveChangesAsync(ct);
}
