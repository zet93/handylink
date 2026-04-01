using System.Net;
using System.Net.Http.Json;
using FluentAssertions;

namespace HandyLink.Tests.Integration.Controllers;

public class AnonymousAccessTests(CustomWebAppFactory factory) : IClassFixture<CustomWebAppFactory>
{
    [Fact]
    public async Task GetJobs_Returns200_WhenAnonymous()
    {
        var http = factory.CreateClient();
        var response = await http.GetAsync("/api/jobs");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetJobById_Returns200_WhenAnonymous()
    {
        var (client, _) = await TestDbSeeder.SeedUsersAsync(factory.Services);
        var job = await TestDbSeeder.SeedJobAsync(factory.Services, client.Id);
        var http = factory.CreateClient();
        var response = await http.GetAsync($"/api/jobs/{job.Id}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetWorkers_Returns200_WhenAnonymous()
    {
        var http = factory.CreateClient();
        var response = await http.GetAsync("/api/workers");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetWorkerById_Returns200_WhenAnonymous()
    {
        var (_, worker) = await TestDbSeeder.SeedUsersAsync(factory.Services);
        var http = factory.CreateClient();
        var response = await http.GetAsync($"/api/workers/{worker.Id}");
        response.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateJob_Returns401_WhenAnonymous()
    {
        var http = factory.CreateClient();
        var body = new { title = "Test", description = "Test description", category = "General", city = "Bucharest", country = "RO" };
        var response = await http.PostAsJsonAsync("/api/jobs", body);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateJobStatus_Returns401_WhenAnonymous()
    {
        var http = factory.CreateClient();
        var body = new { status = "Closed" };
        var response = await http.PatchAsJsonAsync($"/api/jobs/{Guid.NewGuid()}/status", body);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
