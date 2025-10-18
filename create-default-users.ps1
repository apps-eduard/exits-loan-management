# Default User Creation Script
# Creates default Super Admin and Collector users with password: ChangeMe123!
# Run this after setup.ps1 to add additional default users
# Note: setup.ps1 already creates admin@pacifica.ph with password Admin@123

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Additional Default Users Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Database connection settings
$dbHost = "localhost"
$dbPort = "5432"
$dbName = "exits_loans_db"
$dbUser = "postgres"
$dbPassword = "admin"

# Find PostgreSQL installation (check versions 14-18)
Write-Host "🔍 Searching for PostgreSQL installation..." -ForegroundColor Cyan
$pgPath = $null
$possibleVersions = 18..14

foreach ($version in $possibleVersions) {
    $testPath = "C:\Program Files\PostgreSQL\$version\bin"
    if (Test-Path $testPath) {
        $pgPath = $testPath
        Write-Host "✅ Found PostgreSQL $version at: $pgPath" -ForegroundColor Green
        break
    }
}

if (-not $pgPath) {
    Write-Host "❌ PostgreSQL not found in standard locations" -ForegroundColor Red
    Write-Host "   Searched: C:\Program Files\PostgreSQL\{14-18}\bin" -ForegroundColor Yellow
    Write-Host "   Please install PostgreSQL or add it to your PATH" -ForegroundColor Yellow
    exit 1
}

# Add PostgreSQL to PATH for this session
$env:PATH = "$pgPath;$env:PATH"

