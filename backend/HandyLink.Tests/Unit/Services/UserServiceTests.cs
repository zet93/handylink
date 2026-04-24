using HandyLink.Core.DTOs;
using HandyLink.Core.Entities;
using HandyLink.Core.Exceptions;
using HandyLink.Core.Services;
using HandyLink.Infrastructure.Data;
using HandyLink.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.Tests.Unit.Services;

public class UserServiceTests
{
    private static (HandyLinkDbContext ctx, UserService svc) Build()
    {
        var opts = new DbContextOptionsBuilder<HandyLinkDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var ctx = new HandyLinkDbContext(opts);
        return (ctx, new UserService(new ProfileRepository(ctx)));
    }

    [Fact]
    public async Task GetCurrentUser_ThrowsNotFound_WhenMissing()
    {
        var (_, svc) = Build();
        await Assert.ThrowsAsync<NotFoundException>(() => svc.GetCurrentUserAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task UpdateCurrentUser_AppliesChanges()
    {
        var (ctx, svc) = Build();
        var profile = new Profile { Id = Guid.NewGuid(), FullName = "Alice", Role = "client", Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow };
        ctx.Profiles.Add(profile);
        await ctx.SaveChangesAsync();

        var result = await svc.UpdateCurrentUserAsync(profile.Id, new UpdateUserDto("Bob", null, null, "Bucharest", null, null, null));

        Assert.Equal("Bob", result.FullName);
        Assert.Equal("Bucharest", result.City);
    }

    [Fact]
    public async Task EnsureUserProfile_CreatesProfile_WhenMissing()
    {
        var (ctx, svc) = Build();
        var userId = Guid.NewGuid();

        var result = await svc.EnsureUserProfileAsync(userId, "client");

        Assert.Equal(userId, result.Id);
        Assert.Equal("client", result.Role);
        var saved = await ctx.Profiles.FindAsync(userId);
        Assert.NotNull(saved);
    }

    [Fact]
    public async Task EnsureUserProfile_ReturnsExisting_WhenProfileExists()
    {
        var (ctx, svc) = Build();
        var userId = Guid.NewGuid();
        ctx.Profiles.Add(new Profile { Id = userId, FullName = "Existing", Role = "worker", Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow });
        await ctx.SaveChangesAsync();

        var result = await svc.EnsureUserProfileAsync(userId, "client");

        Assert.Equal("worker", result.Role);
    }

    [Fact]
    public async Task EnsureUserProfile_CreatesWorkerProfile_WhenRoleIsWorker()
    {
        var (ctx, svc) = Build();
        var userId = Guid.NewGuid();

        await svc.EnsureUserProfileAsync(userId, "worker");

        var wp = await ctx.WorkerProfiles.FindAsync(userId);
        Assert.NotNull(wp);
    }

    [Fact]
    public async Task EnsureUserProfile_CreatesWorkerProfile_WhenRoleIsBoth()
    {
        var (ctx, svc) = Build();
        var userId = Guid.NewGuid();

        await svc.EnsureUserProfileAsync(userId, "both");

        var wp = await ctx.WorkerProfiles.FindAsync(userId);
        Assert.NotNull(wp);
    }

    [Fact]
    public async Task EnsureUserProfile_DoesNotCreateWorkerProfile_WhenRoleIsClient()
    {
        var (ctx, svc) = Build();
        var userId = Guid.NewGuid();

        await svc.EnsureUserProfileAsync(userId, "client");

        var wp = await ctx.WorkerProfiles.FindAsync(userId);
        Assert.Null(wp);
    }
}
