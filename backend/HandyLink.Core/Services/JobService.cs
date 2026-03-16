using HandyLink.Core.DTOs;
using HandyLink.Core.Entities;
using HandyLink.Core.Entities.Enums;
using HandyLink.Core.Exceptions;
using HandyLink.Core.Interfaces;

namespace HandyLink.Core.Services;

public class JobService(IJobRepository jobs)
{
    public async Task<JobResponseDto> CreateJobAsync(Guid userId, CreateJobDto dto, CancellationToken ct = default)
    {
        var job = new Job
        {
            Id = Guid.NewGuid(),
            ClientId = userId,
            Title = dto.Title,
            Description = dto.Description,
            Category = dto.Category,
            City = dto.City,
            Country = dto.Country,
            BudgetMin = dto.BudgetMin,
            BudgetMax = dto.BudgetMax,
            Photos = dto.Photos ?? [],
            Status = JobStatus.Open,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        await jobs.AddAsync(job, ct);
        await jobs.SaveChangesAsync(ct);
        return ToDto(job);
    }

    public async Task<PagedResult<JobResponseDto>> GetJobsAsync(JobFilter filter, CancellationToken ct = default)
    {
        var result = await jobs.GetPagedAsync(filter, ct);
        return new PagedResult<JobResponseDto>(
            result.Items.Select(ToDto).ToList(),
            result.TotalCount, result.Page, result.PageSize);
    }

    public async Task<JobResponseDto> GetJobByIdAsync(Guid id, CancellationToken ct = default)
    {
        var job = await jobs.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Job {id} not found");
        return ToDto(job);
    }

    public async Task<JobResponseDto> UpdateJobStatusAsync(Guid userId, Guid jobId, JobStatus status, CancellationToken ct = default)
    {
        var job = await jobs.GetByIdTrackedAsync(jobId, ct)
            ?? throw new NotFoundException($"Job {jobId} not found");
        if (job.ClientId != userId) throw new ForbiddenException("Not the job owner");
        job.Status = status;
        job.UpdatedAt = DateTimeOffset.UtcNow;
        await jobs.SaveChangesAsync(ct);
        return ToDto(job);
    }

    private static JobResponseDto ToDto(Job j) => new(
        j.Id, j.ClientId, j.Title, j.Description, j.Category,
        j.City, j.Country, j.BudgetMin, j.BudgetMax, j.Status,
        j.AcceptedBidId, j.Photos, j.CreatedAt, j.UpdatedAt);
}
