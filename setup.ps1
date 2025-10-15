# Pacifica Loan Management System - Automated Setup Script
# This script will set up the entire project on a new machine

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Pacifica Loan Management System" -ForegroundColor Cyan
Write-Host "  Automated Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-CommandExists {
    param($command)
    $null = Get-Command $command -ErrorAction SilentlyContinue
    return $?
}

# Function to print section headers
function Write-Section {
    param($message)
    Write-Host ""
    Write-Host "===> $message" -ForegroundColor Yellow
    Write-Host ""
}

# Function to print success messages
function Write-Success {
    param($message)
    Write-Host "[SUCCESS] $message" -ForegroundColor Green
}

# Function to print error messages
function Write-ErrorMsg {
    param($message)
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

# Function to print info messages
function Write-Info {
    param($message)
    Write-Host "[INFO] $message" -ForegroundColor Cyan
}

# Get the script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Section "Step 1: Checking Prerequisites"

# Check Node.js
if (Test-CommandExists "node") {
    $nodeVersion = node --version
    Write-Success "Node.js is installed: $nodeVersion"
} else {
    Write-ErrorMsg "Node.js is NOT installed!"
    Write-Info "Please install Node.js from: https://nodejs.org/"
    Write-Info "Recommended version: v18 or higher"
    exit 1
}

# Check npm
if (Test-CommandExists "npm") {
    $npmVersion = npm --version
    Write-Success "npm is installed: $npmVersion"
} else {
    Write-ErrorMsg "npm is NOT installed!"
    exit 1
}

# Check Git
if (Test-CommandExists "git") {
    $gitVersion = git --version
    Write-Success "Git is installed: $gitVersion"
} else {
    Write-ErrorMsg "Git is NOT installed!"
    Write-Info "Please install Git from: https://git-scm.com/"
    exit 1
}

# Check PostgreSQL
if (Test-CommandExists "psql") {
    $pgVersion = psql --version
    Write-Success "PostgreSQL is installed: $pgVersion"
} else {
    Write-ErrorMsg "PostgreSQL is NOT installed!"
    Write-Info "Please install PostgreSQL from: https://www.postgresql.org/download/"
    Write-Info "Recommended version: 14 or higher"
    exit 1
}

# Check Ionic CLI
if (Test-CommandExists "ionic") {
    Write-Success "Ionic CLI is installed"
} else {
    Write-Info "Ionic CLI is NOT installed. Installing globally..."
    npm install -g @ionic/cli
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Ionic CLI installed successfully"
    } else {
        Write-ErrorMsg "Failed to install Ionic CLI"
        exit 1
    }
}

# Check Angular CLI
if (Test-CommandExists "ng") {
    Write-Success "Angular CLI is installed"
} else {
    Write-Info "Angular CLI is NOT installed. Installing globally..."
    npm install -g @angular/cli
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Angular CLI installed successfully"
    } else {
        Write-ErrorMsg "Failed to install Angular CLI"
        exit 1
    }
}

Write-Section "Step 2: Database Configuration"

# Prompt for database credentials
Write-Host "Please enter your PostgreSQL database credentials:" -ForegroundColor Cyan
$dbHost = Read-Host "Database Host (default: localhost)"
if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = "localhost" }

$dbPort = Read-Host "Database Port (default: 5432)"
if ([string]::IsNullOrWhiteSpace($dbPort)) { $dbPort = "5432" }

$dbUser = Read-Host "Database User (default: postgres)"
if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "postgres" }

$dbPassword = Read-Host "Database Password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

$dbName = Read-Host "Database Name (default: pacifica_loans)"
if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "pacifica_loans" }

Write-Info "Testing database connection..."

# Test connection
$env:PGPASSWORD = $dbPasswordPlain
$testConnection = psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "SELECT 1;" 2>&1
$env:PGPASSWORD = $null

if ($LASTEXITCODE -eq 0) {
    Write-Success "Database connection successful"
} else {
    Write-ErrorMsg "Failed to connect to PostgreSQL"
    Write-ErrorMsg "Error: $testConnection"
    Write-Info "Please check your credentials and ensure PostgreSQL is running"
    exit 1
}

Write-Section "Step 3: Creating Database"

# Check if database exists
$env:PGPASSWORD = $dbPasswordPlain
$dbExists = psql -h $dbHost -p $dbPort -U $dbUser -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='$dbName';" 2>&1
$env:PGPASSWORD = $null

if ($dbExists -match "1") {
    Write-Info "Database '$dbName' already exists"
    $overwrite = Read-Host "Do you want to DROP and recreate it? (yes/no)"
    if ($overwrite -eq "yes") {
        Write-Info "Dropping existing database..."
        $env:PGPASSWORD = $dbPasswordPlain
        psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "DROP DATABASE IF EXISTS $dbName;"
        $env:PGPASSWORD = $null
        
        Write-Info "Creating new database..."
        $env:PGPASSWORD = $dbPasswordPlain
        psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "CREATE DATABASE $dbName;"
        $env:PGPASSWORD = $null
        Write-Success "Database recreated successfully"
    }
} else {
    Write-Info "Creating database '$dbName'..."
    $env:PGPASSWORD = $dbPasswordPlain
    psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "CREATE DATABASE $dbName;"
    $env:PGPASSWORD = $null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database created successfully"
    } else {
        Write-ErrorMsg "Failed to create database"
        exit 1
    }
}

