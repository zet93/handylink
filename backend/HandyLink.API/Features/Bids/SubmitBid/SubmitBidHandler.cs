using HandyLink.Core.Commands;
using HandyLink.Core.Entities;
using HandyLink.Core.Entities.Enums;
using HandyLink.Core.Exceptions;
using HandyLink.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.API.Features.Bids.SubmitBid;

public class SubmitBidHandler(HandyLinkDbContext context, IMediator mediator)
    : IRequestHandler<SubmitBidCommand, SubmitBidResponse>
{
    public async Task<SubmitBidResponse> Handle(SubmitBidCommand command, CancellationToken cancellationToken)
    {
        var job = await context.Jobs
            .FirstOrDefaultAsync(j => j.Id == command.JobId, cancellationToken)
            ?? throw new NotFoundException("Job not found.");

        if (job.Status is not (JobStatus.Open or JobStatus.Bidding))
            throw new ValidationException("Job is not accepting bids.");

        var duplicate = await context.Bids.AnyAsync(
            b => b.JobId == command.JobId && b.WorkerId == command.WorkerId, cancellationToken);
        if (duplicate)
            throw new ConflictException("You have already submitted a bid on this job.");

        var bid = new Bid
        {
            Id = Guid.NewGuid(),
            JobId = command.JobId,
            WorkerId = command.WorkerId,
            PriceEstimate = command.PriceEstimate,
            Message = command.Message,
            Status = BidStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        context.Bids.Add(bid);

        if (job.Status == JobStatus.Open)
        {
            job.Status = JobStatus.Bidding;
            job.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await context.SaveChangesAsync(cancellationToken);

        await mediator.Send(new SendPushNotificationCommand(
            job.ClientId, "New bid received", $"A worker bid {command.PriceEstimate:C} on your job",
            "bid_received", bid.Id), cancellationToken);

        return new SubmitBidResponse(bid.Id, bid.JobId, bid.WorkerId,
            bid.PriceEstimate, bid.Message, bid.Status.ToString(), bid.CreatedAt);
    }
}
