using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;

namespace HandyLink.Tests.Integration.Controllers;

public class SecurityTestFactory : CustomWebAppFactory
{
    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.UseSetting("RateLimit:PermitLimit", "3");
    }
}

public class SecurityMiddlewareTests(SecurityTestFactory factory) : IClassFixture<SecurityTestFactory>
{
    private HttpClient AuthClient(Guid userId)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestJwtHelper.GenerateToken(userId));
        return client;
    }

    [Fact]
    public async Task Webhook_Returns400_OnInvalidSignature()
    {
        var client = factory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/payments/webhook");
        request.Content = new StringContent("not a real event", System.Text.Encoding.UTF8, "application/json");
        request.Headers.Add("Stripe-Signature", "t=1,v1=invalid");

        var response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateIntent_Returns429_WhenRateLimited()
    {
        var (clientProfile, _) = await TestDbSeeder.SeedUsersAsync(factory.Services);
        var job = await TestDbSeeder.SeedJobAsync(factory.Services, clientProfile.Id);
        var http = AuthClient(clientProfile.Id);
        var body = new { jobId = job.Id };

        HttpResponseMessage? lastResponse = null;
        for (int i = 0; i < 4; i++)
        {
            lastResponse = await http.PostAsJsonAsync("/api/payments/create-intent", body);
        }

        lastResponse!.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
    }

    [Fact]
    public async Task Cors_RejectsDisallowedOrigin()
    {
        var client = factory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Options, "/api/jobs");
        request.Headers.Add("Origin", "https://evil.com");
        request.Headers.Add("Access-Control-Request-Method", "GET");

        var response = await client.SendAsync(request);

        response.Headers.Contains("Access-Control-Allow-Origin").Should().BeFalse();
    }

    [Fact]
    public async Task Cors_AllowsAllowlistedOrigin()
    {
        var client = factory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Options, "/api/jobs");
        request.Headers.Add("Origin", "http://localhost:5173");
        request.Headers.Add("Access-Control-Request-Method", "GET");

        var response = await client.SendAsync(request);

        response.Headers.GetValues("Access-Control-Allow-Origin").Should().Contain("http://localhost:5173");
    }
}
