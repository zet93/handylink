using HandyLink.Core.Commands;
using HandyLink.Core.Entities.Enums;
using HandyLink.Core.Exceptions;
using HandyLink.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.API.Features.Bids.AcceptBid;

public class AcceptBidHandler(HandyLinkDbContext context, IMediator mediator)
    : IRequestHandler<AcceptBidCommand, AcceptBidResponse>
{
    public async Task<AcceptBidResponse> Handle(AcceptBidCommand command, CancellationToken cancellationToken)
    {
        var bid = await context.Bids
            .Include(b => b.Job)
            .FirstOrDefaultAsync(b => b.Id == command.BidId, cancellationToken)
            ?? throw new NotFoundException("Bid not found.");

        if (bid.Job.ClientId != command.ClientId)
            throw new ForbiddenException("You are not the client for this job.");

        bid.Status = BidStatus.Accepted;
        bid.UpdatedAt = DateTimeOffset.UtcNow;
        bid.Job.Status = JobStatus.Accepted;
        bid.Job.AcceptedBidId = bid.Id;
        bid.Job.UpdatedAt = DateTimeOffset.UtcNow;

        var otherBids = await context.Bids
            .Where(b => b.JobId == bid.JobId && b.Id != bid.Id && b.Status == BidStatus.Pending)
            .ToListAsync(cancellationToken);

        foreach (var other in otherBids)
        {
            other.Status = BidStatus.Rejected;
            other.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await context.SaveChangesAsync(cancellationToken);

        await mediator.Send(new SendPushNotificationCommand(
            bid.WorkerId, "Bid accepted!", "Your bid has been accepted",
            "bid_accepted", bid.Job.Id), cancellationToken);

        return new AcceptBidResponse(bid.Id, bid.JobId, bid.Status.ToString(), bid.Job.Status.ToString());
    }
}
