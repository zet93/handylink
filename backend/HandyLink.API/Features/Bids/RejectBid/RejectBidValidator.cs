using FluentValidation;

namespace HandyLink.API.Features.Bids.RejectBid;

public class RejectBidValidator : AbstractValidator<RejectBidCommand>
{
    public RejectBidValidator()
    {
        RuleFor(x => x.BidId).NotEmpty();
    }
}
