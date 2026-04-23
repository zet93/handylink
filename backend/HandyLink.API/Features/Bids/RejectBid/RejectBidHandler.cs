using HandyLink.Core.Commands;
using HandyLink.Core.Entities.Enums;
using HandyLink.Core.Exceptions;
using HandyLink.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.API.Features.Bids.RejectBid;

public class RejectBidHandler(HandyLinkDbContext context, IMediator mediator)
    : IRequestHandler<RejectBidCommand, RejectBidResponse>
{
    public async Task<RejectBidResponse> Handle(RejectBidCommand command, CancellationToken cancellationToken)
    {
        var bid = await context.Bids
            .Include(b => b.Job)
            .FirstOrDefaultAsync(b => b.Id == command.BidId, cancellationToken)
            ?? throw new NotFoundException("Bid not found.");

        if (bid.Job.ClientId != command.ClientId)
            throw new ForbiddenException("You are not the client for this job.");

        if (bid.Status != BidStatus.Pending)
            throw new ValidationException("Bid is not in a rejectable state.");

        bid.Status = BidStatus.Rejected;
        bid.UpdatedAt = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        try
        {
            await mediator.Send(new SendPushNotificationCommand(
                bid.WorkerId,
                "Bid not accepted",
                "The client chose another worker for this job.",
                "bid_rejected",
                bid.JobId), cancellationToken);
        }
        catch
        {
            // non-fatal — notification failure must not roll back a successful rejection
        }

        return new RejectBidResponse(bid.Id, bid.Status.ToString());
    }
}
