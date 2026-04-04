using System.Net;
using System.Net.Http.Headers;
using FluentAssertions;
using HandyLink.Core.Entities;
using HandyLink.Infrastructure.Data;
using Microsoft.Extensions.DependencyInjection;

namespace HandyLink.Tests.Integration.Controllers;

public class PiiAuditTests(CustomWebAppFactory factory) : IClassFixture<CustomWebAppFactory>
{
    private HttpClient AuthClient(Guid userId)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestJwtHelper.GenerateToken(userId));
        return client;
    }

    [Fact]
    public async Task PiiNotInJobsResponse()
    {
        var (client, _) = await TestDbSeeder.SeedUsersAsync(factory.Services);
        await TestDbSeeder.SeedJobAsync(factory.Services, client.Id);
        var http = AuthClient(client.Id);
        var response = await http.GetAsync("/api/jobs");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.ToLower().Should().NotContain("email");
        body.ToLower().Should().NotContain("phone");
    }

    [Fact]
    public async Task PiiNotInJobByIdResponse()
    {
        var (client, _) = await TestDbSeeder.SeedUsersAsync(factory.Services);
        var job = await TestDbSeeder.SeedJobAsync(factory.Services, client.Id);
        var http = AuthClient(client.Id);
        var response = await http.GetAsync($"/api/jobs/{job.Id}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.ToLower().Should().NotContain("email");
        body.ToLower().Should().NotContain("phone");
    }

    [Fact]
    public async Task PiiNotInWorkersResponse()
    {
        var (client, worker) = await TestDbSeeder.SeedUsersAsync(factory.Services);
        var workerProfileId = await SeedWorkerProfileAsync(worker.Id);
        var http = AuthClient(client.Id);
        var response = await http.GetAsync("/api/workers");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.ToLower().Should().NotContain("email");
        body.ToLower().Should().NotContain("phone");
    }

    [Fact]
    public async Task PiiNotInWorkerByIdResponse()
    {
        var (client, worker) = await TestDbSeeder.SeedUsersAsync(factory.Services);
        var workerProfileId = await SeedWorkerProfileAsync(worker.Id);
        var http = AuthClient(client.Id);
        var response = await http.GetAsync($"/api/workers/{workerProfileId}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadAsStringAsync();
        body.ToLower().Should().NotContain("email");
        body.ToLower().Should().NotContain("phone");
    }

    private async Task<Guid> SeedWorkerProfileAsync(Guid workerId)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HandyLinkDbContext>();
        var workerProfile = new WorkerProfile
        {
            Id = workerId,
            CreatedAt = DateTimeOffset.UtcNow
        };
        db.WorkerProfiles.Add(workerProfile);
        await db.SaveChangesAsync();
        return workerProfile.Id;
    }
}
