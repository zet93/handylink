using HandyLink.Core.Exceptions;
using HandyLink.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.API.Features.Bids.GetBidsForJob;

public class GetBidsForJobHandler(HandyLinkDbContext context)
    : IRequestHandler<GetBidsForJobQuery, List<GetBidsForJobResponse>>
{
    public async Task<List<GetBidsForJobResponse>> Handle(GetBidsForJobQuery query, CancellationToken cancellationToken)
    {
        var job = await context.Jobs
            .FirstOrDefaultAsync(j => j.Id == query.JobId, cancellationToken)
            ?? throw new NotFoundException("Job not found.");

        if (job.ClientId != query.ClientId)
            throw new ForbiddenException("You are not the client for this job.");

        return await context.Bids
            .Where(b => b.JobId == query.JobId)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new GetBidsForJobResponse(
                b.Id, b.JobId, b.WorkerId, b.PriceEstimate, b.Message, b.Status.ToString(), b.CreatedAt))
            .ToListAsync(cancellationToken);
    }
}
