export const solidityBestPracticesCourse = {
  id: 'solidity-best-practices-2025',
  title: 'Solidity Best Practices 2025',
  description: 'Master modern Solidity development with security-first approach and gas optimization techniques',
  difficulty: 'intermediate',
  duration: '8 hours',
  prerequisites: ['basic-solidity', 'smart-contracts-101'],
  
  modules: [
    {
      id: 'security-fundamentals',
      title: 'Security Fundamentals',
      lessons: [
        {
          id: 'access-control',
          title: 'Access Control Patterns',
          content: `
# Access Control in Smart Contracts

Access control is the #1 exploit vector in 2025. Learn how to properly secure your functions.

## Key Concepts
- Role-based access control
- Ownership patterns
- Multi-signature requirements
- Time-locked functions

## Best Practices
1. Always use explicit visibility modifiers
2. Implement role-based permissions
3. Use OpenZeppelin's AccessControl
4. Validate all inputs
          `,
          codeExample: `
// Simple ownership pattern
contract Ownable {
    address private _owner;
    
    modifier onlyOwner() {
        require(msg.sender == _owner, "Not authorized");
        _;
    }
    
    constructor() {
        _owner = msg.sender;
    }
}

// Role-based access control
contract RoleBasedAccess {
    mapping(address => mapping(string => bool)) private _roles;
    
    modifier hasRole(string memory role) {
        require(_roles[msg.sender][role], "Missing role");
        _;
    }
    
    function grantRole(address account, string memory role) 
        external 
        onlyOwner 
    {
        _roles[account][role] = true;
    }
}`,
          quiz: [
            {
              question: 'What is the most common smart contract vulnerability?',
              options: [
                'Integer overflow',
                'Reentrancy',
                'Access control',
                'Gas limits'
              ],
              correctAnswer: 2,
              explanation: 'Improper access control remains the #1 exploit vector in smart contracts.'
            }
          ]
        },
        {
          id: 'reentrancy-protection',
          title: 'Preventing Reentrancy Attacks',
          content: `
# Reentrancy Protection

Reentrancy attacks occur when external contracts call back into your contract before the first execution completes.

## The Problem
\`\`\`solidity
// VULNERABLE CODE
function withdraw() public {
    uint amount = balances[msg.sender];
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);
    balances[msg.sender] = 0; // State change AFTER external call
}
\`\`\`

## Solutions

### 1. Checks-Effects-Interactions Pattern
Always follow this order:
1. Check conditions (require statements)
2. Update state (effects)
3. Make external calls (interactions)

### 2. ReentrancyGuard
Use OpenZeppelin's battle-tested solution for comprehensive protection.
          `,
          practiceProblems: [
            {
              title: 'Fix the Vulnerable Withdraw Function',
              initialCode: `
contract VulnerableBank {
    mapping(address => uint256) public balances;
    
    function withdraw() public {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");
        
        // Fix this function to prevent reentrancy
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        balances[msg.sender] = 0;
    }
}`,
              solution: `
contract SecureBank {
    mapping(address => uint256) public balances;
    
    function withdraw() public {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");
        
        // Effects before interactions
        balances[msg.sender] = 0;
        
        // Now make the external call
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}`
            }
          ]
        }
      ]
    },
    {
      id: 'gas-optimization',
      title: 'Gas Optimization Mastery',
      lessons: [
        {
          id: 'storage-optimization',
          title: 'Storage Optimization Techniques',
          content: `
# Storage Optimization

Storage is the most expensive operation in Ethereum. Learn how to minimize costs.

## Gas Costs (2025)
- New storage: 20,000 gas
- Update storage: 5,000 gas  
- Read storage: 200 gas
- Delete storage: -15,000 gas refund

## Optimization Techniques

### 1. Variable Packing
Pack multiple variables into single 32-byte slots.

### 2. Use bytes32 Instead of String
For fixed-size data, bytes32 is much cheaper than string.

### 3. Storage Deletion
Zero out storage when no longer needed to get gas refunds.
          `,
          interactiveDemo: {
            title: 'Storage Packing Visualizer',
            description: 'See how variable packing saves gas',
            type: 'storage-packing'
          }
        },
        {
          id: 'efficient-patterns',
          title: 'Efficient Coding Patterns',
          content: `
# Efficient Solidity Patterns

## 1. Cache Array Length
\`\`\`solidity
// Bad: length accessed every iteration
for (uint i = 0; i < array.length; i++) { }

// Good: length cached once
uint length = array.length;
for (uint i = 0; i < length; i++) { }
\`\`\`

## 2. Use Unchecked Blocks
When overflow is impossible, save gas with unchecked math.

## 3. Short-Circuit Logic
Place cheaper conditions first in && and || operations.

## 4. Batch Operations
Process multiple items in single transaction when possible.
          `,
          gasComparison: [
            {
              pattern: 'String vs bytes32',
              badGas: 50000,
              goodGas: 22000,
              savings: '56%'
            },
            {
              pattern: 'Storage vs memory',
              badGas: 20000,
              goodGas: 200,
              savings: '99%'
            }
          ]
        }
      ]
    },
    {
      id: 'testing-tools',
      title: 'Testing & Analysis Tools',
      lessons: [
        {
          id: 'static-analysis',
          title: 'Static Analysis with Slither',
          content: `
# Static Analysis Tools

## Slither
The most popular Solidity static analyzer.

### Installation
\`\`\`bash
pip3 install slither-analyzer
\`\`\`

### Basic Usage
\`\`\`bash
slither .
slither contracts/MyContract.sol
\`\`\`

### Common Detectors
- Reentrancy vulnerabilities
- Uninitialized variables
- Incorrect visibility
- Gas optimization opportunities
          `,
          toolsGuide: {
            slither: {
              command: 'slither .',
              outputExample: `
MyContract.sol:
  - Reentrancy in withdraw() (line 45)
  - State variable 'owner' should be immutable (line 10)
  - Function 'calculate' can be declared external (line 23)
              `
            }
          }
        }
      ]
    },
    {
      id: 'modern-features',
      title: 'Modern Solidity Features',
      lessons: [
        {
          id: 'custom-errors',
          title: 'Custom Errors (Gas Efficient)',
          content: `
# Custom Errors in Solidity

Custom errors save significant gas compared to require strings.

## Gas Comparison
- require with string: ~2000 gas
- custom error: ~200 gas

## Implementation
\`\`\`solidity
// Define custom errors
error InsufficientBalance(uint256 requested, uint256 available);
error Unauthorized(address caller);

// Use in functions
function withdraw(uint256 amount) public {
    if (amount > balances[msg.sender]) {
        revert InsufficientBalance({
            requested: amount,
            available: balances[msg.sender]
        });
    }
}
\`\`\`
          `
        }
      ]
    }
  ],
  
  finalProject: {
    title: 'Build a Gas-Optimized DEX',
    description: 'Apply all best practices to build a secure, gas-efficient decentralized exchange',
    requirements: [
      'Implement secure token swaps',
      'Add liquidity provision',
      'Use custom errors throughout',
      'Optimize storage usage',
      'Prevent common attacks',
      'Achieve < 100k gas per swap'
    ],
    starterCode: `
// Your optimized DEX implementation
contract OptimizedDEX {
    // TODO: Implement your DEX following best practices
}
    `,
    tests: [
      'Security: No reentrancy vulnerabilities',
      'Security: Proper access control',
      'Gas: Swap costs < 100k gas',
      'Gas: Efficient storage packing',
      'Quality: 100% test coverage'
    ]
  },
  
  achievements: [
    {
      id: 'security-master',
      title: 'Security Master',
      description: 'Complete all security lessons with 90%+ scores',
      points: 500
    },
    {
      id: 'gas-optimizer',
      title: 'Gas Optimization Expert',
      description: 'Reduce gas costs by 50% in practice problems',
      points: 750
    },
    {
      id: 'tool-master',
      title: 'Tool Master',
      description: 'Use all analysis tools successfully',
      points: 300
    }
  ]
}