# Node.js Environment Setup Script for Solidity Learning Platform
# Resolves Node.js version compatibility and package lock file synchronization issues

Write-Host "🚀 Setting up Node.js environment for Solidity Learning Platform..." -ForegroundColor Green

# Check current Node.js version
$currentNodeVersion = node --version 2>$null
if ($currentNodeVersion) {
    Write-Host "Current Node.js version: $currentNodeVersion" -ForegroundColor Yellow
    
    # Extract major version number
    $majorVersion = [int]($currentNodeVersion -replace 'v(\d+)\..*', '$1')
    
    if ($majorVersion -lt 20) {
        Write-Host "⚠️  Node.js version $currentNodeVersion is incompatible with required packages" -ForegroundColor Red
        Write-Host "   Required: Node.js 20.0.0 or higher" -ForegroundColor Red
        Write-Host "   Please upgrade Node.js before continuing." -ForegroundColor Red
        Write-Host ""
        Write-Host "📋 Node.js Upgrade Options:" -ForegroundColor Cyan
        Write-Host "   1. Download from: https://nodejs.org/en/download/" -ForegroundColor White
        Write-Host "   2. Use nvm-windows: nvm install 20.18.0 && nvm use 20.18.0" -ForegroundColor White
        Write-Host "   3. Use Chocolatey: choco upgrade nodejs" -ForegroundColor White
        Write-Host "   4. Use Winget: winget upgrade OpenJS.NodeJS" -ForegroundColor White
        exit 1
    } else {
        Write-Host "✅ Node.js version is compatible" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "   Please install Node.js 20.0.0 or higher from: https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm version
$npmVersion = npm --version 2>$null
if ($npmVersion) {
    Write-Host "Current npm version: $npmVersion" -ForegroundColor Yellow
    
    # Extract major version
    $npmMajor = [int]($npmVersion -split '\.')[0]
    if ($npmMajor -lt 10) {
        Write-Host "⚠️  npm version $npmVersion may be incompatible" -ForegroundColor Yellow
        Write-Host "   Recommended: npm 10.0.0 or higher" -ForegroundColor Yellow
        Write-Host "   Upgrading npm..." -ForegroundColor Cyan
        npm install -g npm@latest
    } else {
        Write-Host "✅ npm version is compatible" -ForegroundColor Green
    }
} else {
    Write-Host "❌ npm is not available" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🧹 Cleaning existing dependencies..." -ForegroundColor Cyan

# Remove package-lock.json if it exists
if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -Force
    Write-Host "   Removed package-lock.json" -ForegroundColor Yellow
}

# Remove node_modules if it exists
if (Test-Path "node_modules") {
    Write-Host "   Removing node_modules directory..." -ForegroundColor Yellow
    Remove-Item "node_modules" -Recurse -Force
    Write-Host "   Removed node_modules" -ForegroundColor Yellow
}

# Clear npm cache
Write-Host "   Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan

# Install dependencies with verbose output
npm install --verbose

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Write-Host "   Please check the error messages above" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎭 Installing Playwright browsers..." -ForegroundColor Cyan

# Install Playwright browsers
npm run playwright:install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Playwright browsers installed successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Playwright browser installation failed" -ForegroundColor Yellow
    Write-Host "   You can install them manually later with: npm run playwright:install" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔍 Verifying installation..." -ForegroundColor Cyan

# Verify key packages are installed
$packagesToCheck = @(
    "@playwright/test",
    "playwright",
    "next",
    "react",
    "typescript"
)

$allPackagesInstalled = $true
foreach ($package in $packagesToCheck) {
    $packagePath = "node_modules/$package"
    if (Test-Path $packagePath) {
        Write-Host "   ✅ $package" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $package" -ForegroundColor Red
        $allPackagesInstalled = $false
    }
}

if ($allPackagesInstalled) {
    Write-Host ""
    Write-Host "🎉 Environment setup completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Run tests: npm run test:e2e" -ForegroundColor White
    Write-Host "   2. Start development: npm run dev" -ForegroundColor White
    Write-Host "   3. Build project: npm run build" -ForegroundColor White
    Write-Host ""
    Write-Host "🧪 Available test commands:" -ForegroundColor Cyan
    Write-Host "   npm run test:e2e          - Run all E2E tests" -ForegroundColor White
    Write-Host "   npm run test:e2e:ui       - Run tests with UI" -ForegroundColor White
    Write-Host "   npm run test:performance  - Run performance tests" -ForegroundColor White
    Write-Host "   npm run test:security     - Run security tests" -ForegroundColor White
    Write-Host "   npm run test:collaboration - Run collaboration tests" -ForegroundColor White
    Write-Host "   npm run test:ai           - Run AI tutoring tests" -ForegroundColor White
    Write-Host "   npm run test:auth         - Run authentication tests" -ForegroundColor White
    Write-Host "   npm run test:mobile       - Run mobile tests" -ForegroundColor White
    Write-Host "   npm run test:cross-browser - Run cross-browser tests" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Some packages are missing. Please check the installation." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📊 Environment Summary:" -ForegroundColor Cyan
Write-Host "   Node.js: $(node --version)" -ForegroundColor White
Write-Host "   npm: $(npm --version)" -ForegroundColor White
Write-Host "   Project: Solidity Learning Platform" -ForegroundColor White
Write-Host "   Testing: Playwright E2E Testing Suite" -ForegroundColor White
Write-Host "   Status: Ready for development and testing" -ForegroundColor Green
