namespace HandyLink.API.Features.Workers.UpdateWorkerLocation;

public record UpdateWorkerLocationResponse(
    Guid WorkerId,
    decimal? Latitude,
    decimal? Longitude,
    int? ServiceRadiusKm);
