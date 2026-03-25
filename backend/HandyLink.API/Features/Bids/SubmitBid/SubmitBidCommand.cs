using MediatR;

namespace HandyLink.API.Features.Bids.SubmitBid;

public record SubmitBidCommand(
    Guid WorkerId,
    Guid JobId,
    decimal PriceEstimate,
    string Message
) : IRequest<SubmitBidResponse>;
