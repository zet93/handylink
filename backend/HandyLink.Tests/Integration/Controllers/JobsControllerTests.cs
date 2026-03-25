using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;

namespace HandyLink.Tests.Integration.Controllers;

public class JobsControllerTests(CustomWebAppFactory factory) : IClassFixture<CustomWebAppFactory>
{
    private HttpClient AuthClient(Guid userId)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestJwtHelper.GenerateToken(userId));
        return client;
    }

    [Fact]
    public async Task GetJobs_Returns200_WhenAuthenticated()
    {
        var (client, _) = await TestDbSeeder.SeedUsersAsync(factory.Services);
        var http = AuthClient(client.Id);
        var response = await http.GetAsync("/api/jobs");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetJobs_Returns401_WhenNoToken()
    {
        var http = factory.CreateClient();
        var response = await http.GetAsync("/api/jobs");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task PostJob_Returns201_WithValidBody()
    {
        var (client, _) = await TestDbSeeder.SeedUsersAsync(factory.Services);
        var http = AuthClient(client.Id);
        var body = new { title = "Fix leaky pipe", description = "Drips every hour under sink",
            category = "Plumbing", city = "Bucharest", country = "RO", budgetMin = 100, budgetMax = 400 };
        var response = await http.PostAsJsonAsync("/api/jobs", body);
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task PostJob_Returns401_WhenNoToken()
    {
        var http = factory.CreateClient();
        var body = new { title = "Test", description = "Test", category = "General", city = "X", country = "RO" };
        var response = await http.PostAsJsonAsync("/api/jobs", body);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetJobById_Returns404_WhenMissing()
    {
        var (client, _) = await TestDbSeeder.SeedUsersAsync(factory.Services);
        var http = AuthClient(client.Id);
        var response = await http.GetAsync($"/api/jobs/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetJobById_Returns200_WhenJobExists()
    {
        var (client, _) = await TestDbSeeder.SeedUsersAsync(factory.Services);
        var job = await TestDbSeeder.SeedJobAsync(factory.Services, client.Id);
        var http = AuthClient(client.Id);
        var response = await http.GetAsync($"/api/jobs/{job.Id}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
