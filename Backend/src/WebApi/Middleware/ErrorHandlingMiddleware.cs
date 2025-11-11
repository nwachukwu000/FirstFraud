using System.Net;
using System.Text.Json;

namespace FDMA.WebApi.Middleware;

public class ErrorHandlingMiddleware
{
	private readonly RequestDelegate _next;
	private readonly ILogger<ErrorHandlingMiddleware> _logger;

	public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
	{
		_next = next;
		_logger = logger;
	}

	public async Task Invoke(HttpContext context)
	{
		var correlationId = context.TraceIdentifier;
		try
		{
			await _next(context);
		}
		catch (Exception ex)
		{
			_logError(ex, context, correlationId);
			await WriteProblemJsonAsync(context, correlationId);
		}
	}

	private void _logError(Exception ex, HttpContext ctx, string correlationId)
	{
		_logger.LogError(ex,
			"Unhandled exception. {Method} {Path} | CorrelationId: {CorrelationId}",
			ctx.Request.Method,
			ctx.Request.Path,
			correlationId);
	}

	private static async Task WriteProblemJsonAsync(HttpContext context, string correlationId)
	{
		context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
		context.Response.ContentType = "application/json";

		var payload = new
		{
			status = context.Response.StatusCode,
			title = "An unexpected error occurred",
			detail = "Please contact support with the correlation id if the problem persists.",
			correlationId
		};

		var json = JsonSerializer.Serialize(payload);
		await context.Response.WriteAsync(json);
	}
}
