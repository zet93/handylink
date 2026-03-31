using System.Net;
using System.Net.Http.Headers;
using FluentAssertions;

namespace HandyLink.Tests.Integration.Controllers;

public class WorkersControllerTests(CustomWebAppFactory factory) : IClassFixture<CustomWebAppFactory>
{
    private HttpClient AuthClient(Guid userId)
    {
        var c = factory.CreateClient();
        c.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestJwtHelper.GenerateToken(userId));
        return c;
    }

    [Fact]
    public async Task GetWorkers_Returns200_WhenAuthenticated()
    {
        var (client, _) = await TestDbSeeder.SeedUsersAsync(factory.Services);
        var http = AuthClient(client.Id);
        var response = await http.GetAsync("/api/workers");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
