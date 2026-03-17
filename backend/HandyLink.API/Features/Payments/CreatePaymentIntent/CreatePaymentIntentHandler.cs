using HandyLink.Core.Entities.Enums;
using HandyLink.Core.Exceptions;
using HandyLink.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Stripe;

namespace HandyLink.API.Features.Payments.CreatePaymentIntent;

public class CreatePaymentIntentHandler(
    HandyLinkDbContext context,
    IConfiguration configuration
) : IRequestHandler<CreatePaymentIntentCommand, CreatePaymentIntentResponse>
{
    public async Task<CreatePaymentIntentResponse> Handle(
        CreatePaymentIntentCommand command,
        CancellationToken cancellationToken)
    {
        var job = await context.Jobs
            .Include(j => j.AcceptedBid)
                .ThenInclude(b => b!.Worker)
                    .ThenInclude(p => p.WorkerProfile)
            .FirstOrDefaultAsync(j => j.Id == command.JobId, cancellationToken)
            ?? throw new NotFoundException("Job not found.");

        if (job.ClientId != command.ClientId)
            throw new ForbiddenException("You are not the client for this job.");

        if (job.Status != JobStatus.InProgress)
            throw new Core.Exceptions.ValidationException("Job must be in progress to initiate payment.");

        var bid = job.AcceptedBid
            ?? throw new NotFoundException("No accepted bid found for this job.");

        var workerProfile = bid.Worker.WorkerProfile
            ?? throw new NotFoundException("Worker has no profile.");

        if (string.IsNullOrEmpty(workerProfile.StripeAccountId))
            throw new Core.Exceptions.ValidationException("Worker has not connected their Stripe account.");

        StripeConfiguration.ApiKey = configuration["Stripe:SecretKey"];

        var amountInCents = (long)(bid.PriceEstimate * 100);
        var feeInCents = (long)(amountInCents * 0.10m);

        var options = new PaymentIntentCreateOptions
        {
            Amount = amountInCents,
            Currency = "usd",
            ApplicationFeeAmount = feeInCents,
            TransferData = new PaymentIntentTransferDataOptions
            {
                Destination = workerProfile.StripeAccountId
            },
            Metadata = new Dictionary<string, string>
            {
                ["job_id"] = command.JobId.ToString(),
                ["client_id"] = command.ClientId.ToString()
            }
        };

        var intent = await new PaymentIntentService().CreateAsync(options, cancellationToken: cancellationToken);

        job.StripePaymentIntentId = intent.Id;
        await context.SaveChangesAsync(cancellationToken);

        return new CreatePaymentIntentResponse(intent.ClientSecret);
    }
}
