using MediatR;

namespace HandyLink.API.Features.Payments.WorkerConnectOnboard;

public record WorkerConnectOnboardCommand(Guid WorkerId) : IRequest<WorkerConnectOnboardResponse>;
