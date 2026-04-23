using HandyLink.Core.Exceptions;
using HandyLink.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.API.Features.Workers.UpdateWorkerLocation;

public class UpdateWorkerLocationHandler(HandyLinkDbContext context)
    : IRequestHandler<UpdateWorkerLocationCommand, UpdateWorkerLocationResponse>
{
    public async Task<UpdateWorkerLocationResponse> Handle(
        UpdateWorkerLocationCommand command, CancellationToken cancellationToken)
    {
        var worker = await context.WorkerProfiles
            .FirstOrDefaultAsync(w => w.Id == command.WorkerId, cancellationToken)
            ?? throw new NotFoundException("Worker profile not found.");

        if (worker.Id != command.WorkerId)
            throw new ForbiddenException("You can only update your own location.");

        worker.Latitude = command.Latitude;
        worker.Longitude = command.Longitude;
        worker.ServiceRadiusKm = command.ServiceRadiusKm;

        await context.SaveChangesAsync(cancellationToken);

        return new UpdateWorkerLocationResponse(
            worker.Id, worker.Latitude, worker.Longitude, worker.ServiceRadiusKm);
    }
}
