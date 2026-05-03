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
    string? County,
    string[]? Photos,
    decimal? BudgetMin,
    decimal? BudgetMax,
    decimal? Latitude,
    decimal? Longitude,
    string? Address
) : IRequest<CreateJobResponse>;
