# AI Components for Solidity Learning Platform

## AICodeAssistant

The AICodeAssistant is a comprehensive AI-powered code assistant component specifically designed for smart contract development with Solidity. It provides real-time analysis, suggestions, and code generation capabilities.

### Features

1. **Real-time Code Analysis**
   - Security vulnerability detection with severity levels
   - Gas optimization recommendations with cost savings
   - Code quality metrics (readability, maintainability, security, gas efficiency)
   - Best practices enforcement

2. **Natural Language to Code Generation**
   - Generate Solidity code from natural language descriptions
   - Support for common patterns: ERC20, ERC721, Staking, DAO/Governance
   - Context-aware code generation

3. **Smart Suggestions**
   - Code completion suggestions
   - Fix recommendations for common issues
   - Refactoring suggestions
   - Optimization proposals with impact assessment

4. **Interactive Features**
   - Apply suggestions directly to the editor
   - Copy code snippets with one click
   - Expandable suggestion details
   - Severity filtering for security issues

5. **Customizable Settings**
   - Auto-analyze toggle
   - Real-time analysis toggle
   - Configurable analysis debounce

### Usage

```tsx
import { AICodeAssistant } from '@/components/ai';

function SolidityEditor() {
  const [code, setCode] = useState('');
  const editorRef = useRef(null);

  return (
    <div className="flex">
      <div className="flex-1">
        {/* Your Monaco Editor */}
      </div>
      <div className="w-96">
        <AICodeAssistant
          code={code}
          onCodeChange={setCode}
          editorInstance={editorRef.current}
          userId="user-123"
          className="h-full"
        />
      </div>
    </div>
  );
}
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `code` | `string` | The current code to analyze | Required |
| `onCodeChange` | `(code: string) => void` | Callback when code is generated/changed | - |
| `onSuggestionApply` | `(suggestion: CodeSuggestion) => void` | Callback when a suggestion is applied | - |
| `language` | `string` | Programming language | `'solidity'` |
| `className` | `string` | Additional CSS classes | - |
| `editorInstance` | `any` | Monaco editor instance for applying suggestions | - |
| `userId` | `string` | User ID for personalized analysis | - |

### API Endpoints

The component uses two API endpoints:

1. **`/api/ai/code-assistant/analyze`** - Code analysis endpoint
   - Analyzes code for security issues, gas optimizations, and best practices
   - Returns comprehensive analysis results

2. **`/api/ai/code-assistant/generate`** - Code generation endpoint
   - Generates Solidity code from natural language descriptions
   - Supports common smart contract patterns

### Example Natural Language Queries

- "Create an ERC20 token with mint and burn functions"
- "Generate an NFT contract with metadata support"
- "Build a staking contract for token rewards"
- "Create a simple DAO with voting functionality"

### Styling

The component uses:
- Tailwind CSS for styling
- Framer Motion for animations
- Custom glassmorphism effects
- Dark theme optimized for code editors

### Security Considerations

- All user input is validated
- API requests include user authentication
- Code analysis runs in a sandboxed environment
- No code execution on the client side

### Performance

- Debounced analysis (1 second delay)
- Efficient re-rendering with React hooks
- Memoized filtering for large result sets
- Lazy loading of suggestion details

### Future Enhancements

- Integration with blockchain networks for deployment
- Advanced AI models for better code generation
- Collaborative features for team development
- Historical analysis tracking
- Custom rule configuration