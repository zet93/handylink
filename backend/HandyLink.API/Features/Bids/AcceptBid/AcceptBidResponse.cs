namespace HandyLink.API.Features.Bids.AcceptBid;

public record AcceptBidResponse(Guid BidId, Guid JobId, string BidStatus, string JobStatus);
