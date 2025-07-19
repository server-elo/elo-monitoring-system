# 12-Factor Agent Configuration for Solidity Learning Platform

## Project Context

This is a Next.js 15 Solidity Learning Platform with:
- **Stack**: Next.js 15, React 19, TypeScript, Prisma, PostgreSQL
- **Build**: `npm run build`
- **Test**: `npm test`
- **Dev**: `npm run dev -- -p 5000`

## Active 12-Factor Principles

### Factor 1: Natural Language to Tool Calls
- Use structured tool calls instead of ambiguous commands
- Example: Use `Edit` tool with exact strings instead of vague descriptions

### Factor 3: Own Your Context Window (Context Engineering)
- Track task progress explicitly with TodoWrite
- Maintain clear state of what's completed/pending
- Compact information into manageable chunks

### Factor 9: Compact Errors into Context Window
- Capture build errors in single outputs
- Parse and categorize errors systematically
- Create focused fix plans for each error type

### Factor 10: Small, Focused Agents
- Break tasks into atomic operations
- Each task should complete in <5 minutes
- Clear success/failure criteria

### Factor 12: Make Agent a Stateless Reducer
- Each operation independent
- Clear inputs → predictable outputs
- No hidden state between operations

## Task Patterns

### Pattern: Build Fix Workflow
```
1. Identify error → Read file → Fix specific issue → Verify
2. One error at a time
3. Test after each fix
4. Track progress in todo list
```

### Pattern: Dependency Management
```
1. Check package.json first
2. Install only what's missing
3. Verify no conflicts
4. Update .gitignore if needed
```

### Pattern: Deployment Preparation
```
1. Run build → Capture errors
2. Fix systematically
3. Update documentation
4. Prepare git commands (don't execute)
```

## Anti-Patterns to Avoid

1. **Loop Pattern**: Fixing same error repeatedly
   - Solution: Track what's been tried, move to next approach

2. **Scope Creep**: Expanding beyond requested task
   - Solution: Stay focused on specific request

3. **Assumption Pattern**: Guessing without checking
   - Solution: Always verify current state first

## Current State Tracking

- Build Status: ✅ Successfully builds
- Deployment Ready: ✅ Yes
- Last Action: Fixed logger imports, installed ioredis
- Next Actions: Ready for git commit and deployment

## Quick Commands

```bash
# Development
npm run dev -- -p 5000

# Build
npm run build

# Database
npx prisma generate
npx prisma db push

# Git (for user to run)
git add -A
git commit -m "message"
git push origin main
```

## Integration with CLAUDE.md

This configuration extends the main CLAUDE.md file with 12-factor specific patterns for more reliable, autonomous operation.