using HandyLink.Core.Entities;
using HandyLink.Core.Entities.Enums;
using HandyLink.Infrastructure.Data;
using MediatR;

namespace HandyLink.API.Features.Jobs.CreateJob;

public class CreateJobHandler(HandyLinkDbContext context)
    : IRequestHandler<CreateJobCommand, CreateJobResponse>
{
    public async Task<CreateJobResponse> Handle(CreateJobCommand command, CancellationToken cancellationToken)
    {
        var job = new Job
        {
            Id = Guid.NewGuid(),
            ClientId = command.ClientId,
            Title = command.Title,
            Description = command.Description,
            Category = command.Category,
            City = command.City,
            Country = command.Country,
            County = command.County,
            Photos = command.Photos ?? [],
            BudgetMin = command.BudgetMin,
            BudgetMax = command.BudgetMax,
            Latitude = command.Latitude,
            Longitude = command.Longitude,
            Address = command.Address,
            Status = JobStatus.Open,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        context.Jobs.Add(job);
        await context.SaveChangesAsync(cancellationToken);

        return new CreateJobResponse(job.Id, job.ClientId, job.Title, job.Description,
            job.Category.ToString(), job.City, job.Country, job.County,
            job.BudgetMin, job.BudgetMax, job.Status, job.CreatedAt,
            job.Latitude, job.Longitude, job.Address);
    }
}
