using HandyLink.Core.Exceptions;
using HandyLink.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.API.Features.Jobs.GetJobById;

public class GetJobByIdHandler(HandyLinkDbContext context)
    : IRequestHandler<GetJobByIdQuery, GetJobByIdResponse>
{
    public async Task<GetJobByIdResponse> Handle(GetJobByIdQuery query, CancellationToken cancellationToken)
    {
        var job = await context.Jobs
            .FirstOrDefaultAsync(j => j.Id == query.JobId, cancellationToken)
            ?? throw new NotFoundException("Job not found.");

        return new GetJobByIdResponse(job.Id, job.ClientId, job.Title, job.Description,
            job.Category.ToString(), job.City, job.Country, job.Photos,
            job.BudgetMin, job.BudgetMax, job.Status.ToString(), job.CreatedAt,
            job.Latitude, job.Longitude, job.Address);
    }
}
