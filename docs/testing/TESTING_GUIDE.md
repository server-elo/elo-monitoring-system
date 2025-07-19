# 🧪 Testing Guide - Advanced Code Editor Features

## Overview

This guide covers the comprehensive testing strategy for the advanced code editor features in the Solidity Learning Platform. Our testing approach ensures reliability, performance, and accessibility across all components.

## 🏗️ Testing Architecture

### Test Structure
```
__tests__/
├── editor/
│   ├── AdvancedCollaborativeMonacoEditor.test.tsx
│   ├── AdvancedIDEInterface.test.tsx
│   └── MonacoSoliditySetup.test.ts
├── debugging/
│   ├── SolidityDebuggerInterface.test.tsx
│   └── SolidityDebugger.test.ts
├── vcs/
│   ├── VersionControlInterface.test.tsx
│   └── SolidityVersionControl.test.ts
├── analysis/
│   └── SolidityCodeAnalyzer.test.ts
└── hooks/
    ├── useAdvancedCollaborativeEditor.test.ts
    ├── useSolidityDebugger.test.ts
    ├── useSolidityAnalyzer.test.ts
    └── useSolidityVersionControl.test.ts
```

### Testing Stack
- **Framework**: Jest with React Testing Library
- **Mocking**: Jest mocks for external dependencies
- **Coverage**: 80%+ coverage requirement
- **E2E**: Playwright for integration testing
- **Performance**: Custom performance testing utilities

## 🎯 Test Categories

### 1. Unit Tests
Test individual components and functions in isolation.

```bash
# Run all unit tests
npm run test

# Run specific test file
npm run test AdvancedCollaborativeMonacoEditor.test.tsx

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### 2. Integration Tests
Test component interactions and data flow.

```bash
# Run integration tests
npm run test:integration

# Run specific integration suite
npm run test:integration -- --testNamePattern="Editor Integration"
```

### 3. End-to-End Tests
Test complete user workflows.

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode
npm run test:e2e:headed

# Run specific E2E test
npm run test:e2e -- --grep "collaborative editing"
```

## 🧪 Testing Patterns

### Component Testing Pattern

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdvancedCollaborativeMonacoEditor } from '@/components/editor/AdvancedCollaborativeMonacoEditor';

describe('AdvancedCollaborativeMonacoEditor', () => {
  const defaultProps = {
    documentId: 'test-document',
    initialContent: '// Test content',
    language: 'solidity' as const,
  };

  test('renders editor with initial content', () => {
    render(<AdvancedCollaborativeMonacoEditor {...defaultProps} />);
    
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    expect(screen.getByDisplayValue('// Test content')).toBeInTheDocument();
  });

  test('handles content changes', async () => {
    const onContentChange = jest.fn();
    render(
      <AdvancedCollaborativeMonacoEditor 
        {...defaultProps} 
        onContentChange={onContentChange}
      />
    );
    
    const editor = screen.getByRole('textbox');
    fireEvent.change(editor, { target: { value: 'new content' } });
    
    await waitFor(() => {
      expect(onContentChange).toHaveBeenCalledWith('new content');
    });
  });
});
```

### Hook Testing Pattern

```tsx
import { renderHook, act } from '@testing-library/react';
import { useSolidityDebugger } from '@/lib/hooks/useSolidityDebugger';

describe('useSolidityDebugger', () => {
  test('initializes debugger correctly', async () => {
    const { result } = renderHook(() => useSolidityDebugger());
    
    await act(async () => {
      await result.current.startSession(
        '0x123...',
        '0xabc...',
        '0x608...',
        '0:100:0:-:0',
        []
      );
    });
    
    expect(result.current.hasActiveSession).toBe(true);
  });
});
```

### Service Testing Pattern

```tsx
import { SolidityVersionControl } from '@/lib/vcs/SolidityVersionControl';

describe('SolidityVersionControl', () => {
  let vcs: SolidityVersionControl;

  beforeEach(() => {
    vcs = new SolidityVersionControl('test-repo', 'Test Repository');
  });

  test('creates commit with staged changes', async () => {
    await vcs.initialize({ 'test.sol': 'contract Test {}' });
    
    vcs.add('new-file.sol');
    const commitId = await vcs.commit('Add new file', {
      name: 'Test User',
      email: 'test@example.com',
      id: 'test-user'
    });
    
    expect(commitId).toBeDefined();
    expect(vcs.getCommitHistory()).toHaveLength(2);
  });
});
```

## 🎭 Mocking Strategies

### Monaco Editor Mocking

```tsx
jest.mock('@monaco-editor/react', () => ({
  Editor: jest.fn(({ onMount, value, onChange }) => {
    React.useEffect(() => {
      if (onMount) {
        const mockEditor = {
          getValue: () => value,
          setValue: jest.fn(),
          onDidChangeModelContent: jest.fn(),
          updateOptions: jest.fn(),
          getModel: () => ({ id: 'test-model' }),
        };
        onMount(mockEditor, mockMonaco);
      }
    }, []);

    return (
      <textarea
        data-testid="monaco-editor"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    );
  })
}));
```

### Socket.io Mocking

```tsx
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  }))
}));
```

### Notification System Mocking

```tsx
jest.mock('@/components/ui/NotificationSystem', () => ({
  useNotifications: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn()
  })
}));
```

## 📊 Coverage Requirements

### Coverage Thresholds
- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Critical Components (90%+ Coverage Required)
- `AdvancedCollaborativeMonacoEditor`
- `SolidityDebuggerInterface`
- `SolidityVersionControl`
- `SolidityCodeAnalyzer`
- All custom hooks

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage report in browser
npm run test:coverage:open

# Generate coverage badge
npm run test:coverage:badge
```

