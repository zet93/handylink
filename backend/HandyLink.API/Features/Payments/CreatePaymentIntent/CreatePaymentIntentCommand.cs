using MediatR;

namespace HandyLink.API.Features.Payments.CreatePaymentIntent;

public record CreatePaymentIntentCommand(Guid JobId, Guid ClientId) : IRequest<CreatePaymentIntentResponse>;
