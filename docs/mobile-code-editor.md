# Mobile-Optimized Code Editor

A comprehensive mobile-first code editor for Solidity development with touch gestures, responsive design, and developer-friendly features.

## 🎯 Features

### Touch-Optimized Interface
- **Large Touch Targets**: All buttons and controls sized for comfortable touch interaction
- **Touch Gestures**: 
  - Swipe left to compile
  - Swipe right to save
  - Swipe up to view compilation results
  - Swipe down to close bottom sheets
  - Pinch to zoom for font size adjustment
  - Edge swipe from left to open code snippets

### Mobile-First UI Components
- **Bottom Sheet**: Compilation results displayed in a draggable bottom sheet with snap points
- **Quick Action Toolbar**: Easy access to common actions (compile, save, format)
- **Collapsible Panels**: Maximize code space by hiding/showing panels
- **Mobile Keyboard Optimization**: Smart positioning to avoid keyboard overlap

### Code Editing Features
- **Syntax Highlighting**: Full Solidity language support
- **Auto-completion**: Touch-friendly code suggestions
- **Code Snippets**: Pre-built templates for common patterns
- **Undo/Redo**: Full history management with touch buttons
- **Auto-save**: Automatic saving with visual indicators

### Developer Experience
- **Real-time Compilation**: Instant feedback on code errors
- **Gas Optimization Tips**: Built-in suggestions for efficient code
- **Security Analysis**: Integrated security checks
- **Responsive Layout**: Adapts to any screen size

## 📦 Components

### MobileOptimizedCodeEditor
The main editor component with all mobile optimizations built-in.

```tsx
import { MobileOptimizedCodeEditor } from '@/components/editor';

function MyApp() {
  return (
    <MobileOptimizedCodeEditor
      initialCode="// Your Solidity code"
      onCodeChange={(code) => console.log('Code changed:', code)}
      onCompile={async (code) => {
        // Your compilation logic
        return {
          success: true,
          errors: [],
          warnings: []
        };
      }}
    />
  );
}
```

### MobileQuickActionBar
Customizable toolbar for quick actions.

```tsx
import { MobileQuickActionBar, QuickActionPresets } from '@/components/editor';

function MyEditor() {
  return (
    <MobileQuickActionBar
      groups={QuickActionPresets.full}
      position="bottom"
      showLabels={false}
      onActionExecuted={(actionId) => console.log('Action:', actionId)}
    />
  );
}
```

### MobileCodeSnippets
Touch-friendly code snippet browser and insertion.

```tsx
import { MobileCodeSnippets } from '@/components/editor';

function SnippetPanel() {
  return (
    <MobileCodeSnippets
      onInsert={(snippet) => {
        // Insert snippet into editor
      }}
      favoriteSnippets={['basic-contract', 'erc20-transfer']}
    />
  );
}
```

### ResponsiveCodeEditor
Automatically switches between mobile and desktop versions.

```tsx
import { ResponsiveCodeEditor } from '@/components/editor';

function App() {
  return (
    <ResponsiveCodeEditor
      mobileProps={{
        // Mobile-specific props
      }}
      desktopProps={{
        // Desktop-specific props
      }}
      breakpoint="(max-width: 768px)"
    />
  );
}
```

## 🎨 Customization

### Theme Support
```tsx
<MobileOptimizedCodeEditor
  theme="vs-dark" // or "vs-light"
/>
```

### Custom Snippets
```tsx
const customSnippets = [
  {
    id: 'my-snippet',
    label: 'My Custom Snippet',
    category: 'custom',
    code: 'contract MyContract { }',
    description: 'A custom contract template',
    tags: ['custom', 'template']
  }
];

<MobileCodeSnippets snippets={customSnippets} />
```

