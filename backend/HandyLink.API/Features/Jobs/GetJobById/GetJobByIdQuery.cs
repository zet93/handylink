using MediatR;

namespace HandyLink.API.Features.Jobs.GetJobById;

public record GetJobByIdQuery(Guid JobId) : IRequest<GetJobByIdResponse>;
