FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["HandyLink.API/HandyLink.API.csproj", "HandyLink.API/"]
COPY ["HandyLink.Core/HandyLink.Core.csproj", "HandyLink.Core/"]
COPY ["HandyLink.Infrastructure/HandyLink.Infrastructure.csproj", "HandyLink.Infrastructure/"]
RUN dotnet restore "HandyLink.API/HandyLink.API.csproj"
COPY . .
RUN dotnet publish "HandyLink.API/HandyLink.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "HandyLink.API.dll"]
