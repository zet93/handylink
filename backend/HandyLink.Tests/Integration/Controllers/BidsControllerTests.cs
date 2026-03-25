using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;

namespace HandyLink.Tests.Integration.Controllers;

public class BidsControllerTests(CustomWebAppFactory factory) : IClassFixture<CustomWebAppFactory>
{
    private HttpClient AuthClient(Guid userId)
    {
        var c = factory.CreateClient();
        c.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestJwtHelper.GenerateToken(userId));
        return c;
    }

    [Fact]
    public async Task SubmitBid_Returns201_WhenJobOpen()
    {
        var (client, worker) = await TestDbSeeder.SeedUsersAsync(factory.Services);
        var job = await TestDbSeeder.SeedJobAsync(factory.Services, client.Id);
        var http = AuthClient(worker.Id);
        var body = new { priceEstimate = 150, message = "I can do this job fast." };
        var response = await http.PostAsJsonAsync($"/api/jobs/{job.Id}/bids", body);
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task SubmitBid_Returns404_WhenJobMissing()
    {
        var (_, worker) = await TestDbSeeder.SeedUsersAsync(factory.Services);
        var http = AuthClient(worker.Id);
        var body = new { priceEstimate = 100, message = "Ready to help." };
        var response = await http.PostAsJsonAsync($"/api/jobs/{Guid.NewGuid()}/bids", body);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task SubmitBid_Returns409_WhenDuplicateBid()
    {
        var (client, worker) = await TestDbSeeder.SeedUsersAsync(factory.Services);
        var job = await TestDbSeeder.SeedJobAsync(factory.Services, client.Id);
        var http = AuthClient(worker.Id);
        var body = new { priceEstimate = 100, message = "First bid." };
        await http.PostAsJsonAsync($"/api/jobs/{job.Id}/bids", body);
        var response = await http.PostAsJsonAsync($"/api/jobs/{job.Id}/bids", body);
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }
}
