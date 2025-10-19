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
$defaultPassword = "11223344
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
    admin_role_id UUID;
    collector_role_id UUID;
    head_office_id UUID;
    branch_id UUID;
    default_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
    test_tenant_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO super_admin_role_id FROM roles WHERE name = 'Super Admin' LIMIT 1;
    SELECT id INTO admin_role_id FROM roles WHERE name = 'Admin' LIMIT 1;
    SELECT id INTO collector_role_id FROM roles WHERE name = 'Collector' LIMIT 1;
    
    -- Get organizational unit IDs
    SELECT id INTO head_office_id FROM organizational_units WHERE code = 'HQ' LIMIT 1;
    SELECT id INTO branch_id FROM organizational_units WHERE type = 'branch' AND code != 'HQ' LIMIT 1;
    
    -- If no separate branch, use head office for all
    IF branch_id IS NULL THEN
        branch_id := head_office_id;
    END IF;

    -- Create test tenant if not exists
    IF NOT EXISTS (SELECT 1 FROM tenants WHERE slug = 'test-company') THEN
        INSERT INTO tenants (
            company_name, slug, logo_url, primary_color,
            contact_email, contact_phone, status, subscription_plan,
            max_customers, max_loans, max_users
        ) VALUES (
            'Test Company Inc.',
            'test-company',
            NULL,
            '#10B981',
            'admin@testcompany.com',
            '+63-917-123-4567',
            'active',
            'professional',
            500,
            1000,
            20
        ) RETURNING id INTO test_tenant_id;
        RAISE NOTICE '✅ Created Test Tenant: Test Company Inc. (slug: test-company)';
    ELSE
        SELECT id INTO test_tenant_id FROM tenants WHERE slug = 'test-company';
        RAISE NOTICE '⚠️  Test Tenant already exists: test-company';
    END IF;

    -- Create admin@exits.com (alternative Super Admin for DEFAULT tenant) if not exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@exits.com') THEN
        INSERT INTO users (
            email, first_name, last_name, phone,
            role_id, organizational_unit_id, tenant_id, password_hash, 
            status, is_super_admin
        ) VALUES (
            'admin@exits.com',
            'System',
            'Administrator',
            '+1234567890',
            super_admin_role_id,
            head_office_id,
            default_tenant_id,
            '$passwordHash',
            'active',
            true
        );
        RAISE NOTICE '✅ Created Super Admin: admin@exits.com (Default Tenant)';
    ELSE
        RAISE NOTICE '⚠️  Super Admin already exists: admin@exits.com';
    END IF;

    -- Create Collector for DEFAULT tenant if not exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'collector@exits.com') THEN
        IF collector_role_id IS NOT NULL THEN
            INSERT INTO users (
                email, first_name, last_name, phone,
                role_id, organizational_unit_id, tenant_id, password_hash, status
            ) VALUES (
                'collector@exits.com',
                'John',
                'Collector',
                '+1234567891',
                collector_role_id,
                branch_id,
                default_tenant_id,
                '$passwordHash',
                'active'
            );
            RAISE NOTICE '✅ Created Collector: collector@exits.com (Default Tenant)';
        ELSE
            RAISE NOTICE '⚠️  No Collector role found';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  Collector already exists: collector@exits.com';
    END IF;

    -- Create TEST TENANT Admin
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@testcompany.com') THEN
        IF admin_role_id IS NOT NULL THEN
            INSERT INTO users (
                email, first_name, last_name, phone,
                role_id, organizational_unit_id, tenant_id, password_hash, 
                status, is_super_admin
            ) VALUES (
                'admin@testcompany.com',
                'Test',
                'Admin',
                '+63-917-123-4567',
                admin_role_id,
                head_office_id,
                test_tenant_id,
                '$passwordHash',
                'active',
                false
            );
            RAISE NOTICE '✅ Created Tenant Admin: admin@testcompany.com (Test Company)';
        ELSE
            RAISE NOTICE '⚠️  No Admin role found';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  Test Company Admin already exists: admin@testcompany.com';
    END IF;

    -- Create TEST TENANT Collector
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'collector@testcompany.com') THEN
        IF collector_role_id IS NOT NULL THEN
            INSERT INTO users (
                email, first_name, last_name, phone,
                role_id, organizational_unit_id, tenant_id, password_hash, status
            ) VALUES (
                'collector@testcompany.com',
                'Maria',
                'Santos',
                '+63-917-123-4568',
                collector_role_id,
                branch_id,
                test_tenant_id,
                '$passwordHash',
                'active'
            );
            RAISE NOTICE '✅ Created Tenant Collector: collector@testcompany.com (Test Company)';
        ELSE
            RAISE NOTICE '⚠️  No Collector role found';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  Test Company Collector already exists: collector@testcompany.com';
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
    Write-Host "   ✅ Users & Test Tenant Created!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
    Write-Host "📋 Default User Credentials:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    Write-Host "`n🏢 DEFAULT TENANT (ExITS Finance System)" -ForegroundColor Magenta
    Write-Host "   Tenant ID: 00000000-0000-0000-0000-000000000001" -ForegroundColor Gray
    
    Write-Host "`n🔐 Primary Super Admin (from setup.ps1)" -ForegroundColor Yellow
    Write-Host "   Email:    admin@pacifica.ph" -ForegroundColor White
    Write-Host "   Password: Admin@123" -ForegroundColor White
    Write-Host "   Role:     Super Admin (Cross-tenant access)" -ForegroundColor Gray
    Write-Host "   Login:    http://localhost:4200/auth/login" -ForegroundColor Cyan
    
    Write-Host "`n🔐 Alternative Super Admin (Web App)" -ForegroundColor Yellow
    Write-Host "   Email:    admin@exits.com" -ForegroundColor White
    Write-Host "   Password: $defaultPassword" -ForegroundColor White
    Write-Host "   Role:     Super Admin (Cross-tenant access)" -ForegroundColor Gray
    Write-Host "   Login:    http://localhost:4200/auth/login" -ForegroundColor Cyan
    
    Write-Host "`n🔐 Collector (Collector App)" -ForegroundColor Yellow
    Write-Host "   Email:    collector@exits.com" -ForegroundColor White
    Write-Host "   Password: $defaultPassword" -ForegroundColor White
    Write-Host "   Role:     Collections & field work" -ForegroundColor Gray
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "`n🏢 TEST TENANT (Test Company Inc.)" -ForegroundColor Magenta
    Write-Host "   Slug:     test-company" -ForegroundColor Gray
    Write-Host "   Plan:     Professional" -ForegroundColor Gray
    Write-Host "   Status:   Active" -ForegroundColor Green
    
    Write-Host "`n🔐 Tenant Admin" -ForegroundColor Yellow
    Write-Host "   Email:    admin@testcompany.com" -ForegroundColor White
    Write-Host "   Password: $defaultPassword" -ForegroundColor White
    Write-Host "   Role:     Tenant Administrator" -ForegroundColor Gray
    Write-Host "   Login:    http://localhost:4200/auth/tenant/test-company" -ForegroundColor Cyan
    
    Write-Host "`n🔐 Tenant Collector" -ForegroundColor Yellow
    Write-Host "   Email:    collector@testcompany.com" -ForegroundColor White
    Write-Host "   Password: $defaultPassword" -ForegroundColor White
    Write-Host "   Role:     Field Collector" -ForegroundColor Gray
    Write-Host "   Login:    http://localhost:4200/auth/tenant/test-company" -ForegroundColor Cyan
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "`n⚠️  IMPORTANT SECURITY NOTICE:" -ForegroundColor Red
    Write-Host "   1. Change all default passwords immediately after first login" -ForegroundColor Yellow
    Write-Host "   2. These credentials are for initial setup only" -ForegroundColor Yellow
    Write-Host "   3. Never use default passwords in production" -ForegroundColor Yellow
    
    Write-Host "`n📱 Application URLs:" -ForegroundColor Cyan
    Write-Host "   Super Admin Login:   http://localhost:4200/auth/login" -ForegroundColor White
    Write-Host "   Tenant Login:        http://localhost:4200/auth/tenant/{slug}" -ForegroundColor White
    Write-Host "   Customer App:        http://localhost:8100" -ForegroundColor White
    Write-Host "   Collector App:       http://localhost:8101" -ForegroundColor White
    Write-Host "   Backend API:         http://localhost:3000" -ForegroundColor White
    
    Write-Host "`n💡 Quick Start:" -ForegroundColor Cyan
    Write-Host "   1. Super Admin: Login at /auth/login to manage all tenants" -ForegroundColor White
    Write-Host "   2. Test Tenant: Login at /auth/tenant/test-company for tenant-specific view" -ForegroundColor White
    Write-Host "   3. Use 'Login as Tenant' button in super admin login to test tenants" -ForegroundColor White
    
    Write-Host "`n✅ You can now login with these credentials`n" -ForegroundColor Green
} else {
    Write-Host "`n❌ Failed to create additional users" -ForegroundColor Red
    Write-Host "   Check the error messages above for details" -ForegroundColor Yellow
    exit 1
}
