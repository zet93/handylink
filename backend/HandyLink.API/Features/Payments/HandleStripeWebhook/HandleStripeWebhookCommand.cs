using MediatR;

namespace HandyLink.API.Features.Payments.HandleStripeWebhook;

public record HandleStripeWebhookCommand(string RawBody, string StripeSignature) : IRequest;
