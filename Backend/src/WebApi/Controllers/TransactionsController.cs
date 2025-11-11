using FDMA.Application.DTOs;
using FDMA.Application.Interfaces;
using FDMA.Domain.Entities;
using FDMA.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FDMA.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransactionsController : BaseController
{
    private readonly ITransactionService _service;
    private readonly AppDbContext _db;
    public TransactionsController(ITransactionService service, AppDbContext db)
    {
        _service = service;
        _db = db;
    }

    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetList([FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null, [FromQuery] string? account = null, [FromQuery] string? type = null,
        [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null, [FromQuery] int? minRisk = null)
    {
        var (items, total) = await _service.GetPagedAsync(page, pageSize, status, account, type, from, to, minRisk);
        return Ok(new { total, items = items.Select(TransactionResponse.FromEntity) });
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TransactionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var t = await _service.GetByIdAsync(id);
        return t is null ? NotFound() : Ok(TransactionResponse.FromEntity(t));
    }

    [HttpGet("{id:guid}/details")]
    [ProducesResponseType(typeof(TransactionDetailsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDetails(Guid id)
    {
        var details = await _service.GetDetailsByIdAsync(id);
        return details is null ? NotFound() : Ok(details);
    }

    [HttpGet("account/{accountNumber}")]
    [ProducesResponseType(typeof(IEnumerable<TransactionResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByAccount(string accountNumber)
        => Ok((await _service.GetByAccountAsync(accountNumber)).Select(TransactionResponse.FromEntity));

    [HttpPost]
    [Authorize(Roles = "Admin,Analyst")]
    [ProducesResponseType(typeof(TransactionResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create([FromBody] TransactionRequest req)
    {
        var t = new Transaction
        {
            Id = Guid.NewGuid(),
            SenderAccountNumber = req.SenderAccountNumber,
            ReceiverAccountNumber = req.ReceiverAccountNumber,
            TransactionType = req.TransactionType,
            Amount = req.Amount,
            Location = req.Location,
            Device = req.Device,
            IpAddress = req.IpAddress,
            CreatedAt = DateTime.UtcNow,
            Status = "Normal" // Will be updated by CreateAsync based on risk score
        };
        var created = await _service.CreateAsync(t);
        
        CreateAuditLog(_db, "Transaction Created", "Transaction", created.Id, 
            $"Amount: {req.Amount}, Type: {req.TransactionType}");
        await _db.SaveChangesAsync();
        
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, TransactionResponse.FromEntity(created));
    }

    [HttpPut("{id:guid}/flag")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Flag(Guid id, [FromQuery] bool isFlagged = true)
    {
        await _service.FlagAsync(id, isFlagged);
        
        CreateAuditLog(_db, isFlagged ? "Transaction Flagged" : "Transaction Unflagged", 
            "Transaction", id, $"Flagged: {isFlagged}");
        await _db.SaveChangesAsync();
        
        return NoContent();
    }
}