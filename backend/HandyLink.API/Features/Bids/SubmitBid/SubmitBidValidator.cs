using FluentValidation;

namespace HandyLink.API.Features.Bids.SubmitBid;

public class SubmitBidValidator : AbstractValidator<SubmitBidCommand>
{
    public SubmitBidValidator()
    {
        RuleFor(x => x.PriceEstimate).GreaterThan(0);
        RuleFor(x => x.Message).NotEmpty().MaximumLength(1000);
    }
}
