using HandyLink.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace HandyLink.Tests.Integration;

public class CustomWebAppFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Test");

        builder.UseSetting("Supabase:JwtSecret", TestJwtHelper.Secret);
        builder.UseSetting("Supabase:Url", "https://test.supabase.co");
        builder.UseSetting("Stripe:SecretKey", "sk_test_fake");
        builder.UseSetting("Stripe:WebhookSecret", "whsec_fake");
        builder.UseSetting("ConnectionStrings:DefaultConnection", "Host=unused");

        builder.ConfigureServices(services =>
        {
            var toRemove = services
                .Where(d => d.ServiceType == typeof(DbContextOptions<HandyLinkDbContext>)
                         || d.ServiceType == typeof(HandyLinkDbContext)
                         || (d.ServiceType.IsGenericType &&
                             d.ServiceType.GetGenericTypeDefinition().Name.StartsWith("IDbContextOptionsConfiguration")))
                .ToList();
            foreach (var d in toRemove) services.Remove(d);

            var dbName = "IntegrationTest_" + Guid.NewGuid();
            services.AddDbContext<HandyLinkDbContext>(opts =>
                opts.UseInMemoryDatabase(dbName));
        });
    }
}
