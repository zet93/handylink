using HandyLink.Core.Entities.Enums;
using HandyLink.Core.Exceptions;
using HandyLink.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.API.Features.Bids.RejectBid;

public class RejectBidHandler(HandyLinkDbContext context)
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

        return new RejectBidResponse(bid.Id, bid.Status.ToString());
    }
}
