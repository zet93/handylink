using HandyLink.Core.Exceptions;
using HandyLink.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Stripe;

namespace HandyLink.API.Features.Payments.WorkerConnectOnboard;

public class WorkerConnectOnboardHandler(
    HandyLinkDbContext context,
    IConfiguration configuration
) : IRequestHandler<WorkerConnectOnboardCommand, WorkerConnectOnboardResponse>
{
    public async Task<WorkerConnectOnboardResponse> Handle(
        WorkerConnectOnboardCommand command,
        CancellationToken cancellationToken)
    {
        var workerProfile = await context.WorkerProfiles
            .FirstOrDefaultAsync(w => w.Id == command.WorkerId, cancellationToken)
            ?? throw new NotFoundException("Worker profile not found.");

        StripeConfiguration.ApiKey = configuration["Stripe:SecretKey"];

        if (string.IsNullOrEmpty(workerProfile.StripeAccountId))
        {
            var account = await new AccountService().CreateAsync(
                new AccountCreateOptions { Type = "express" },
                cancellationToken: cancellationToken);

            workerProfile.StripeAccountId = account.Id;
            await context.SaveChangesAsync(cancellationToken);
        }

        var refreshUrl = configuration["Stripe:RefreshUrl"] ?? "https://handylink.app/worker/profile";
        var returnUrl = configuration["Stripe:ReturnUrl"] ?? "https://handylink.app/worker/profile";

        var accountLink = await new AccountLinkService().CreateAsync(
            new AccountLinkCreateOptions
            {
                Account = workerProfile.StripeAccountId,
                RefreshUrl = refreshUrl,
                ReturnUrl = returnUrl,
                Type = "account_onboarding"
            },
            cancellationToken: cancellationToken);

        return new WorkerConnectOnboardResponse(accountLink.Url);
    }
}
