# PRP (Product Requirement Prompt) System - Programmatic Usage

This library provides programmatic access to the PRP methodology, allowing Claude to automatically create, execute, and validate PRPs when implementing features.

## How It Works

When you ask Claude to implement a complex feature, Claude can now:

1. **Automatically create a PRP** with comprehensive research
2. **Execute the implementation** following the PRP blueprint
3. **Run validation gates** to ensure quality
4. **Move completed PRPs** to the completed folder

## API Usage

### Basic Example

```typescript
import { prp, implementFeature } from '@/lib/prp';

// Quick implementation (create + execute)
const result = await implementFeature('add push notifications', {
  filesToAnalyze: ['public/sw.js', 'components/notifications/'],
  urlsToResearch: ['https://web.dev/push-notifications/']
});

// Or step by step:
// 1. Create PRP
const prpFile = await prp.create({
  feature: 'implement OAuth authentication',
  deepResearch: true
});

// 2. Execute PRP
const executionResult = await prp.execute(prpFile);

// 3. Check results
if (executionResult.status === 'success') {
  console.log('Feature implemented successfully!');
}
```

### Command Line Usage

```bash
# Create a new PRP
npm run prp:create "implement feature description"

# Execute a PRP
npm run prp:execute feature-name.md

# Run validations
npm run prp:validate

# List all PRPs
npm run prp:list
```

## When Claude Uses PRPs

Claude will automatically use PRPs for:

- **Complex features** requiring 3+ files
- **Integrations** with external services
- **Major refactoring** tasks
- **Performance optimizations**
- **Security enhancements**

## PRP Structure

Each PRP contains:

1. **Goal** - What needs to be built
2. **Why** - Business value and impact
3. **Context** - Documentation, examples, gotchas
4. **Implementation Blueprint** - Step-by-step plan
5. **Validation Loop** - Automated quality checks

## Benefits

- **One-pass success** - Get it right the first time
- **Comprehensive context** - No missing information
- **Automated validation** - Quality assurance built-in
- **Consistent approach** - Same methodology every time

## Integration with Claude

Claude can now execute PRP commands internally without manual intervention:

```typescript
// Claude's internal decision logic
if (PRP_TRIGGERS.shouldUsePRP(taskDescription)) {
  // Automatically create and execute PRP
  const result = await implementFeature(taskDescription);
} else {
  // Simple implementation for basic tasks
  // ...
}
```

This ensures complex features are implemented with proper planning and validation.