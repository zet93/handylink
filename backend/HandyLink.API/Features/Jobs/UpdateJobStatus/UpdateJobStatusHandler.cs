using HandyLink.Core.Entities.Enums;
using HandyLink.Core.Exceptions;
using HandyLink.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.API.Features.Jobs.UpdateJobStatus;

public class UpdateJobStatusHandler(HandyLinkDbContext context)
    : IRequestHandler<UpdateJobStatusCommand, UpdateJobStatusResponse>
{
    private static readonly HashSet<(JobStatus from, JobStatus to)> AllowedTransitions =
    [
        (JobStatus.Accepted, JobStatus.InProgress),
        (JobStatus.Accepted, JobStatus.Cancelled),
        (JobStatus.InProgress, JobStatus.Completed),
        (JobStatus.InProgress, JobStatus.Cancelled),
    ];

    public async Task<UpdateJobStatusResponse> Handle(UpdateJobStatusCommand command, CancellationToken cancellationToken)
    {
        var normalized = command.Status.Replace("_", "");
        if (!Enum.TryParse<JobStatus>(normalized, ignoreCase: true, out var newStatus))
            throw new ValidationException("Invalid status value.");

        var job = await context.Jobs.FirstOrDefaultAsync(j => j.Id == command.JobId, cancellationToken)
            ?? throw new NotFoundException("Job not found.");

        if (job.ClientId != command.ClientId)
            throw new ForbiddenException("You are not the client for this job.");

        if (!AllowedTransitions.Contains((job.Status, newStatus)))
            throw new ValidationException($"Cannot transition from {job.Status} to {newStatus}.");

        job.Status = newStatus;
        job.UpdatedAt = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        return new UpdateJobStatusResponse(job.Id, job.Status.ToString());
    }
}
