using Assessment.Data;
using Assessment.Shared.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Assessment.Application.Calls.Queries;

public class GetCallsListQuery : IRequest<Result<GetCallsListResult>> { }

public class GetCallsListResult
{
    public List<CallListItem> Items { get; set; }
}

public class CallListItem
{
    public Guid Id { get; set; }

    public string Username { get; set; }

    public DateTimeOffset DateCallStarted { get; set; }
}

public class GetCallsListQueryHandler : IRequestHandler<GetCallsListQuery, Result<GetCallsListResult>>
{
    private readonly ApplicationDbContext _context;

    public GetCallsListQueryHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<GetCallsListResult>> Handle(
        GetCallsListQuery request,
        CancellationToken cancellationToken)
    {
        var test = await _context.Calls.ToListAsync(cancellationToken: cancellationToken);

        var result = new GetCallsListResult
        {
            Items = await _context
                .Calls
                .Select(x => new CallListItem
                {
                    Id = x.CallingUserId,
                    DateCallStarted = x.DateCallStarted,
                    Username = x.CallingUser.Username
                })
                .ToListAsync(cancellationToken: cancellationToken)
        };

        return Result<GetCallsListResult>.Success(result);
    }
}