# Repository Maintenance Scripts

This directory contains scripts to help maintain the repository and prevent large file issues.

## Scripts

### `repo-maintenance.sh`

A comprehensive maintenance script that helps keep the repository clean and prevents large file issues.

**Usage:**
```bash
# Run all maintenance checks
./scripts/repo-maintenance.sh

# Run specific checks
./scripts/repo-maintenance.sh size    # Check repository size and large files
./scripts/repo-maintenance.sh clean   # Clean build artifacts
./scripts/repo-maintenance.sh status  # Check git status
./scripts/repo-maintenance.sh hooks   # Check pre-commit hook status
```

**Features:**
- 📊 Repository size analysis
- 🔍 Large file detection
- 🧹 Build artifact cleanup (.next, out, dist, node_modules/.cache)
- 📋 Git status checking
- 🪝 Pre-commit hook verification

## Pre-commit Hook

The repository includes a pre-commit hook that prevents large files from being committed:

- **Location:** `.git/hooks/pre-commit`
- **Purpose:** Prevents files larger than 50MB from being committed
- **Features:**
  - Checks file sizes before commit
  - Prevents .next directory commits
  - Prevents node_modules commits
  - Provides helpful error messages and tips

## Build Scripts

The following npm scripts are available for build management:

```bash
npm run clean          # Remove .next, out, dist, and node_modules/.cache
npm run clean:all      # Remove all build artifacts including node_modules
npm run clean:build    # Remove only build outputs (.next, out, dist)
npm run build          # Build the project (automatically cleans first)
```

## Best Practices

1. **Before committing:**
   - Run `./scripts/repo-maintenance.sh` to check for issues
   - Use `npm run clean` if you've been testing builds locally

2. **Regular maintenance:**
   - Run the maintenance script weekly
   - Keep an eye on repository size
   - Clean build artifacts regularly

3. **If you encounter large file errors:**
   - Use `git reset HEAD <file>` to unstage large files
   - Add large files to `.gitignore`
   - Consider using Git LFS for legitimate large assets

## Emergency Recovery

If large files accidentally get committed:

1. **For recent commits (not yet pushed):**
   ```bash
   git reset --soft HEAD~1  # Undo last commit, keep changes staged
   git reset HEAD <large-file>  # Unstage the large file
   git commit -m "Your commit message"  # Recommit without large file
   ```

2. **For pushed commits:**
   - Contact the repository maintainer
   - May require force-pushing cleaned history
   - Use the maintenance script to verify cleanup

## Monitoring

The GitHub Actions workflow includes automatic checks for:
- Large files in build output
- Build verification
- Deployment safety

These checks run on every push and pull request to prevent large file issues in production.