# Check if PostgreSQL is available
try {
    $env:PGPASSWORD = $dbPassword
    $testConnection = & "$pgPath\psql.exe" -h $dbHost -p $dbPort -U $dbUser -d $dbName -c "SELECT 1" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Cannot connect to database" -ForegroundColor Red
        Write-Host "   Make sure PostgreSQL is running and setup.ps1 has been executed" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Database connection successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to connect to PostgreSQL" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n📝 Creating default users..." -ForegroundColor Cyan

# Default password (must be changed on first login)
$defaultPassword = "ChangeMe123!"
Write-Host "`n⚠️  Default Password: $defaultPassword" -ForegroundColor Yellow
Write-Host "   All users MUST change this password on first login`n" -ForegroundColor Yellow

# Hash the password using Node.js and bcryptjs from backend
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $scriptDir "backend"

# Create a temporary Node.js script to hash the password
$hashScript = @"
const bcrypt = require('bcryptjs');
const password = '$defaultPassword';
bcrypt.hash(password, 10).then(hash => {
    console.log(hash);
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
"@

$tempFile = Join-Path $backendDir "temp_hash_password.js"
Set-Content -Path $tempFile -Value $hashScript

Push-Location $backendDir
Write-Host "Generating password hash..." -ForegroundColor Cyan
$passwordHash = node temp_hash_password.js 2>&1 | Select-Object -Last 1
Pop-Location

Remove-Item $tempFile -ErrorAction SilentlyContinue

if (-not $passwordHash -or $passwordHash -notmatch '^\$2[aby]\$') {
    Write-Host "❌ Failed to hash password" -ForegroundColor Red
    Write-Host "   Output: $passwordHash" -ForegroundColor Yellow
    Write-Host "   Make sure Node.js is installed and backend dependencies are installed" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Password hash generated successfully" -ForegroundColor Green

# SQL script to create additional default users
$sqlScript = @"
-- Get required IDs
DO `$`$
DECLARE
    super_admin_role_id UUID;
    collector_role_id UUID;
    head_office_id UUID;
    branch_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO super_admin_role_id FROM roles WHERE name = 'Super Admin' LIMIT 1;
    SELECT id INTO collector_role_id FROM roles WHERE name = 'Collector' LIMIT 1;
    
    -- Get organizational unit IDs
    SELECT id INTO head_office_id FROM organizational_units WHERE code = 'HQ' LIMIT 1;
    SELECT id INTO branch_id FROM organizational_units WHERE type = 'branch' AND code != 'HQ' LIMIT 1;
    
    -- If no separate branch, use head office for all
    IF branch_id IS NULL THEN
        branch_id := head_office_id;
    END IF;

    -- Create admin@exits.com (alternative Super Admin) if not exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@exits.com') THEN
        INSERT INTO users (
            email, first_name, last_name, phone,
            role_id, organizational_unit_id, password_hash, status
        ) VALUES (
            'admin@exits.com',
            'System',
            'Administrator',
            '+1234567890',
            super_admin_role_id,
            head_office_id,
            '$passwordHash',
            'active'
        );
        RAISE NOTICE '✅ Created Super Admin: admin@exits.com';
    ELSE
        RAISE NOTICE '⚠️  Super Admin already exists: admin@exits.com';
    END IF;

    -- Create Collector if not exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'collector@exits.com') THEN
        IF collector_role_id IS NOT NULL THEN
            INSERT INTO users (
                email, first_name, last_name, phone,
                role_id, organizational_unit_id, password_hash, status
            ) VALUES (
                'collector@exits.com',
                'John',
                'Collector',
                '+1234567891',
                collector_role_id,
                branch_id,
                '$passwordHash',
                'active'
            );
            RAISE NOTICE '✅ Created Collector: collector@exits.com';
        ELSE
            RAISE NOTICE '⚠️  No Collector role found';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  Collector already exists: collector@exits.com';
    END IF;

END `$`$;
"@

# Execute SQL script
Write-Host "Executing user creation..." -ForegroundColor Cyan
$sqlFile = Join-Path $env:TEMP "create_default_users.sql"
Set-Content -Path $sqlFile -Value $sqlScript

$env:PGPASSWORD = $dbPassword
$result = & "$pgPath\psql.exe" -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $sqlFile 2>&1

# Display results
Write-Host $result

# Clean up
Remove-Item $sqlFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "   ✅ Additional Users Created!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
    Write-Host "📋 Default User Credentials:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    Write-Host "`n🔐 Primary Super Admin (from setup.ps1)" -ForegroundColor Yellow
    Write-Host "   Email:    admin@pacifica.ph" -ForegroundColor White
    Write-Host "   Password: Admin@123" -ForegroundColor White
    Write-Host "   Role:     Full system access" -ForegroundColor Gray
    
    Write-Host "`n🔐 Alternative Super Admin (Web App)" -ForegroundColor Yellow
    Write-Host "   Email:    admin@exits.com" -ForegroundColor White
    Write-Host "   Password: $defaultPassword" -ForegroundColor White
    Write-Host "   Role:     Full system access" -ForegroundColor Gray
    
    Write-Host "`n🔐 Collector (Collector App)" -ForegroundColor Yellow
    Write-Host "   Email:    collector@exits.com" -ForegroundColor White
    Write-Host "   Password: $defaultPassword" -ForegroundColor White
    Write-Host "   Role:     Collections & field work" -ForegroundColor Gray
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "`n⚠️  IMPORTANT SECURITY NOTICE:" -ForegroundColor Red
    Write-Host "   1. Change all default passwords immediately after first login" -ForegroundColor Yellow
    Write-Host "   2. These credentials are for initial setup only" -ForegroundColor Yellow
    Write-Host "   3. Never use default passwords in production" -ForegroundColor Yellow
    
    Write-Host "`n📱 Application URLs:" -ForegroundColor Cyan
    Write-Host "   Web Admin:     http://localhost:4200" -ForegroundColor White
    Write-Host "   Customer App:  http://localhost:8100" -ForegroundColor White
    Write-Host "   Collector App: http://localhost:8101" -ForegroundColor White
    Write-Host "   Backend API:   http://localhost:3000" -ForegroundColor White
    
    Write-Host "`n✅ You can now login with these credentials`n" -ForegroundColor Green
} else {
    Write-Host "`n❌ Failed to create additional users" -ForegroundColor Red
    Write-Host "   Check the error messages above for details" -ForegroundColor Yellow
    exit 1
}
