using MediatR;

namespace HandyLink.API.Features.Bids.GetBidsForJob;

public record GetBidsForJobQuery(Guid ClientId, Guid JobId) : IRequest<List<GetBidsForJobResponse>>;
