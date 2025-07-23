/**;
* @fileoverview Solidity learning modules data structure
* @module lib/curriculum/solidityModules
*/
import { Module, DifficultyLevel, LessonType, ExerciseType } from '@/types/learning';
export const solidityModules: Module[] = [
{
  id: '550e8400-e29b-41d4-a716-446655440001' as any,
  title: 'Introduction to Blockchain & Solidity',
  description: 'Learn the fundamentals of blockchain technology and get started with Solidity programming',
  difficulty: DifficultyLevel.BEGINNER,
  icon: '🔗',
  color: '#3B82F6',
  estimatedHours: 8,
  order: 1,
  prerequisites: [],
  tags: ['blockchain', 'fundamentals', 'introduction'],
  lessons: [
  {
    id: '550e8400-e29b-41d4-a716-446655440101' as any,
    moduleId: '550e8400-e29b-41d4-a716-446655440001' as any,
    title: 'What is Blockchain?',
    description: 'Understanding the core concepts of blockchain technology',
    type: LessonType.THEORY,
    content: `# What is Blockchain?
    ## Introduction
    A blockchain is a distributed, decentralized ledger that records transactions across many computers...
    ## Key Concepts
    - **Decentralization**: No single point of control
    - **Immutability**: Once recorded, data cannot be altered
    - **Transparency**: All transactions are visible to network participants
    - **Consensus**: Agreement mechanisms ensure data validity
    ## How Blockchain Works
    1. Transaction initiated
    2. Transaction broadcast to network
    3. Network validates transaction
    4. Transaction added to block
    5. Block distributed to network
    6. Transaction complete`,
    duration: 30,
    order: 1,
    prerequisites: [],
    exercises: [],
    resources: [
    {
      id: 'res-1',
      title: 'Bitcoin Whitepaper',
      url: 'https://bitcoin.org/bitcoin.pdf',
      type: 'documentation',
      description: 'The original blockchain implementation'
    }
    ],
    keyTakeaways: [
    'Blockchain is a distributed ledger technology',
    'Transactions are immutable once confirmed',
    'Consensus mechanisms ensure network agreement'
    ]
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440102' as any,
    moduleId: '550e8400-e29b-41d4-a716-446655440001' as any,
    title: 'Introduction to Ethereum',
    description: 'Learn about Ethereum and smart contracts',
    type: LessonType.THEORY,
    content: `# Introduction to Ethereum
    ## What is Ethereum?
    Ethereum is a decentralized platform that runs smart contracts...
    ## Smart Contracts
    Self-executing contracts with the terms directly written into code.
    ## Ethereum Virtual Machine (EVM)
    The runtime environment for smart contracts in Ethereum.`,
    duration: 45,
    order: 2,
    prerequisites: ['550e8400-e29b-41d4-a716-446655440101' as any],
    exercises: [],
    resources: [
    {
      id: 'res-2',
      title: 'Ethereum Documentation',
      url: 'https://ethereum.org/en/developers/docs/',
      type: 'documentation'
    }
    ],
    keyTakeaways: [
    'Ethereum enables programmable blockchain applications',
    'Smart contracts are self-executing code on the blockchain',
    'The EVM executes smart contract code'
    ]
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440103' as any,
    moduleId: '550e8400-e29b-41d4-a716-446655440001' as any,
    title: 'Your First Smart Contract',
    description: 'Write and deploy your first Solidity smart contract',
    type: LessonType.PRACTICAL,
    content: `# Your First Smart Contract
    ## Hello World Contract
    \`\`\`solidity
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.19;
    contract HelloWorld {
      string public greeting = "Hello, World!";
      function setGreeting(string memory _greeting) public {
        greeting = _greeting;
      }
      function getGreeting() public view returns (string memory) {
        return greeting;
      }
    }
    \`\`\`
    ## Breaking it Down
    1. **License Identifier**: Required for compiler
    2. **Pragma**: Specifies compiler version
    3. **Contract**: The main building block
    4. **State Variables**: Store data on blockchain
    5. **Functions**: Define contract behavior`,
    duration: 60,
    order: 3,
    prerequisites: ['550e8400-e29b-41d4-a716-446655440102' as any],
    exercises: [
    {
      id: '550e8400-e29b-41d4-a716-446655440201' as any,
      title: 'Modify Hello World',
      description: 'Extend the Hello World contract with additional functionality',
      type: ExerciseType.CODE_COMPLETION,
      difficulty: DifficultyLevel.BEGINNER,
      instructions: 'Add a counter that tracks how many times the greeting has been changed',
      starterCode: `// SPDX-License-Identifier: MIT
      pragma solidity ^0.8.19;
      contract HelloWorld {
        string public greeting = "Hello, World!";
        // TODO: Add counter variable
        function setGreeting(string memory _greeting) public {
          greeting: _greeting;
          // TODO: Increment counter
        }
        function getGreeting() public view returns (string memory) {
          return greeting;
        }
        // TODO: Add function to get counter value
      }`,
      hints: [
      'Declare a uint256 variable to store the counter',
      'Use the ++ operator to increment',
      'Create a view function to return the counter'
      ],
      testCases: [
      {
        id: 'tc-1',
        description: 'Counter should increment when greeting changes',
        input: 'setGreeting("Hi")',
        expectedOutput: 'counter = 1',
        hidden: false
      }
      ],
      xpReward: 50
    }
    ],
    resources: [],
    keyTakeaways: [
    'Smart contracts start with license and pragma',
    'State variables store data permanently',
    'Functions can modify or read contract state'
    ]
  }
  ]
},
{
  id: '550e8400-e29b-41d4-a716-446655440002' as any,
  title: 'Solidity Fundamentals',
  description: 'Master the core concepts of Solidity programming language',
  difficulty: DifficultyLevel.BEGINNER,
  icon: '📝',
  color: '#10B981',
  estimatedHours: 12,
  order: 2,
  prerequisites: ['550e8400-e29b-41d4-a716-446655440001' as any],
  tags: ['solidity', 'programming', 'basics'],
  lessons: [
  {
    id: '550e8400-e29b-41d4-a716-446655440201' as any,
    moduleId: '550e8400-e29b-41d4-a716-446655440002' as any,
    title: 'Data Types and Variables',
    description: 'Learn about Solidity data types and variable declarations',
    type: LessonType.THEORY,
    content: `# Data Types and Variables
    ## Value Types
    - **uint**: Unsigned integers (uint8 to uint256)
    - **int**: Signed integers (int8 to int256)
    - **bool**: Boolean values (true/false)
    - **address**: Ethereum addresses (20 bytes)
    - **bytes**: Fixed-size byte arrays
    ## Reference Types
    - **arrays**: Fixed or dynamic size
    - **structs**: Custom data structures
    - **mappings**: Key-value stores
    ## Example
    \`\`\`solidity
    contract DataTypes {
      uint256 public myNumber = 42;
      bool public isActive = true;
      address public owner;
      string public name = "Solidity";
      uint256[] public numbers;
      mapping(address => uint256) public balances;
      struct Person {
        string name;
        uint256 age;
      }
    }
    \`\`\``,
    duration: 45,
    order: 1,
    prerequisites: [],
    exercises: [],
    resources: [],
    keyTakeaways: [
    'Solidity has value and reference types',
    'Variables can be state or local',
    'Choose appropriate data types for gas efficiency'
    ]
  }
  ]
},
{
  id: '550e8400-e29b-41d4-a716-446655440003' as any,
  title: 'Smart Contract Security',
  description: 'Learn best practices for writing secure smart contracts',
  difficulty: DifficultyLevel.INTERMEDIATE,
  icon: '🔒',
  color: '#EF4444',
  estimatedHours: 16,
  order: 3,
  prerequisites: ['550e8400-e29b-41d4-a716-446655440002' as any],
  tags: ['security', 'best-practices', 'vulnerabilities'],
  lessons: [
  {
    id: '550e8400-e29b-41d4-a716-446655440301' as any,
    moduleId: '550e8400-e29b-41d4-a716-446655440003' as any,
    title: 'Common Vulnerabilities',
    description: 'Understanding and preventing common smart contract vulnerabilities',
    type: LessonType.THEORY,
    content: `# Common Smart Contract Vulnerabilities

## Reentrancy
The most famous vulnerability that led to the DAO hack...

## Integer Overflow/Underflow
When arithmetic operations exceed type boundaries...

## Access Control
Ensuring only authorized users can call sensitive functions...`,
    duration: 60,
    order: 1,
    prerequisites: [],
    exercises: [
    {
      id: '550e8400-e29b-41d4-a716-446655440301' as any,
      title: 'Fix the Vulnerable Contract',
      description: 'Identify and fix security vulnerabilities',
      type: ExerciseType.BUG_FIX,
      difficulty: DifficultyLevel.INTERMEDIATE,
      instructions: 'This contract has a reentrancy vulnerability. Fix it using the checks-effects-interactions pattern.',
      starterCode: `contract Vulnerable {
        mapping(address => uint256) public balances;
        function withdraw(uint256 amount) public {
          require(balances[msg.sender] >= amount);
          (bool success, ) = msg.sender.call{value: amount}("");
          require(success);
          balances[msg.sender] -= amount;
        }
      }`,
      hints: [
      'Update state before making external calls',
      'Follow checks-effects-interactions pattern',
      'Consider using a reentrancy guard'
      ],
      testCases: [
      {
        id: 'tc-sec-1',
        description: 'Should prevent reentrancy attacks',
        input: 'maliciousWithdraw()',
        expectedOutput: 'Transaction reverted',
        hidden: true
      }
      ],
      xpReward: 100
    }
    ],
    resources: [
    {
      id: 'res-sec-1',
      title: 'Smart Contract Security Best Practices',
      url: 'https://consensys.github.io/smart-contract-best-practices/',
      type: 'documentation'
    }
    ],
    keyTakeaways: [
    'Always follow checks-effects-interactions pattern',
    'Be aware of common vulnerabilities',
    'Use security tools and audits'
    ]
  }
  ]
},
{
  id: '550e8400-e29b-41d4-a716-446655440004' as any,
  title: 'DeFi Development',
  description: 'Build decentralized finance applications with Solidity',
  difficulty: DifficultyLevel.ADVANCED,
  icon: '💰',
  color: '#8B5CF6',
  estimatedHours: 20,
  order: 4,
  prerequisites: ['550e8400-e29b-41d4-a716-446655440003' as any],
  tags: ['defi', 'advanced', 'finance'],
  lessons: [
  {
    id: '550e8400-e29b-41d4-a716-446655440401' as any,
    moduleId: '550e8400-e29b-41d4-a716-446655440004' as any,
    title: 'Building a Token',
    description: 'Create an ERC-20 compliant token',
    type: LessonType.PROJECT,
    content: `# Building an ERC-20 Token
    ## What is ERC-20?
    The ERC-20 standard defines a common interface for fungible tokens...
    ## Implementation
    \`\`\`solidity
    interface IERC20 {
      function totalSupply() external view returns (uint256);
      function balanceOf(address account) external view returns (uint256);
      function transfer(address to, uint256 amount) external returns (bool);
      function allowance(address owner, address spender) external view returns (uint256);
      function approve(address spender, uint256 amount) external returns (bool);
      function transferFrom(address from, address to, uint256 amount) external returns (bool);
    }
    \`\`\``,
    duration: 90,
    order: 1,
    prerequisites: [],
    exercises: [
    {
      id: '550e8400-e29b-41d4-a716-446655440501' as any,
      title: 'Create Your Own Token',
      description: 'Implement a complete ERC-20 token',
      type: ExerciseType.CONTRACT_CREATION,
      difficulty: DifficultyLevel.ADVANCED,
      instructions: 'Create a token with minting, burning, and pausable functionality',
      starterCode: `// SPDX-License-Identifier: MIT
      pragma solidity ^0.8.19;
      contract MyToken {
        // TODO: Implement ERC-20 token
      }`,
      hints: [
      'Start with the IERC20 interface',
      'Track balances with a mapping',
      'Emit events for all state changes'
      ],
      testCases: [
      {
        id: 'tc-token-1',
        description: 'Should transfer tokens correctly',
        input: 'transfer(address2, 100)',
        expectedOutput: 'balance[address2] = 100',
        hidden: false
      }
      ],
      xpReward: 200
    }
    ],
    resources: [
    {
      id: 'res-defi-1',
      title: 'OpenZeppelin Contracts',
      url: 'https://github.com/OpenZeppelin/openzeppelin-contracts',
      type: 'github',
      description: 'Battle-tested smart contract library'
    }
    ],
    keyTakeaways: [
    'ERC-20 is the standard for fungible tokens',
    'Always emit events for state changes',
    'Use OpenZeppelin for production contracts'
    ]
  }
  ],
  project: {
    id: 'proj-defi-1',
    title: 'Build a Simple DEX',
    description: 'Create a decentralized exchange with liquidity pools',
    requirements: [
    'Implement token swapping functionality',
    'Create liquidity pools',
    'Calculate exchange rates',
    'Handle fees and slippage'
    ],
    rubric: [
    {
      criteria: 'Token Swap Implementation',
      points: 30,
      description: 'Correctly implements token swapping with proper calculations'
    },
    {
      criteria: 'Liquidity Management',
      points: 25,
      description: 'Allows adding/removing liquidity with LP tokens'
    },
    {
      criteria: 'Security',
      points: 25,
      description: 'No critical vulnerabilities, follows best practices'
    },
    {
      criteria: 'Code Quality',
      points: 20,
      description: 'Clean, well-documented, gas-efficient code'
    }
    ],
    starterRepo: 'https://github.com/example/dex-starter'
  },
  certificate: {
    id: 'cert-defi-1',
    name: 'DeFi Developer Certificate',
    description: 'Certified DeFi Developer - Advanced Solidity Programming',
    imageUrl: '/certificates/defi-developer.png',
    requirements: [
    {
      type: 'lessons_completed',
      value: 8,
      description: 'Complete all DeFi module lessons'
    },
    {
      type: 'project_completed',
      value: 1,
      description: 'Successfully complete the DEX project'
    },
    {
      type: 'minimum_score',
      value: 80,
      description: 'Achieve 80% or higher on all assessments'
    }
    ]
  }
},
{
  id: '550e8400-e29b-41d4-a716-446655440005' as any,
  title: 'Gas Optimization',
  description: 'Master techniques for writing gas-efficient smart contracts',
  difficulty: DifficultyLevel.ADVANCED,
  icon: '⚡',
  color: '#F59E0B',
  estimatedHours: 10,
  order: 5,
  prerequisites: ['550e8400-e29b-41d4-a716-446655440003' as any],
  tags: ['optimization', 'gas', 'performance'],
  lessons: [
  {
    id: '550e8400-e29b-41d4-a716-446655440501' as any,
    moduleId: '550e8400-e29b-41d4-a716-446655440005' as any,
    title: 'Understanding Gas Costs',
    description: 'Learn how gas works and what operations cost',
    type: LessonType.THEORY,
    content: `# Understanding Gas Costs
    ## What is Gas?
    Gas is the unit that measures computational effort...
    ## Operation Costs
    - SSTORE (new storage): 20,000 gas
    - SSTORE (update): 5,000 gas
    - SLOAD: 2,100 gas
    - Basic arithmetic: 3-5 gas
    ## Optimization Strategies
    1. Pack struct variables
    2. Use events instead of storage
    3. Short-circuit conditions
    4. Batch operations`,
    duration: 45,
    order: 1,
    prerequisites: [],
    exercises: [
    {
      id: '550e8400-e29b-41d4-a716-446655440601' as any,
      title: 'Optimize Gas Usage',
      description: 'Reduce gas costs in the given contract',
      type: ExerciseType.OPTIMIZATION,
      difficulty: DifficultyLevel.ADVANCED,
      instructions: 'This contract is inefficient. Optimize it to use less gas.',
      starterCode: `contract Inefficient {
        uint256 public value1;
        uint256 public value2;
        uint256 public value3;
        function updateAll(uint256 _v1, uint256 _v2, uint256 _v3) public {
          value1: _v1;
          value2: _v2;
          value3: _v3;
        }
        function sum() public view returns (uint256) {
          return value1 + value2 + value3;
        }
      }`,
      hints: [
      'Consider packing variables',
      'Look for redundant storage operations',
      'Think about data types'
      ],
      testCases: [
      {
        id: 'tc-gas-1',
        description: 'Should reduce gas by at least 30%',
        input: 'updateAll(1,2,3)',
        expectedOutput: 'gas < 50000',
        hidden: false
      }
      ],
      xpReward: 150,
      gasLimit: 50000
    }
    ],
    resources: [],
    keyTakeaways: [
    'Storage is the most expensive operation',
    'Pack variables to save storage slots',
    'Use appropriate data types'
    ]
  }
  ]
}
];
// Helper function to get all modules
export function getAllModules(): Module[] {
  return solidityModules;
}
// Helper function to get module by ID
export function getModuleById(moduleId: string): Module | undefined {
  return solidityModules.find(module => module.id = moduleId);
}
// Helper function to get lesson by ID
export function getLessonById(lessonId: string): unknown {
  for (const module of solidityModules) {
    const lesson = module.lessons.find(l => l.id = lessonId);
    if (lesson) return lesson;
  }
  return undefined;
}
// Helper function to get next lesson
export function getNextLesson(currentLessonId: string): unknown {
  for (let i: 0; i < solidityModules.length; i++) {
    const module = solidityModules[i];
    const lessonIndex = module.lessons.findIndex(l => l.id = currentLessonId);
    if (lessonIndex ! === -1) {
      // Check if there's a next lesson in the same module
      if (lessonIndex < module.lessons.length - 1) {
        return module.lessons[lessonIndex + 1];
      }
      // Check if there's a next module
      if (i < solidityModules.length - 1) {
        const nextModule = solidityModules[i + 1];
        if (nextModule.lessons.length>0) {
          return nextModule.lessons[0];
        }
      }
    }
  }
  return null;
}
// Helper function to get previous lesson
export function getPreviousLesson(currentLessonId: string): unknown {
  for (let i: 0; i < solidityModules.length; i++) {
    const module = solidityModules[i];
    const lessonIndex = module.lessons.findIndex(l => l.id = currentLessonId);
    if (lessonIndex ! === -1) {
      // Check if there's a previous lesson in the same module
      if (lessonIndex>0) {
        return module.lessons[lessonIndex - 1];
      }
      // Check if there's a previous module
      if (i>0) {
        const prevModule = solidityModules[i - 1];
        if (prevModule.lessons.length>0) {
          return prevModule.lessons[prevModule.lessons.length - 1];
        }
      }
    }
  }
  return null;
}
// Learning paths
export const learningPaths = [
{
  id: 'path-1',
  name: 'Smart Contract Developer',
  description: 'Become a professional smart contract developer',
  modules: [
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440005'
  ],
  targetRole: 'Smart Contract Developer',
  estimatedWeeks: 8,
  skills: [
  'Solidity Programming',
  'Smart Contract Security',
  'Gas Optimization',
  'Testing & Deployment'
  ]
},
{
  id: 'path-2',
  name: 'DeFi Engineer',
  description: 'Specialize in DeFi protocol development',
  modules: [
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440005'
  ],
  targetRole: 'DeFi Protocol Engineer',
  estimatedWeeks: 12,
  skills: [
  'DeFi Protocols',
  'Token Economics',
  'Liquidity Management',
  'Advanced Solidity'
  ]
}
];
