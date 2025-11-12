using FDMA.Domain.Entities;

namespace FDMA.Application.Interfaces;

public interface IEmailService
{
    Task SendTransactionFlaggedEmailAsync(Transaction transaction, Alert alert);
    Task SendCaseAssignmentEmailAsync(Case caseEntity, User analyst, Transaction transaction, User? assignedBy);
}