### Action Customization
```tsx
const customActions = [
  {
    id: 'deploy',
    icon: Upload,
    label: 'Deploy',
    onClick: () => deployContract(),
    variant: 'primary'
  }
];

<MobileQuickActionBar
  groups={[
    {
      id: 'custom',
      label: 'Custom Actions',
      actions: customActions
    }
  ]}
/>
```

## 🚀 Performance

### Optimizations
- **Dynamic imports** for Monaco Editor (reduces initial bundle)
- **Debounced updates** to prevent excessive re-renders
- **Virtual scrolling** for large code files
- **Memoized components** with performance HOCs

### Mobile-Specific Optimizations
- Disabled minimap on mobile
- Reduced scrollbar size
- Disabled unnecessary features (drag & drop, context menus)
- Optimized touch event handlers

## 📱 Responsive Design

### Breakpoints
- Mobile: `< 640px`
- Tablet: `641px - 1024px`
- Desktop: `> 1025px`

### Adaptive Features
- Font size adjusts based on screen size
- Toolbar layout changes for different orientations
- Bottom sheet height adapts to content
- Side panels become overlays on small screens

## 🔧 API Reference

### MobileOptimizedCodeEditor Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialCode` | `string` | `""` | Initial code content |
| `onCodeChange` | `(code: string) => void` | - | Callback when code changes |
| `onCompile` | `(code: string) => Promise<CompilationResult>` | - | Compilation handler |
| `snippets` | `CodeSnippet[]` | Built-in snippets | Custom code snippets |
| `className` | `string` | - | Additional CSS classes |

### Compilation Result Interface

```typescript
interface CompilationResult {
  success: boolean;
  errors: Array<{
    line: number;
    column: number;
    severity: 'error' | 'warning';
    message: string;
  }>;
  warnings: Array<{
    line: number;
    column: number;
    message: string;
  }>;
  gasEstimate?: number;
  bytecode?: string;
}
```

## 🎯 Usage Examples

### Basic Implementation
```tsx
<MobileOptimizedCodeEditor
  initialCode={`pragma solidity ^0.8.0;

contract MyToken {
    mapping(address => uint256) balances;
    
    function transfer(address to, uint256 amount) public {
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}`}
  onCodeChange={(code) => {
    console.log('Code updated');
  }}
/>
```

### With Custom Compilation
```tsx
const handleCompile = async (code: string) => {
  try {
    const response = await fetch('/api/compile', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    
    return await response.json();
  } catch (error) {
    return {
      success: false,
      errors: [{
        line: 1,
        column: 1,
        severity: 'error',
        message: 'Compilation failed'
      }],
      warnings: []
    };
  }
};

<MobileOptimizedCodeEditor
  onCompile={handleCompile}
/>
```

## 🤝 Integration

### With React Hook Form
```tsx
const { register, setValue, watch } = useForm();
const code = watch('contractCode');

<MobileOptimizedCodeEditor
  initialCode={code}
  onCodeChange={(newCode) => setValue('contractCode', newCode)}
/>
```

### With Redux/Zustand
```tsx
const { code, updateCode } = useCodeStore();

<MobileOptimizedCodeEditor
  initialCode={code}
  onCodeChange={updateCode}
/>
```

## 📚 Best Practices

1. **Lazy Load**: Use dynamic imports for better performance
2. **Debounce Updates**: Prevent excessive state updates
3. **Error Boundaries**: Wrap in error boundaries for stability
4. **Accessibility**: Ensure keyboard navigation works
5. **Testing**: Test on real devices, not just browser DevTools

## 🐛 Troubleshooting

### Common Issues

1. **Monaco Editor not loading**
   - Ensure `ssr: false` in dynamic import
   - Check if running in browser environment

2. **Touch gestures not working**
   - Verify touch event handlers are properly attached
   - Check for conflicting event listeners

3. **Performance issues**
   - Reduce editor features on mobile
   - Implement virtual scrolling for large files
   - Use performance monitoring tools

## 📄 License

This component is part of the Solidity Learning Platform and follows the project's license.