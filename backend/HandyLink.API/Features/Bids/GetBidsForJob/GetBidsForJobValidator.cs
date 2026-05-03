using FluentValidation;

namespace HandyLink.API.Features.Bids.GetBidsForJob;

public class GetBidsForJobValidator : AbstractValidator<GetBidsForJobQuery>
{
    public GetBidsForJobValidator()
    {
        RuleFor(x => x.JobId).NotEmpty();
    }
}
