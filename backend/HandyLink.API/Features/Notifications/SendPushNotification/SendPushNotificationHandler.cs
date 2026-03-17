using System.Net.Http.Json;
using HandyLink.Core.Commands;
using HandyLink.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace HandyLink.API.Features.Notifications.SendPushNotification;

public class SendPushNotificationHandler(
    HandyLinkDbContext context,
    IHttpClientFactory httpClientFactory,
    ILogger<SendPushNotificationHandler> logger
) : IRequestHandler<SendPushNotificationCommand>
{
    public async Task Handle(SendPushNotificationCommand command, CancellationToken cancellationToken)
    {
        var profile = await context.Profiles
            .FirstOrDefaultAsync(p => p.Id == command.UserId, cancellationToken);

        if (profile is null || string.IsNullOrEmpty(profile.ExpoPushToken))
            return;

        try
        {
            var client = httpClientFactory.CreateClient();
            var payload = new
            {
                to = profile.ExpoPushToken,
                title = command.Title,
                body = command.Body,
                data = new
                {
                    type = command.Type,
                    reference_id = command.ReferenceId?.ToString()
                }
            };

            var response = await client.PostAsJsonAsync(
                "https://exp.host/--/api/v2/push/send",
                payload,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
                logger.LogWarning("Expo push notification returned {Status} for user {UserId}",
                    response.StatusCode, command.UserId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send push notification to user {UserId}", command.UserId);
        }
    }
}
