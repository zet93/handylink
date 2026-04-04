using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using HandyLink.Core.Entities;
using HandyLink.Infrastructure.Data;
using Microsoft.Extensions.DependencyInjection;

namespace HandyLink.Tests.Integration.Controllers;

public class SocialAuthTests(CustomWebAppFactory factory) : IClassFixture<CustomWebAppFactory>
{
    private HttpClient AuthClient(Guid userId)
    {
        var c = factory.CreateClient();
        c.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestJwtHelper.GenerateToken(userId));
        return c;
    }

    [Fact]
    public async Task EnsureRole_CreatesNewProfile_WhenUserHasNoProfile()
    {
        var userId = Guid.NewGuid();
        var http = AuthClient(userId);

        var response = await http.PostAsJsonAsync("/api/users/me/role", new { role = "client" });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        json.RootElement.GetProperty("role").GetString().Should().Be("client");
    }

    [Fact]
    public async Task EnsureRole_ReturnsExistingProfile_WhenUserAlreadyHasProfile()
    {
        var userId = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<HandyLinkDbContext>();
            db.Profiles.Add(new Profile
            {
                Id = userId, FullName = "Existing User", Role = "worker",
                Country = "RO", CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
            });
            await db.SaveChangesAsync();
        }

        var http = AuthClient(userId);
        var response = await http.PostAsJsonAsync("/api/users/me/role", new { role = "client" });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        json.RootElement.GetProperty("role").GetString().Should().Be("worker");
    }

    [Fact]
    public async Task EnsureRole_CreatesWorkerProfile_WhenRoleIsWorker()
    {
        var userId = Guid.NewGuid();
        var http = AuthClient(userId);

        var response = await http.PostAsJsonAsync("/api/users/me/role", new { role = "worker" });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HandyLinkDbContext>();
        var wp = await db.WorkerProfiles.FindAsync(userId);
        wp.Should().NotBeNull();
    }

    [Fact]
    public async Task EnsureRole_Returns401_WhenUnauthenticated()
    {
        var http = factory.CreateClient();
        var response = await http.PostAsJsonAsync("/api/users/me/role", new { role = "client" });
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetMe_Returns200_AfterRoleAssigned()
    {
        var userId = Guid.NewGuid();
        var http = AuthClient(userId);
        await http.PostAsJsonAsync("/api/users/me/role", new { role = "both" });

        var response = await http.GetAsync("/api/users/me");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
