using System.Net;
using System.Net.Http.Headers;
using System.Text;
using FluentAssertions;

namespace HandyLink.Tests.Integration.Controllers;

public class OwnershipTests(CustomWebAppFactory factory) : IClassFixture<CustomWebAppFactory>
{
    private HttpClient AuthClient(Guid userId)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestJwtHelper.GenerateToken(userId));
        return client;
    }

    [Fact]
    public async Task UpdateJobStatus_Returns403_ForNonOwner()
    {
        var (client, worker) = await TestDbSeeder.SeedUsersAsync(factory.Services);
        var job = await TestDbSeeder.SeedJobAsync(factory.Services, client.Id);
        var http = AuthClient(worker.Id);
        var content = new StringContent("{\"status\":\"in_progress\"}", Encoding.UTF8, "application/json");
        var response = await http.PatchAsync($"/api/jobs/{job.Id}/status", content);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task AcceptBid_Returns403_ForNonOwner()
    {
        var (client, worker) = await TestDbSeeder.SeedUsersAsync(factory.Services);
        var job = await TestDbSeeder.SeedJobAsync(factory.Services, client.Id);
        var bid = await TestDbSeeder.SeedBidAsync(factory.Services, worker.Id, job.Id);
        var http = AuthClient(worker.Id);
        var response = await http.PatchAsync($"/api/bids/{bid.Id}/accept", null);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task RejectBid_Returns403_ForNonOwner()
    {
        var (client, worker) = await TestDbSeeder.SeedUsersAsync(factory.Services);
        var job = await TestDbSeeder.SeedJobAsync(factory.Services, client.Id);
        var bid = await TestDbSeeder.SeedBidAsync(factory.Services, worker.Id, job.Id);
        var http = AuthClient(worker.Id);
        var response = await http.PatchAsync($"/api/bids/{bid.Id}/reject", null);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetBidsForJob_Returns403_ForNonOwner()
    {
        var (client, worker) = await TestDbSeeder.SeedUsersAsync(factory.Services);
        var job = await TestDbSeeder.SeedJobAsync(factory.Services, client.Id);
        await TestDbSeeder.SeedBidAsync(factory.Services, worker.Id, job.Id);
        var http = AuthClient(worker.Id);
        var response = await http.GetAsync($"/api/jobs/{job.Id}/bids");
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
