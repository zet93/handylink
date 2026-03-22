using HandyLink.Core.Entities.Enums;
using MediatR;

namespace HandyLink.API.Features.Jobs.GetJobs;

public record GetJobsQuery(
    JobCategory? Category,
    JobStatus? Status,
    int Page,
    int PageSize
) : IRequest<GetJobsResponse>;
