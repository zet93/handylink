using HandyLink.Core.Entities.Enums;
using MediatR;

namespace HandyLink.API.Features.Jobs.CreateJob;

public record CreateJobCommand(
    Guid ClientId,
    string Title,
    string Description,
    JobCategory Category,
    string City,
    string Country,
    string[]? Photos,
    decimal? BudgetMin,
    decimal? BudgetMax
) : IRequest<CreateJobResponse>;
