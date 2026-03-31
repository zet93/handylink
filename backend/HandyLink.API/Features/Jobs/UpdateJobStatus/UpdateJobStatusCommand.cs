using MediatR;

namespace HandyLink.API.Features.Jobs.UpdateJobStatus;

public record UpdateJobStatusCommand(Guid ClientId, Guid JobId, string Status) : IRequest<UpdateJobStatusResponse>;