Write-Section "Step 4: Configuring Backend Environment"

# Generate random JWT secrets
function New-RandomSecret {
    $bytes = New-Object Byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

$jwtSecret = New-RandomSecret
$jwtRefreshSecret = New-RandomSecret

# Create .env file
$envContent = @"
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://${dbUser}:${dbPasswordPlain}@${dbHost}:${dbPort}/${dbName}
DB_SSL=false
LOG_LEVEL=debug

# JWT Configuration
JWT_SECRET=$jwtSecret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=$jwtRefreshSecret
JWT_REFRESH_EXPIRES_IN=7d
"@

$envPath = Join-Path $ScriptDir "backend\.env"
Set-Content -Path $envPath -Value $envContent
Write-Success "Backend .env file created"

Write-Section "Step 5: Installing Backend Dependencies"

Set-Location (Join-Path $ScriptDir "backend")
Write-Info "Installing backend packages (this may take a few minutes)..."
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Success "Backend dependencies installed"
} else {
    Write-ErrorMsg "Failed to install backend dependencies"
    exit 1
}

Write-Section "Step 6: Running Database Migrations"

Write-Info "Building TypeScript files..."
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Success "Backend built successfully"
} else {
    Write-ErrorMsg "Failed to build backend"
    exit 1
}

Write-Info "Running database migrations..."
npm run migrate:up

if ($LASTEXITCODE -eq 0) {
    Write-Success "Database migrations completed"
    Write-Success "Database tables and seed data created"
} else {
    Write-ErrorMsg "Failed to run migrations"
    exit 1
}

Write-Section "Step 7: Installing Web App Dependencies"

Set-Location (Join-Path $ScriptDir "web")
Write-Info "Installing web app packages (this may take a few minutes)..."
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Success "Web app dependencies installed"
} else {
    Write-ErrorMsg "Failed to install web app dependencies"
    exit 1
}

Write-Section "Step 8: Installing Customer App Dependencies"

Set-Location (Join-Path $ScriptDir "customer-app")
Write-Info "Installing customer app packages (this may take a few minutes)..."
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Success "Customer app dependencies installed"
} else {
    Write-ErrorMsg "Failed to install customer app dependencies"
    exit 1
}

Write-Section "Step 9: Installing Collector App Dependencies"

Set-Location (Join-Path $ScriptDir "collector-app")
Write-Info "Installing collector app packages (this may take a few minutes)..."
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Success "Collector app dependencies installed"
} else {
    Write-ErrorMsg "Failed to install collector app dependencies"
    exit 1
}

# Return to root directory
Set-Location $ScriptDir

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SETUP COMPLETED SUCCESSFULLY! ✓" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Your Pacifica Loan Management System is ready!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Default Test Credentials:" -ForegroundColor Yellow
Write-Host "  Super Admin:" -ForegroundColor White
Write-Host "    Email: admin@pacifica.ph" -ForegroundColor Gray
Write-Host "    Password: Admin@123" -ForegroundColor Gray
Write-Host ""
Write-Host "  Branch Manager:" -ForegroundColor White
Write-Host "    Email: manager@pacifica.ph" -ForegroundColor Gray
Write-Host "    Password: Manager@123" -ForegroundColor Gray
Write-Host ""
Write-Host "  Loan Officer:" -ForegroundColor White
Write-Host "    Email: officer@pacifica.ph" -ForegroundColor Gray
Write-Host "    Password: Officer@123" -ForegroundColor Gray
Write-Host ""

Write-Host "To start the applications:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Backend API:" -ForegroundColor Yellow
Write-Host "     cd backend" -ForegroundColor Gray
Write-Host "     npm run dev" -ForegroundColor Gray
Write-Host "     -> Runs on http://localhost:3000" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  2. Web Admin App:" -ForegroundColor Yellow
Write-Host "     cd web" -ForegroundColor Gray
Write-Host "     ng serve" -ForegroundColor Gray
Write-Host "     -> Runs on http://localhost:4200" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  3. Customer Mobile App:" -ForegroundColor Yellow
Write-Host "     cd customer-app" -ForegroundColor Gray
Write-Host "     ionic serve" -ForegroundColor Gray
Write-Host "     -> Runs on http://localhost:8100" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  4. Collector Mobile App:" -ForegroundColor Yellow
Write-Host "     cd collector-app" -ForegroundColor Gray
Write-Host "     ionic serve" -ForegroundColor Gray
Write-Host "     -> Runs on http://localhost:8101" -ForegroundColor DarkGray
Write-Host ""

Write-Host "Or use the start-all.ps1 script to start all services at once!" -ForegroundColor Green
Write-Host ""

Write-Host "For more information, see README.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
