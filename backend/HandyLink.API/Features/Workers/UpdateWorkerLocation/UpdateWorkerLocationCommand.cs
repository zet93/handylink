using MediatR;

namespace HandyLink.API.Features.Workers.UpdateWorkerLocation;

public record UpdateWorkerLocationCommand(
    Guid WorkerId,
    decimal? Latitude,
    decimal? Longitude,
    int? ServiceRadiusKm
) : IRequest<UpdateWorkerLocationResponse>;
