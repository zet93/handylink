using FluentValidation;

namespace HandyLink.API.Features.Workers.UpdateWorkerLocation;

public class UpdateWorkerLocationValidator : AbstractValidator<UpdateWorkerLocationCommand>
{
    private static readonly int[] AllowedRadii = [10, 20, 50, 100];

    public UpdateWorkerLocationValidator()
    {
        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90m, 90m)
            .When(x => x.Latitude.HasValue);

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180m, 180m)
            .When(x => x.Longitude.HasValue);

        RuleFor(x => x.ServiceRadiusKm)
            .Must(v => AllowedRadii.Contains(v!.Value))
            .WithMessage("Service radius must be 10, 20, 50, or 100 km")
            .When(x => x.ServiceRadiusKm.HasValue);

        RuleFor(x => x)
            .Must(x => (x.Latitude.HasValue && x.Longitude.HasValue)
                       || (!x.Latitude.HasValue && !x.Longitude.HasValue))
            .WithMessage("Latitude and longitude must both be provided or both omitted.");
    }
}