## 🚀 Performance Testing

### Performance Test Example

```tsx
import { performance } from 'perf_hooks';

describe('Performance Tests', () => {
  test('editor initialization should be fast', async () => {
    const start = performance.now();
    
    render(<AdvancedCollaborativeMonacoEditor {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
    
    const end = performance.now();
    const duration = end - start;
    
    expect(duration).toBeLessThan(1000); // Should initialize within 1 second
  });

  test('large file handling performance', async () => {
    const largeContent = 'contract Test {}\n'.repeat(1000);
    const start = performance.now();
    
    render(
      <AdvancedCollaborativeMonacoEditor 
        {...defaultProps} 
        initialContent={largeContent}
      />
    );
    
    const end = performance.now();
    expect(end - start).toBeLessThan(2000);
  });
});
```

## ♿ Accessibility Testing

### Accessibility Test Example

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  test('editor interface should be accessible', async () => {
    const { container } = render(
      <AdvancedCollaborativeMonacoEditor {...defaultProps} />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('keyboard navigation works correctly', () => {
    render(<AdvancedCollaborativeMonacoEditor {...defaultProps} />);
    
    const saveButton = screen.getByTitle(/save/i);
    expect(saveButton).toHaveAttribute('tabIndex', '0');
    
    fireEvent.keyDown(saveButton, { key: 'Enter' });
    // Assert expected behavior
  });
});
```

## 🔄 Continuous Integration

### GitHub Actions Workflow

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## 🐛 Debugging Tests

### Common Issues and Solutions

#### 1. Monaco Editor Not Loading
```tsx
// Solution: Mock Monaco Editor properly
jest.mock('@monaco-editor/react', () => ({
  Editor: ({ children, ...props }) => <div data-testid="monaco-editor" {...props}>{children}</div>
}));
```

#### 2. Async Operations Timing Out
```tsx
// Solution: Use proper async/await and waitFor
await waitFor(() => {
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
}, { timeout: 5000 });
```

#### 3. Socket.io Connection Issues
```tsx
// Solution: Mock socket connections
const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn()
};
```

### Test Debugging Commands

```bash
# Run tests with verbose output
npm run test -- --verbose

# Run tests with debug information
npm run test -- --debug

# Run specific test with debugging
npm run test -- --testNamePattern="specific test" --verbose
```

## 📝 Test Documentation

### Writing Test Documentation

```tsx
/**
 * Test Suite: AdvancedCollaborativeMonacoEditor
 * 
 * This test suite covers the collaborative Monaco editor component,
 * including real-time editing, cursor synchronization, and conflict resolution.
 * 
 * Test Categories:
 * - Basic Rendering: Component initialization and display
 * - Content Management: Text editing and change handling
 * - Collaboration: Real-time features and synchronization
 * - Performance: Load times and responsiveness
 * - Accessibility: WCAG compliance and keyboard navigation
 */
describe('AdvancedCollaborativeMonacoEditor', () => {
  // Test implementation
});
```

### Test Naming Conventions

```tsx
// ✅ Good: Descriptive and specific
test('should save content automatically after 2 seconds of inactivity', () => {});
test('should show error message when collaboration connection fails', () => {});
test('should highlight syntax errors in real-time', () => {});

// ❌ Bad: Vague and unclear
test('saves content', () => {});
test('shows error', () => {});
test('highlights errors', () => {});
```

## 🎯 Best Practices

### 1. Test Organization
- Group related tests in describe blocks
- Use clear, descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Mock Management
- Mock external dependencies consistently
- Use factory functions for complex mocks
- Clean up mocks between tests

### 3. Async Testing
- Always use async/await for async operations
- Use waitFor for DOM updates
- Set appropriate timeouts

### 4. Accessibility
- Test keyboard navigation
- Verify ARIA labels and roles
- Check color contrast and focus indicators

### 5. Performance
- Test with realistic data sizes
- Monitor render times
- Test memory usage patterns

## 🚀 Running Tests

### Development Workflow

```bash
# Start development with tests
npm run dev:test

# Run tests on file changes
npm run test:watch

# Run specific test suite
npm run test:editor
npm run test:debugging
npm run test:vcs

# Run tests with different configurations
npm run test:ci          # CI configuration
npm run test:local       # Local development
npm run test:production  # Production build testing
```

### Test Reports

```bash
# Generate HTML test report
npm run test:report

# Generate performance report
npm run test:performance

# Generate accessibility report
npm run test:a11y
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## 🎉 Conclusion

This comprehensive testing strategy ensures that our advanced code editor features are reliable, performant, and accessible. Regular testing helps maintain code quality and provides confidence when deploying new features.

Remember: **Good tests are documentation, safety nets, and design tools all in one!** 🛡️
