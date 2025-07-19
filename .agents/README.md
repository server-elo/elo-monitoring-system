# 12-Factor Agents Integration

This directory contains the 12-factor agents principles and configuration for autonomous, reliable AI agent operation.

## Structure

```
.agents/
├── README.md           # This file
├── AGENT_CONFIG.md     # Project-specific agent configuration
└── principles/         # 12-factor principles documentation
    ├── factor-01-natural-language-to-tool-calls.md
    ├── factor-02-own-your-prompts.md
    ├── factor-03-own-your-context-window.md
    ├── factor-04-tools-are-structured-outputs.md
    ├── factor-05-unify-execution-state.md
    ├── factor-06-launch-pause-resume.md
    ├── factor-07-contact-humans-with-tools.md
    ├── factor-08-own-your-control-flow.md
    ├── factor-09-compact-errors.md
    ├── factor-10-small-focused-agents.md
    ├── factor-11-trigger-from-anywhere.md
    └── factor-12-stateless-reducer.md
```

## Usage

The agent references these principles to:
1. Avoid infinite loops
2. Work autonomously without repetition
3. Track progress explicitly
4. Handle errors systematically
5. Maintain clear state

## Key Principles Applied

- **Factor 3: Context Engineering** - TodoWrite for explicit progress tracking
- **Factor 9: Compact Errors** - Systematic error collection and fixing
- **Factor 10: Small Focused Tasks** - Atomic operations that complete quickly
- **Factor 12: Stateless Reducer** - Each operation independent and predictable

## Reference

Based on: https://github.com/humanlayer/12-factor-agents