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
}
