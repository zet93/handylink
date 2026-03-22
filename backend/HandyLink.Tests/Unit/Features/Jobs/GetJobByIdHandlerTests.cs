using FluentAssertions;
using HandyLink.API.Features.Jobs.GetJobById;
using HandyLink.Core.Entities;
using HandyLink.Core.Entities.Enums;
using HandyLink.Core.Exceptions;
using HandyLink.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.Tests.Unit.Features.Jobs;

public class GetJobByIdHandlerTests
{
    private static (HandyLinkDbContext ctx, GetJobByIdHandler handler) Build()
    {
        var opts = new DbContextOptionsBuilder<HandyLinkDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var ctx = new HandyLinkDbContext(opts);
        return (ctx, new GetJobByIdHandler(ctx));
    }

    [Fact]
    public async Task Handle_ThrowsNotFoundException_WhenJobMissing()
    {
        var (_, handler) = Build();
        var act = () => handler.Handle(new GetJobByIdQuery(Guid.NewGuid()), CancellationToken.None);
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_ReturnsCorrectJob()
    {
        var (ctx, handler) = Build();
        var clientId = Guid.NewGuid();
        var jobId = Guid.NewGuid();
        ctx.Profiles.Add(new Profile
        {
            Id = clientId, FullName = "C", Role = "client",
            Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        ctx.Jobs.Add(new Job
        {
            Id = jobId, ClientId = clientId, Title = "My Job",
            Description = "Desc here", Category = JobCategory.General, City = "City",
            Country = "RO", Status = JobStatus.Open, Photos = [],
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        });
        await ctx.SaveChangesAsync();

        var result = await handler.Handle(new GetJobByIdQuery(jobId), CancellationToken.None);

        result.Id.Should().Be(jobId);
        result.Title.Should().Be("My Job");
    }
}
