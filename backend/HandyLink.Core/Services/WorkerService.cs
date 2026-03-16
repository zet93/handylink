using HandyLink.Core.DTOs;
using HandyLink.Core.Entities;
using HandyLink.Core.Exceptions;
using HandyLink.Core.Interfaces;

namespace HandyLink.Core.Services;

public class WorkerService(IWorkerRepository workers)
{
    public async Task<PagedResult<WorkerResponseDto>> GetWorkersAsync(int page, int pageSize, CancellationToken ct = default)
    {
        var result = await workers.GetPagedAsync(page, pageSize, ct);
        return new PagedResult<WorkerResponseDto>(
            result.Items.Select(ToDto).ToList(),
            result.TotalCount, result.Page, result.PageSize);
    }

    public async Task<WorkerResponseDto> GetWorkerByIdAsync(Guid id, CancellationToken ct = default)
    {
        var worker = await workers.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Worker {id} not found");
        return ToDto(worker);
    }

    private static WorkerResponseDto ToDto(WorkerProfile w) => new(
        w.Id, w.Profile.FullName, w.Profile.AvatarUrl, w.Profile.Bio,
        w.Profile.City, w.Profile.Country,
        w.Categories, w.YearsExperience, w.AverageRating, w.TotalReviews, w.IsVerified);
}
