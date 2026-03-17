using MediatR;

namespace HandyLink.Core.Commands;

public record SendPushNotificationCommand(
    Guid UserId,
    string Title,
    string Body,
    string Type,
    Guid? ReferenceId = null
) : IRequest;
