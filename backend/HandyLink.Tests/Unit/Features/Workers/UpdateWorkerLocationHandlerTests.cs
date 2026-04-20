using FluentAssertions;
using HandyLink.API.Features.Workers.UpdateWorkerLocation;
using HandyLink.Core.Entities;
using HandyLink.Core.Exceptions;
using HandyLink.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.Tests.Unit.Features.Workers;

public class UpdateWorkerLocationHandlerTests
{
    private static (HandyLinkDbContext ctx, UpdateWorkerLocationHandler handler) Build()
    {
        var opts = new DbContextOptionsBuilder<HandyLinkDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var ctx = new HandyLinkDbContext(opts);
        return (ctx, new UpdateWorkerLocationHandler(ctx));
    }

    private static async Task<WorkerProfile> SeedWorker(HandyLinkDbContext ctx)
    {
        var profile = new Profile
        {
            Id = Guid.NewGuid(), FullName = "Worker", Role = "worker",
            Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        };
        ctx.Profiles.Add(profile);
        var worker = new WorkerProfile
        {
            Id = profile.Id, Categories = [], CreatedAt = DateTimeOffset.UtcNow
        };
        ctx.WorkerProfiles.Add(worker);
        await ctx.SaveChangesAsync();
        return worker;
    }

    [Fact]
    public async Task Handle_UpdatesLocation_WithValidCoordinates()
    {
        var (ctx, handler) = Build();
        var worker = await SeedWorker(ctx);

        var cmd = new UpdateWorkerLocationCommand(worker.Id, 44.4268m, 26.1025m, 20);
        var result = await handler.Handle(cmd, CancellationToken.None);

        result.WorkerId.Should().Be(worker.Id);
        result.Latitude.Should().Be(44.4268m);
        result.Longitude.Should().Be(26.1025m);
        result.ServiceRadiusKm.Should().Be(20);

        var saved = await ctx.WorkerProfiles.FindAsync(worker.Id);
        saved!.Latitude.Should().Be(44.4268m);
        saved.Longitude.Should().Be(26.1025m);
        saved.ServiceRadiusKm.Should().Be(20);
    }

    [Fact]
    public async Task Handle_ThrowsNotFoundException_WhenWorkerProfileMissing()
    {
        var (_, handler) = Build();
        var cmd = new UpdateWorkerLocationCommand(Guid.NewGuid(), 44.4268m, 26.1025m, 10);

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(cmd, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_AcceptsNullValues_ClearingLocation()
    {
        var (ctx, handler) = Build();
        var worker = await SeedWorker(ctx);

        var cmd = new UpdateWorkerLocationCommand(worker.Id, null, null, null);
        var result = await handler.Handle(cmd, CancellationToken.None);

        result.Latitude.Should().BeNull();
        result.Longitude.Should().BeNull();
        result.ServiceRadiusKm.Should().BeNull();
    }
}
