#!/bin/bash

# Repository Maintenance Script
# This script helps maintain a clean repository and prevent large file issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MAX_FILE_SIZE=52428800  # 50MB in bytes
REPO_ROOT=$(git rev-parse --show-toplevel)

echo -e "${BLUE}🔧 Repository Maintenance Script${NC}"
echo "=================================="

# Function to check repository size
check_repo_size() {
    echo -e "\n${BLUE}📊 Repository Size Analysis${NC}"
    echo "----------------------------"
    
    # Get repository size
    repo_size=$(du -sh "$REPO_ROOT/.git" | cut -f1)
    echo -e "Git repository size: ${GREEN}$repo_size${NC}"
    
    # Check for large files
    echo -e "\n${YELLOW}🔍 Checking for large files...${NC}"
    large_files=$(find "$REPO_ROOT" -type f -size +10M -not -path "*/.git/*" -not -path "*/node_modules/*" -not -path "*/.next/*" 2>/dev/null || true)
    
    if [ -n "$large_files" ]; then
        echo -e "${RED}⚠️  Large files found:${NC}"
        echo "$large_files" | while read -r file; do
            size=$(du -h "$file" | cut -f1)
            echo -e "  ${RED}•${NC} $file (${size})"
        done
    else
        echo -e "${GREEN}✅ No large files found${NC}"
    fi
}

# Function to clean build artifacts
clean_build_artifacts() {
    echo -e "\n${BLUE}🧹 Cleaning Build Artifacts${NC}"
    echo "-----------------------------"
    
    # Clean Next.js artifacts
    if [ -d "$REPO_ROOT/.next" ]; then
        echo -e "${YELLOW}Removing .next directory...${NC}"
        rm -rf "$REPO_ROOT/.next"
        echo -e "${GREEN}✅ .next directory removed${NC}"
    fi
    
    # Clean output directory
    if [ -d "$REPO_ROOT/out" ]; then
        echo -e "${YELLOW}Removing out directory...${NC}"
        rm -rf "$REPO_ROOT/out"
        echo -e "${GREEN}✅ out directory removed${NC}"
    fi
    
    # Clean dist directory
    if [ -d "$REPO_ROOT/dist" ]; then
        echo -e "${YELLOW}Removing dist directory...${NC}"
        rm -rf "$REPO_ROOT/dist"
        echo -e "${GREEN}✅ dist directory removed${NC}"
    fi
    
    # Clean node_modules cache
    if [ -d "$REPO_ROOT/node_modules/.cache" ]; then
        echo -e "${YELLOW}Removing node_modules cache...${NC}"
        rm -rf "$REPO_ROOT/node_modules/.cache"
        echo -e "${GREEN}✅ node_modules cache removed${NC}"
    fi
}

# Function to check git status
check_git_status() {
    echo -e "\n${BLUE}📋 Git Status Check${NC}"
    echo "-------------------"
    
    cd "$REPO_ROOT"
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        echo -e "${YELLOW}⚠️  Uncommitted changes detected${NC}"
        git status --short
    else
        echo -e "${GREEN}✅ Working tree is clean${NC}"
    fi
    
    # Check branch status
    branch=$(git branch --show-current)
    ahead=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")
    behind=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo "0")
    
    echo -e "Current branch: ${GREEN}$branch${NC}"
    
    if [ "$ahead" -gt 0 ]; then
        echo -e "Commits ahead: ${YELLOW}$ahead${NC}"
    fi
    
    if [ "$behind" -gt 0 ]; then
        echo -e "Commits behind: ${RED}$behind${NC}"
    fi
    
    if [ "$ahead" -eq 0 ] && [ "$behind" -eq 0 ]; then
        echo -e "${GREEN}✅ Branch is up to date${NC}"
    fi
}

# Function to verify pre-commit hook
check_pre_commit_hook() {
    echo -e "\n${BLUE}🪝 Pre-commit Hook Status${NC}"
    echo "-------------------------"
    
    hook_file="$REPO_ROOT/.git/hooks/pre-commit"
    
    if [ -f "$hook_file" ] && [ -x "$hook_file" ]; then
        echo -e "${GREEN}✅ Pre-commit hook is installed and executable${NC}"
    elif [ -f "$hook_file" ]; then
        echo -e "${YELLOW}⚠️  Pre-commit hook exists but is not executable${NC}"
        echo -e "Run: ${BLUE}chmod +x .git/hooks/pre-commit${NC}"
    else
        echo -e "${RED}❌ Pre-commit hook is not installed${NC}"
        echo -e "Run the setup script to install it."
    fi
}

# Main execution
main() {
    case "${1:-all}" in
        "size")
            check_repo_size
            ;;
        "clean")
            clean_build_artifacts
            ;;
        "status")
            check_git_status
            ;;
        "hooks")
            check_pre_commit_hook
            ;;
        "all")
            check_repo_size
            clean_build_artifacts
            check_git_status
            check_pre_commit_hook
            ;;
        *)
            echo -e "${RED}Usage: $0 [size|clean|status|hooks|all]${NC}"
            echo "  size   - Check repository size and large files"
            echo "  clean  - Clean build artifacts"
            echo "  status - Check git status"
            echo "  hooks  - Check pre-commit hook status"
            echo "  all    - Run all checks (default)"
            exit 1
            ;;
    esac
    
    echo -e "\n${GREEN}🎉 Maintenance complete!${NC}"
}

# Run main function with all arguments
main "$@"
