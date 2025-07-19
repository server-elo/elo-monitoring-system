#!/bin/bash

# Node.js Environment Setup Script for Solidity Learning Platform
# Resolves Node.js version compatibility and package lock file synchronization issues

set -e

echo "🚀 Setting up Node.js environment for Solidity Learning Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed or not in PATH${NC}"
    echo -e "${RED}   Please install Node.js 20.0.0 or higher from: https://nodejs.org/${NC}"
    exit 1
fi

# Check Node.js version
CURRENT_NODE_VERSION=$(node --version)
echo -e "${YELLOW}Current Node.js version: $CURRENT_NODE_VERSION${NC}"

# Extract major version number
MAJOR_VERSION=$(echo $CURRENT_NODE_VERSION | sed 's/v\([0-9]*\).*/\1/')

if [ "$MAJOR_VERSION" -lt 20 ]; then
    echo -e "${RED}⚠️  Node.js version $CURRENT_NODE_VERSION is incompatible with required packages${NC}"
    echo -e "${RED}   Required: Node.js 20.0.0 or higher${NC}"
    echo -e "${RED}   Please upgrade Node.js before continuing.${NC}"
    echo ""
    echo -e "${CYAN}📋 Node.js Upgrade Options:${NC}"
    echo -e "${WHITE}   1. Download from: https://nodejs.org/en/download/${NC}"
    echo -e "${WHITE}   2. Use nvm: nvm install 20.18.0 && nvm use 20.18.0${NC}"
    echo -e "${WHITE}   3. Use package manager (Ubuntu): sudo apt update && sudo apt install nodejs npm${NC}"
    echo -e "${WHITE}   4. Use package manager (macOS): brew install node${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Node.js version is compatible${NC}"
fi

# Check npm version
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not available${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${YELLOW}Current npm version: $NPM_VERSION${NC}"

# Extract major version
NPM_MAJOR=$(echo $NPM_VERSION | cut -d. -f1)
if [ "$NPM_MAJOR" -lt 10 ]; then
    echo -e "${YELLOW}⚠️  npm version $NPM_VERSION may be incompatible${NC}"
    echo -e "${YELLOW}   Recommended: npm 10.0.0 or higher${NC}"
    echo -e "${CYAN}   Upgrading npm...${NC}"
    npm install -g npm@latest
else
    echo -e "${GREEN}✅ npm version is compatible${NC}"
fi

echo ""
echo -e "${CYAN}🧹 Cleaning existing dependencies...${NC}"

# Remove package-lock.json if it exists
if [ -f "package-lock.json" ]; then
    rm -f package-lock.json
    echo -e "${YELLOW}   Removed package-lock.json${NC}"
fi

# Remove node_modules if it exists
if [ -d "node_modules" ]; then
    echo -e "${YELLOW}   Removing node_modules directory...${NC}"
    rm -rf node_modules
    echo -e "${YELLOW}   Removed node_modules${NC}"
fi

# Clear npm cache
echo -e "${YELLOW}   Clearing npm cache...${NC}"
npm cache clean --force

echo ""
echo -e "${CYAN}📦 Installing dependencies...${NC}"

# Install dependencies with verbose output
npm install --verbose

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    echo -e "${RED}   Please check the error messages above${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}🎭 Installing Playwright browsers...${NC}"

# Install Playwright browsers
npm run playwright:install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Playwright browsers installed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Playwright browser installation failed${NC}"
    echo -e "${YELLOW}   You can install them manually later with: npm run playwright:install${NC}"
fi

echo ""
echo -e "${CYAN}🔍 Verifying installation...${NC}"

# Verify key packages are installed
PACKAGES_TO_CHECK=("@playwright/test" "playwright" "next" "react" "typescript")
ALL_PACKAGES_INSTALLED=true

for package in "${PACKAGES_TO_CHECK[@]}"; do
    if [ -d "node_modules/$package" ]; then
        echo -e "${GREEN}   ✅ $package${NC}"
    else
        echo -e "${RED}   ❌ $package${NC}"
        ALL_PACKAGES_INSTALLED=false
    fi
done

if [ "$ALL_PACKAGES_INSTALLED" = true ]; then
    echo ""
    echo -e "${GREEN}🎉 Environment setup completed successfully!${NC}"
    echo ""
    echo -e "${CYAN}📋 Next steps:${NC}"
    echo -e "${WHITE}   1. Run tests: npm run test:e2e${NC}"
    echo -e "${WHITE}   2. Start development: npm run dev${NC}"
    echo -e "${WHITE}   3. Build project: npm run build${NC}"
    echo ""
    echo -e "${CYAN}🧪 Available test commands:${NC}"
    echo -e "${WHITE}   npm run test:e2e          - Run all E2E tests${NC}"
    echo -e "${WHITE}   npm run test:e2e:ui       - Run tests with UI${NC}"
    echo -e "${WHITE}   npm run test:performance  - Run performance tests${NC}"
    echo -e "${WHITE}   npm run test:security     - Run security tests${NC}"
    echo -e "${WHITE}   npm run test:collaboration - Run collaboration tests${NC}"
    echo -e "${WHITE}   npm run test:ai           - Run AI tutoring tests${NC}"
    echo -e "${WHITE}   npm run test:auth         - Run authentication tests${NC}"
    echo -e "${WHITE}   npm run test:mobile       - Run mobile tests${NC}"
    echo -e "${WHITE}   npm run test:cross-browser - Run cross-browser tests${NC}"
else
    echo ""
    echo -e "${RED}❌ Some packages are missing. Please check the installation.${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}📊 Environment Summary:${NC}"
echo -e "${WHITE}   Node.js: $(node --version)${NC}"
echo -e "${WHITE}   npm: $(npm --version)${NC}"
echo -e "${WHITE}   Project: Solidity Learning Platform${NC}"
echo -e "${WHITE}   Testing: Playwright E2E Testing Suite${NC}"
echo -e "${GREEN}   Status: Ready for development and testing${NC}"
