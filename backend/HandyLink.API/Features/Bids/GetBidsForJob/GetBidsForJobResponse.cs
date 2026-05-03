namespace HandyLink.API.Features.Bids.GetBidsForJob;

public record GetBidsForJobResponse(Guid Id, Guid JobId, Guid WorkerId, decimal PriceEstimate, string Message, string Status, DateTimeOffset CreatedAt);
