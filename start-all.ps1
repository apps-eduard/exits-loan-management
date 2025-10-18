# Start All Services Script
# This script starts all applications simultaneously

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "[1/4] Starting Backend API..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\backend'; npm run dev"
Start-Sleep -Seconds 2

Write-Host "[2/4] Starting Web Admin App..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\web'; ng serve"
Start-Sleep -Seconds 2

Write-Host "[3/4] Starting Customer Mobile App..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\customer-app'; `$env:NG_DISABLE_VERSION_CHECK='1'; ionic serve"
Start-Sleep -Seconds 2

Write-Host "[4/4] Starting Collector Mobile App..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\collector-app'; `$env:NG_DISABLE_VERSION_CHECK='1'; ionic serve --port=8101"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access your applications at:" -ForegroundColor Cyan
Write-Host "  Backend API:        http://localhost:3000" -ForegroundColor White
Write-Host "  Web Admin:          http://localhost:4200" -ForegroundColor White
Write-Host "  Customer App:       http://localhost:8100" -ForegroundColor White
Write-Host "  Collector App:      http://localhost:8101" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit (services will continue running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
