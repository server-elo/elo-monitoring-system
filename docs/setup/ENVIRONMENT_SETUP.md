# Environment Setup Guide

This guide helps you resolve Node.js version compatibility and package lock file synchronization issues for the Solidity Learning Platform.

## 🚨 Known Issues

### Node.js Version Compatibility
- **Issue**: Current Node.js version (v18.20.8) is incompatible with several packages
- **Affected Packages**: `@google/genai`, `@playwright/test`, and related dependencies
- **Solution**: Upgrade to Node.js 20.0.0 or higher

### Package Lock File Synchronization
- **Issue**: package.json and package-lock.json files are out of sync
- **Symptoms**: npm ci fails, missing entries for Playwright dependencies
- **Solution**: Regenerate package-lock.json with correct dependency versions

## 🔧 Quick Fix (Automated)

### Windows (PowerShell)
```powershell
npm run setup:env
```

### macOS/Linux (Bash)
```bash
npm run setup:env:unix
```

## 📋 Manual Setup Steps

### 1. Node.js Version Upgrade

#### Check Current Version
```bash
node --version
npm --version
```

#### Upgrade Options

**Option A: Official Installer**
1. Download Node.js 20+ from [nodejs.org](https://nodejs.org/en/download/)
2. Run the installer and follow instructions
3. Restart your terminal

**Option B: Node Version Manager (Recommended)**

**Windows (nvm-windows):**
```powershell
# Install nvm-windows from: https://github.com/coreybutler/nvm-windows
nvm install 20.18.0
nvm use 20.18.0
```

**macOS/Linux (nvm):**
```bash
# Install nvm from: https://github.com/nvm-sh/nvm
nvm install 20.18.0
nvm use 20.18.0
nvm alias default 20.18.0
```

**Option C: Package Managers**

**Windows (Chocolatey):**
```powershell
choco upgrade nodejs
```

**Windows (Winget):**
```powershell
winget upgrade OpenJS.NodeJS
```

**macOS (Homebrew):**
```bash
brew install node@20
brew link node@20
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Dependency Resolution

#### Clean Installation
```bash
# Remove existing files
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Install dependencies
npm install

# Install Playwright browsers
npm run playwright:install
```

#### Verify Installation
```bash
# Check key packages
ls node_modules/@playwright/test
ls node_modules/playwright
ls node_modules/next

# Test Playwright
npx playwright --version
```

## 🧪 Testing Environment

### Verify E2E Testing Setup
```bash
# Run a simple test to verify setup
npm run test:e2e -- --grep "should load homepage"

# Run all E2E tests
npm run test:e2e

# Run with UI for debugging
npm run test:e2e:ui
```

### Available Test Commands
```bash
# Core testing
npm run test                    # Run all tests (unit + E2E)
npm run test:unit              # Run Jest unit tests
npm run test:e2e               # Run Playwright E2E tests

# E2E test variations
npm run test:e2e:ui            # Run with Playwright UI
npm run test:e2e:headed        # Run in headed mode
npm run test:e2e:debug         # Run in debug mode

# Specific test suites
npm run test:performance       # Performance testing
npm run test:security          # Security testing
npm run test:collaboration     # Real-time collaboration
npm run test:ai                # AI tutoring features
npm run test:auth              # Authentication flows

# Cross-platform testing
npm run test:mobile            # Mobile responsiveness
npm run test:cross-browser     # Chrome, Firefox, Safari, Edge

# CI/CD
npm run test:ci                # GitHub Actions reporter
npm run test:report            # Show test report
```

## 🔍 Troubleshooting

### Common Issues

#### EBADENGINE Warnings
```
npm WARN EBADENGINE Unsupported engine
```
**Solution**: Upgrade Node.js to version 20.0.0 or higher

#### Missing Playwright Dependencies
```
Error: browserType.launch: Executable doesn't exist
```
**Solution**: Install Playwright browsers
```bash
npm run playwright:install
```

#### Package Lock Conflicts
```
npm ERR! peer dep missing
```
**Solution**: Clean install
```bash
rm -rf node_modules package-lock.json
npm install
```

#### Permission Errors (Windows)
```
Error: EPERM: operation not permitted
```
**Solution**: Run as Administrator or use PowerShell with elevated privileges

#### Permission Errors (macOS/Linux)
```
Error: EACCES: permission denied
```
**Solution**: Fix npm permissions
```bash
sudo chown -R $(whoami) ~/.npm
```

### Environment Verification

#### Check Node.js Installation
```bash
node --version          # Should be 20.0.0 or higher
npm --version           # Should be 10.0.0 or higher
npx --version           # Should be available
```

#### Check Project Dependencies
```bash
npm list @playwright/test
npm list playwright
npm list next
npm list react
npm list typescript
```

#### Check Playwright Setup
```bash
npx playwright --version
npx playwright show-report
```

## 📊 System Requirements

### Minimum Requirements
- **Node.js**: 20.0.0 or higher
- **npm**: 10.0.0 or higher
- **RAM**: 4GB (8GB recommended for testing)
- **Storage**: 2GB free space for dependencies and browsers

### Supported Platforms
- **Windows**: 10/11 (x64)
- **macOS**: 10.15+ (Intel/Apple Silicon)
- **Linux**: Ubuntu 18.04+, Debian 10+, CentOS 8+

### Browser Support (for E2E testing)
- **Chromium**: Latest stable
- **Firefox**: Latest stable
- **WebKit**: Latest stable (Safari engine)
- **Chrome**: Latest stable
- **Edge**: Latest stable

## 🚀 Next Steps

After successful environment setup:

1. **Start Development**:
   ```bash
   npm run dev
   ```

2. **Run Tests**:
   ```bash
   npm run test:e2e
   ```

3. **Build Project**:
   ```bash
   npm run build
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

## 📞 Support

If you encounter issues not covered in this guide:

1. Check the [GitHub Issues](https://github.com/ezekaj/learning_sol/issues)
2. Review the [Playwright Documentation](https://playwright.dev/)
3. Check [Node.js Compatibility](https://nodejs.org/en/about/releases/)
4. Create a new issue with:
   - Node.js version (`node --version`)
   - npm version (`npm --version`)
   - Operating system
   - Error messages
   - Steps to reproduce
