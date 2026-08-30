# ProxyGPT Online - Windows Deployment Script
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\deploy-windows.ps1

Write-Host "`n🚀 ProxyGPT Online - Windows Deployment Script" -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

# Configuration
$AppDir = $PSScriptRoot | Split-Path -Parent
$NodeEnv = "production"
$AppName = "proxygpt"

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "App Directory: $AppDir"
Write-Host "Environment: $NodeEnv`n"

# Check prerequisites
Write-Host "Checking prerequisites...`n" -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = & node --version
    Write-Host "✓ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = & npm --version
    Write-Host "✓ npm $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found" -ForegroundColor Red
    exit 1
}

# Check PM2
try {
    $pm2Version = & pm2 --version
    Write-Host "✓ PM2 $pm2Version" -ForegroundColor Green
} catch {
    Write-Host "⚠ PM2 not found, installing globally..." -ForegroundColor Yellow
    & npm install -g pm2
    Write-Host "✓ PM2 installed" -ForegroundColor Green
}

# Stop existing application
Write-Host "`nStopping existing application...`n" -ForegroundColor Yellow
try {
    $null = & pm2 info $AppName 2>$null
    & pm2 stop $AppName
    Write-Host "✓ Application stopped" -ForegroundColor Green
} catch {
    Write-Host "ℹ No running application found" -ForegroundColor Gray
}

# Navigate to app directory
Set-Location $AppDir
Write-Host "Working directory: $(Get-Location)`n" -ForegroundColor Yellow

# Install dependencies
Write-Host "Installing dependencies...`n" -ForegroundColor Yellow
& npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Build application
Write-Host "`nBuilding application...`n" -ForegroundColor Yellow
& npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# Create data directory
Write-Host "`nSetting up data directory...`n" -ForegroundColor Yellow
$dataDir = Join-Path $AppDir "data"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir | Out-Null
}
Write-Host "✓ Data directory ready" -ForegroundColor Green

# Start application with PM2
Write-Host "`nStarting application with PM2...`n" -ForegroundColor Yellow
& pm2 start ecosystem.config.cjs
Write-Host "✓ Application started" -ForegroundColor Green

# Setup Windows startup
Write-Host "`nConfiguring Windows startup...`n" -ForegroundColor Yellow
& pm2 install pm2-windows-startup
& pm2 save
Write-Host "✓ Windows startup configured" -ForegroundColor Green

# Display status
Write-Host "`nApplication Status:`n" -ForegroundColor Yellow
& pm2 status

Write-Host "`n✅ Deployment complete!`n" -ForegroundColor Green

Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  pm2 logs $AppName          - View application logs"
Write-Host "  pm2 monit                  - Monitor resources"
Write-Host "  pm2 restart $AppName       - Restart application"
Write-Host "  pm2 stop $AppName          - Stop application"

Write-Host "`nAccess your application at:" -ForegroundColor Yellow
Write-Host "  Local: http://localhost:3000"
Write-Host "  Production: https://yourdomain.com (after DNS/SSL setup)`n"

Write-Host "Press Enter to exit..." -ForegroundColor Gray
Read-Host
