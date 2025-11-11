# PowerShell script to create a new PostgreSQL database for FDT2
# This script connects to PostgreSQL and creates the database if it doesn't exist

$dbName = "fdt2_db"
$dbHost = "localhost"
$dbPort = "5432"
$dbUser = "postgres"
$dbPassword = "GODSLOVe_39"

# Set the PGPASSWORD environment variable for psql
$env:PGPASSWORD = $dbPassword

Write-Host "Creating database '$dbName'..." -ForegroundColor Cyan

# Check if database exists
$checkDbQuery = "SELECT 1 FROM pg_database WHERE datname = '$dbName'"
$dbExists = psql -h $dbHost -p $dbPort -U $dbUser -d postgres -tAc $checkDbQuery

if ($dbExists -eq "1") {
    Write-Host "Database '$dbName' already exists." -ForegroundColor Yellow
    Write-Host "Do you want to drop and recreate it? (y/N): " -NoNewline -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host "Dropping existing database..." -ForegroundColor Yellow
        psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "DROP DATABASE IF EXISTS $dbName;"
        Write-Host "Creating new database '$dbName'..." -ForegroundColor Cyan
        psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "CREATE DATABASE $dbName;"
        Write-Host "Database '$dbName' created successfully!" -ForegroundColor Green
    } else {
        Write-Host "Database creation skipped." -ForegroundColor Yellow
    }
} else {
    # Create the database
    psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "CREATE DATABASE $dbName;"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database '$dbName' created successfully!" -ForegroundColor Green
    } else {
        Write-Host "Failed to create database. Please check your PostgreSQL connection settings." -ForegroundColor Red
        exit 1
    }
}

# Clear the password from environment
Remove-Item Env:\PGPASSWORD

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run migrations: cd src/WebApi && dotnet ef database update --project ../Infrastructure/Infrastructure.csproj --startup-project WebApi.csproj" -ForegroundColor White
Write-Host "2. Or simply run the application - migrations will run automatically on startup" -ForegroundColor White

