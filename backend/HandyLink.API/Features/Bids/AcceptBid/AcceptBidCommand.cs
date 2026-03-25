using MediatR;

namespace HandyLink.API.Features.Bids.AcceptBid;

public record AcceptBidCommand(Guid ClientId, Guid BidId) : IRequest<AcceptBidResponse>;
