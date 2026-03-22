namespace HandyLink.API.Features.Bids.SubmitBid;

public record SubmitBidResponse(
    Guid Id,
    Guid JobId,
    Guid WorkerId,
    decimal PriceEstimate,
    string Message,
    string Status,
    DateTimeOffset CreatedAt);
