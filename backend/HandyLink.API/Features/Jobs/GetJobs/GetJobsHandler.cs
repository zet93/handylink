using HandyLink.Core.Entities.Enums;
using HandyLink.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.API.Features.Jobs.GetJobs;

public class GetJobsHandler(HandyLinkDbContext context)
    : IRequestHandler<GetJobsQuery, GetJobsResponse>
{
    public async Task<GetJobsResponse> Handle(GetJobsQuery query, CancellationToken cancellationToken)
    {
        var q = context.Jobs.Include(j => j.Bids).AsQueryable();

        if (query.Status.HasValue)
            q = q.Where(j => j.Status == query.Status.Value);
        else
            q = q.Where(j => j.Status == JobStatus.Open || j.Status == JobStatus.Bidding);

        if (query.Category.HasValue)
            q = q.Where(j => j.Category == query.Category.Value);

        var total = await q.CountAsync(cancellationToken);
        var items = await q
            .OrderByDescending(j => j.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        var summaries = items.Select(j => new JobSummary(
            j.Id, j.ClientId, j.Title, j.Category.ToString(),
            j.City, j.Country, j.BudgetMin, j.BudgetMax,
            j.Status.ToString(), j.Bids.Count, j.CreatedAt)).ToList();

        return new GetJobsResponse(summaries, total, query.Page, query.PageSize);
    }
}
