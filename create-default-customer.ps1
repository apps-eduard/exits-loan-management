#!/usr/bin/env pwsh
# create-default-customer.ps1
# Creates a default customer user for testing the customer-app

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Creating Default Customer User" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Database connection settings
$env:PGPASSWORD = "admin"
$dbHost = "localhost"
$dbPort = "5432"
$dbName = "exits_loans_db"
$dbUser = "postgres"

# Default customer credentials
$customerEmail = "customer@exits.com"
$customerPassword = "Customer@123"
$customerPhone = "09171234567"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Email: $customerEmail" -ForegroundColor Gray
Write-Host "   Password: $customerPassword" -ForegroundColor Gray
Write-Host "   Phone: $customerPhone" -ForegroundColor Gray
Write-Host ""

# Generate bcrypt hash for the password using Node.js
Write-Host "🔐 Generating password hash..." -ForegroundColor Yellow

$hashScript = @"
const bcrypt = require('./backend/node_modules/bcryptjs');
bcrypt.hash('$customerPassword', 10).then(hash => {
  console.log(hash);
  process.exit(0);
}).catch(err => {
  console.error('Hash error:', err);
  process.exit(1);
});
"@

$passwordHash = node -e $hashScript

if ($LASTEXITCODE -ne 0 -or -not $passwordHash) {
    Write-Host "❌ Failed to generate password hash" -ForegroundColor Red
    exit 1
}

# Validate hash format
if ($passwordHash -notmatch '^\$2[aby]\$') {
    Write-Host "❌ Invalid bcrypt hash format: $passwordHash" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Password hash generated successfully" -ForegroundColor Green
Write-Host ""

# Create Customer role if it doesn't exist
Write-Host "👥 Ensuring Customer role exists..." -ForegroundColor Yellow
$checkRoleQuery = "SELECT id FROM roles WHERE name = 'Customer';"
$customerRoleId = (psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -A -c $checkRoleQuery).Trim()

if (-not $customerRoleId) {
    Write-Host "➕ Creating Customer role..." -ForegroundColor Yellow
    $customerRoleId = "b0000000-0000-0000-0000-000000000099"
    
    $createRoleQuery = @"
INSERT INTO roles (id, name, description, created_at, updated_at)
VALUES (
    '$customerRoleId',
    'Customer',
    'Customer portal user role',
    now(),
    now()
);
"@
    
    psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $createRoleQuery | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Customer role created: $customerRoleId" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create Customer role" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Customer role already exists: $customerRoleId" -ForegroundColor Green
}

Write-Host ""

# Get the Super Admin user ID (creator)
Write-Host "👤 Getting Super Admin user ID..." -ForegroundColor Yellow
$adminQuery = "SELECT id FROM users WHERE email = 'admin@pacifica.ph' LIMIT 1;"
$adminId = (psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -A -c $adminQuery).Trim()

if (-not $adminId) {
    Write-Host "❌ Super Admin user not found. Please run setup.ps1 first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found Super Admin: $adminId" -ForegroundColor Green
Write-Host ""

# Get the default organizational unit (Head Office)
Write-Host "🏢 Getting organizational unit..." -ForegroundColor Yellow
$ouQuery = "SELECT id FROM organizational_units WHERE name = 'Head Office' LIMIT 1;"
$ouId = (psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -A -c $ouQuery).Trim()

if (-not $ouId) {
    Write-Host "❌ Organizational unit not found. Please run setup.ps1 first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found organizational unit: $ouId" -ForegroundColor Green
Write-Host ""

# Check if customer user already exists
Write-Host "🔍 Checking if customer user already exists..." -ForegroundColor Yellow
$checkUserQuery = "SELECT id FROM users WHERE email = '$customerEmail';"
$existingUserId = (psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -A -c $checkUserQuery).Trim()

if ($existingUserId) {
    Write-Host "⚠️  Customer user already exists with ID: $existingUserId" -ForegroundColor Yellow
    Write-Host "🔄 Updating password..." -ForegroundColor Yellow
    
    $updateUserQuery = "UPDATE users SET password_hash = '$passwordHash', updated_at = now() WHERE email = '$customerEmail';"
    psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $updateUserQuery | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Customer user password updated successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to update customer user password" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "➕ Creating new customer user..." -ForegroundColor Yellow
    
    # Generate new UUID for the customer user
    $customerUserId = [guid]::NewGuid().ToString()
    
    $createUserQuery = @"
INSERT INTO users (
    id,
    email,
    password_hash,
    first_name,
    last_name,
    phone,
    status,
    role_id,
    organizational_unit_id,
    created_at,
    updated_at
) VALUES (
    '$customerUserId',
    '$customerEmail',
    '$passwordHash',
    'Demo',
    'Customer',
    '$customerPhone',
    'active',
    '$customerRoleId',
    '$ouId',
    now(),
    now()
);
"@
    
    psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $createUserQuery | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Customer user created successfully: $customerUserId" -ForegroundColor Green
        $existingUserId = $customerUserId
    } else {
        Write-Host "❌ Failed to create customer user" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Check if customer record already exists
Write-Host "🔍 Checking if customer record already exists..." -ForegroundColor Yellow
$checkCustomerQuery = "SELECT id FROM customers WHERE email = '$customerEmail';"
$existingCustomerId = (psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -A -c $checkCustomerQuery).Trim()

if ($existingCustomerId) {
    Write-Host "⚠️  Customer record already exists with ID: $existingCustomerId" -ForegroundColor Yellow
} else {
    Write-Host "➕ Creating customer record..." -ForegroundColor Yellow
    
    # Generate customer code
    $customerCode = "CUST-$(Get-Date -Format 'yyyyMMdd')-001"
    
    $createCustomerQuery = @"
INSERT INTO customers (
    organizational_unit_id,
    customer_code,
    first_name,
    last_name,
    date_of_birth,
    gender,
    civil_status,
    nationality,
    email,
    mobile_phone,
    address_line1,
    barangay,
    city_municipality,
    province,
    region,
    postal_code,
    emergency_contact_name,
    emergency_contact_relationship,
    emergency_contact_phone,
    kyc_status,
    status,
    created_by,
    created_at,
    updated_at
) VALUES (
    '$ouId',
    '$customerCode',
    'Demo',
    'Customer',
    '1990-01-01',
    'male',
    'single',
    'Filipino',
    '$customerEmail',
    '$customerPhone',
    '123 Main Street',
    'Poblacion',
    'Manila',
    'Metro Manila',
    'NCR',
    '1000',
    'Jane Doe',
    'Spouse',
    '09181234567',
    'verified',
    'active',
    '$adminId',
    now(),
    now()
) RETURNING id;
"@
    
    $customerId = (psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -A -c $createCustomerQuery).Trim()
    
    if ($LASTEXITCODE -eq 0 -and $customerId) {
        Write-Host "✅ Customer record created successfully: $customerId" -ForegroundColor Green
        Write-Host "   Customer Code: $customerCode" -ForegroundColor Gray
    } else {
        Write-Host "❌ Failed to create customer record" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Default Customer Created Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Customer App Login Credentials:" -ForegroundColor Yellow
Write-Host "   Email:    $customerEmail" -ForegroundColor White
Write-Host "   Password: $customerPassword" -ForegroundColor White
Write-Host ""
Write-Host "🌐 You can now login to the customer-app" -ForegroundColor Cyan
Write-Host ""
