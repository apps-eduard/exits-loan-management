# Reset Database Script
# This script will drop and recreate the database

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Database Reset Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get database credentials from .env file
$envPath = Join-Path $PSScriptRoot "backend\.env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath
    foreach ($line in $envContent) {
        if ($line -match '^DATABASE_URL=postgres://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)$') {
            $dbUser = $matches[1]
            $dbPassword = $matches[2]
            $dbHost = $matches[3]
            $dbPort = $matches[4]
            $dbName = $matches[5]
            
            Write-Host "Found database configuration:" -ForegroundColor Green
            Write-Host "  Host: $dbHost" -ForegroundColor Gray
            Write-Host "  Port: $dbPort" -ForegroundColor Gray
            Write-Host "  User: $dbUser" -ForegroundColor Gray
            Write-Host "  Database: $dbName" -ForegroundColor Gray
            Write-Host ""
            
            # Confirm action
            Write-Host "WARNING: This will DELETE all data in the database!" -ForegroundColor Yellow
            $confirm = Read-Host "Type 'yes' to continue"
            
            if ($confirm -ne "yes") {
                Write-Host "Operation cancelled." -ForegroundColor Red
                exit 0
            }
            
            # Set password for psql
            $env:PGPASSWORD = $dbPassword
            
            Write-Host ""
            Write-Host "Dropping database '$dbName'..." -ForegroundColor Yellow
            psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "DROP DATABASE IF EXISTS $dbName;"
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Database dropped successfully." -ForegroundColor Green
            } else {
                Write-Host "Failed to drop database." -ForegroundColor Red
                $env:PGPASSWORD = $null
                exit 1
            }
            
            Write-Host "Creating database '$dbName'..." -ForegroundColor Yellow
            psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "CREATE DATABASE $dbName;"
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Database created successfully." -ForegroundColor Green
            } else {
                Write-Host "Failed to create database." -ForegroundColor Red
                $env:PGPASSWORD = $null
                exit 1
            }
            
            # Clear password
            $env:PGPASSWORD = $null
            
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "  Database Reset Complete!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "You can now run the migrations:" -ForegroundColor Cyan
            Write-Host "  cd backend" -ForegroundColor Gray
            Write-Host "  npm run migrate:up" -ForegroundColor Gray
            Write-Host ""
            
            exit 0
        }
    }
    
    Write-Host "Could not parse DATABASE_URL from .env file" -ForegroundColor Red
    exit 1
} else {
    Write-Host "Error: .env file not found at $envPath" -ForegroundColor Red
    Write-Host "Please run setup.ps1 first." -ForegroundColor Yellow
    exit 1
}
