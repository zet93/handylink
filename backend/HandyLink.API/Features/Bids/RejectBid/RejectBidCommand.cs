using MediatR;

namespace HandyLink.API.Features.Bids.RejectBid;

public record RejectBidCommand(Guid ClientId, Guid BidId) : IRequest<RejectBidResponse>;
