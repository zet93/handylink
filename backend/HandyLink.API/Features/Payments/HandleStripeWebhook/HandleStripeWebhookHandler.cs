using HandyLink.Core.Commands;
using HandyLink.Core.Entities.Enums;
using HandyLink.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Stripe;

namespace HandyLink.API.Features.Payments.HandleStripeWebhook;

public class HandleStripeWebhookHandler(
    HandyLinkDbContext context,
    IConfiguration configuration,
    IMediator mediator,
    ILogger<HandleStripeWebhookHandler> logger
) : IRequestHandler<HandleStripeWebhookCommand>
{
    public async Task Handle(HandleStripeWebhookCommand command, CancellationToken cancellationToken)
    {
        Event stripeEvent;
        try
        {
            stripeEvent = EventUtility.ConstructEvent(
                command.RawBody,
                command.StripeSignature,
                configuration["Stripe:WebhookSecret"]);
        }
        catch (StripeException ex)
        {
            logger.LogWarning(ex, "Invalid Stripe webhook signature");
            throw;
        }

        if (stripeEvent.Type != "payment_intent.succeeded")
            return;

        var intent = (PaymentIntent)stripeEvent.Data.Object;

        if (!intent.Metadata.TryGetValue("job_id", out var jobIdStr) ||
            !Guid.TryParse(jobIdStr, out var jobId))
        {
            logger.LogWarning("payment_intent.succeeded: missing or invalid job_id in metadata");
            return;
        }

        var job = await context.Jobs
            .FirstOrDefaultAsync(j => j.Id == jobId, cancellationToken);

        if (job is null)
        {
            logger.LogWarning("payment_intent.succeeded: job {JobId} not found", jobId);
            return;
        }

        job.Status = JobStatus.Completed;
        job.UpdatedAt = DateTimeOffset.UtcNow;
        await context.SaveChangesAsync(cancellationToken);

        await mediator.Send(new SendPushNotificationCommand(
            job.ClientId,
            "Payment confirmed",
            "Your payment was successful. The job is now complete.",
            "payment_confirmed",
            job.Id), cancellationToken);

        if (job.AcceptedBidId.HasValue)
        {
            var bid = await context.Bids
                .FirstOrDefaultAsync(b => b.Id == job.AcceptedBidId, cancellationToken);

            if (bid is not null)
            {
                await mediator.Send(new SendPushNotificationCommand(
                    bid.WorkerId,
                    "Payment received",
                    "Payment for your completed job has been processed.",
                    "payment_received",
                    job.Id), cancellationToken);
            }
        }
    }
}
