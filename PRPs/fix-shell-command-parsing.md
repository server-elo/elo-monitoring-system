# PRP: Fix Shell Command Parsing Errors

## Overview
This PRP addresses critical shell command parsing errors that prevent Claude Code from functioning properly, specifically the "Bad substitution: val1.trim" error and related shell syntax issues.

## Issues Fixed

### 1. Primary Issue: PGPASSWORD with Spaces
**Location**: `/scripts/migrate-enhanced-ai.ts:13`
**Problem**: `PGPASSWORD = "${password}"` (spaces around equals sign)
**Fix**: `PGPASSWORD="${password}"`

### 2. NPM Script Spaces Issue
**Location**: `/scripts/test-enhanced-tutor.ts`
**Problem**: Spaces after colons in npm commands
```bash
# INCORRECT
'npm run ai: test'
'npm run ai: test:integration'
'npm run test: enhanced-tutor'
'npm run test: coverage -- tests/enhanced-tutor*.test.ts'

# CORRECTED
'npm run ai:test'
'npm run ai:test:integration'
'npm run test:enhanced-tutor'
'npm run test:coverage -- tests/enhanced-tutor*.test.ts'
```

### 3. Import Statement Issues
**Problem**: `from 'childprocess'` (missing underscore)
**Fix**: `from 'child_process'`
**Files Fixed**:
- `/lib/prp/executor.ts`
- `/lib/prp/validator.ts`
- `/lib/workers/worker-manager.ts`
- `/scripts/comprehensive-typescript-fix.ts`
- `/scripts/fix-typescript-syntax.ts`
- `/scripts/setup-database.ts`
- `/scripts/migrate-enhanced-ai.ts`
- `/scripts/test-enhanced-tutor.ts`

## Best Practices for Shell Commands

### 1. Variable Substitution
```bash
# CORRECT
VARNAME="value"          # No spaces around =
VAR="${othervar}"        # Proper quoting
CMD="pg_dump -U $user"   # Variables in quotes

# INCORRECT
VARNAME = "value"        # Spaces cause "Bad substitution"
VAR=${var.trim()}        # JavaScript methods don't work
CMD=pg_dump -U $user     # Unquoted may break with spaces
```

### 2. Error Handling Pattern
```typescript
import { execSync } from 'child_process';

function safeExecSync(command: string, options = {}): string {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      ...options
    }).toString().trim();
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      console.error(`Command failed with status ${error.status}: ${command}`);
      console.error('stderr:', error.stderr?.toString());
    }
    throw error;
  }
}
```

### 3. Shell-Safe Variable Escaping
```typescript
function shellEscape(str: string): string {
  return `'${str.replace(/'/g, "'\"'\"'")}'`;
}

// Usage
const cmd = `echo ${shellEscape(userInput)}`;
```

## Validation Commands

Run these commands to verify all fixes are working:

```bash
# Check for remaining import issues
rg "from 'childprocess'" --type ts

# Check for shell variable spaces
rg 'PGPASSWORD\s+=\s+"' --type ts

# Check for npm command spaces
rg "npm run \w+:\s+" --type ts

# Test the fixed scripts
npm run db:migrate:ai
npm run ai:test:runner
```

## Prevention Guidelines

1. **Always validate shell syntax** before using execSync
2. **Use proper quoting** for all shell variables
3. **Escape user input** when constructing shell commands
4. **Test shell commands** independently before embedding in code
5. **Use child_process options** for better error handling

## Success Criteria

- [x] No "Bad substitution" errors
- [x] All imports use 'child_process' (not 'childprocess')
- [x] Shell variables properly formatted (no spaces around =)
- [x] NPM commands properly formatted (no spaces after colons)
- [ ] Error handling added to all execSync calls
- [ ] Shell escaping implemented for user inputs

## Next Steps

1. Add comprehensive error handling to all shell command executions
2. Implement shell escaping utility for user inputs
3. Create unit tests for shell command construction
4. Add ESLint rules to catch common shell syntax errors