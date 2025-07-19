
import { LearningModule } from './types';

export const LEARNING_MODULES: LearningModule[] = [
  {
    id: 'solidity-intro',
    title: 'Introduction to Solidity',
    category: 'Solidity Basics',
    level: 'Beginner',
    summary: 'Understand the fundamentals of Solidity, the primary language for Ethereum smart contracts, its key characteristics, and see a basic "Hello World" example.',
    content: `Solidity is an object-oriented, high-level language for implementing smart contracts. Smart contracts are programs which govern the behaviour of accounts within the Ethereum state. It was influenced by C++, Python, and JavaScript and is designed to target the Ethereum Virtual Machine (EVM).

### Key Characteristics:
*   **Statically-typed:** Variable types must be specified at compile time (e.g., \`uint256\`, \`address\`, \`string\`). This helps in catching errors early.
*   **Object-Oriented:** Supports concepts like contracts (similar to classes), inheritance, and user-defined types (structs, enums).
*   **High-Level:** Abstracts away many of the lower-level details of the EVM, making it more developer-friendly.
*   **EVM Target:** Solidity code is compiled into bytecode that can be executed on the Ethereum Virtual Machine.
*   **Case-Sensitive:** Like JavaScript and C++.

### Why Solidity?
*   **Dominant Language:** It's the most popular and widely adopted language for smart contract development on Ethereum and other EVM-compatible blockchains (e.g., Polygon, Binance Smart Chain, Avalanche).
*   **Rich Ecosystem:** Large community support, extensive libraries (like OpenZeppelin), and mature development tools (Hardhat, Foundry, Remix).
*   **Designed for Contracts:** Includes features specifically for smart contract development, like modifiers, events, and special global variables (\`msg.sender\`, \`block.timestamp\`).

### Basic "Hello World" Contract:
The first line, \`// SPDX-License-Identifier: MIT\`, is a license identifier. It's good practice to include this to specify how your code can be used.
The second line, \`pragma solidity ^0.8.20;\`, tells the compiler which version of Solidity to use. The caret (\`^\`) means the code is compatible with versions from 0.8.20 up to (but not including) 0.9.0.

\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20; // Specifies the compiler version

// Defines a contract named 'HelloWorld'
contract HelloWorld {
    // A state variable to store a string. It's public, so Solidity automatically creates a getter function for it.
    string public greet = "Hello, Solidity learners!";

    // A public function that allows anyone to update the 'greet' state variable.
    // The '_newGreeting' parameter is of type string and stored in 'memory'.
    // 'memory' is used for variables whose lifetime is limited to a function call.
    function updateGreeting(string memory _newGreeting) public {
        greet = _newGreeting;
    }

    // A public view function to retrieve the current greeting.
    // 'view' functions do not modify the state of the contract.
    // 'returns (string memory)' specifies that it returns a string stored in memory.
    function getGreeting() public view returns (string memory) {
        return greet;
    }
}
\`\`\`

### Understanding the Example:
*   **\`contract HelloWorld { ... }\`**: This declares a contract, which is a collection of code (its functions) and data (its state) that resides at a specific address on the Ethereum blockchain.
*   **\`string public greet = "Hello, Solidity learners!";\`**: This is a **state variable**. Its value is permanently stored in the contract's storage on the blockchain. The \`public\` keyword automatically creates a "getter" function, so you can call \`greet()\` from outside the contract to read its value.
*   **\`function updateGreeting(string memory _newGreeting) public { ... }\`**: This is a function that modifies the state variable \`greet\`.
    *   \`string memory _newGreeting\`: Declares a parameter \`_newGreeting\` of type \`string\`. The \`memory\` keyword means this data is temporary and won't be saved to storage directly (unless assigned to a state variable).
    *   \`public\`: Makes the function callable from outside the contract and by other contracts.
*   **\`function getGreeting() public view returns (string memory)\`**: This is a read-only function.
    *   \`view\`: Indicates that the function does not modify the contract's state. Calling view functions does not cost gas if called externally (not from another contract transaction).
    *   \`returns (string memory)\`: Specifies that this function returns a string stored in memory.

This simple contract demonstrates the basic syntax for defining state variables and functions in Solidity. As you progress, you'll learn about more complex data types, control structures, inheritance, and security considerations.
    `,
    keywords: ['solidity', 'smart contracts', 'ethereum', 'introduction', 'evm', 'blockchain programming', 'hello world'],
    geminiPromptSeed: "Explain the core concepts of Solidity for a beginner, focusing on its purpose in blockchain development, its key characteristics, and walk through a simple 'HelloWorld' contract line by line, explaining state variables, functions, visibility (public), and data locations (memory).",
    videoEmbedUrl: "https://www.youtube.com/embed/M576WGiDBdQ",
    quiz: {
      title: "Solidity Fundamentals Quiz",
      questions: [
        {
          id: "q1-solidity-type",
          questionText: "Is Solidity a statically-typed or dynamically-typed language?",
          options: [
            { id: "q1o1", text: "Statically-typed" },
            { id: "q1o2", text: "Dynamically-typed" },
          ],
          correctOptionId: "q1o1",
          explanation: "Solidity is statically-typed, meaning variable types must be declared at compile time. This helps catch errors early."
        },
        {
          id: "q2-solidity-evm",
          questionText: "What virtual machine does Solidity code primarily target for execution?",
          options: [
            { id: "q2o1", text: "Java Virtual Machine (JVM)" },
            { id: "q2o2", text: "Ethereum Virtual Machine (EVM)" },
            { id: "q2o3", text: ".NET CLR" },
          ],
          correctOptionId: "q2o2",
          explanation: "Solidity compiles to bytecode that runs on the Ethereum Virtual Machine (EVM), the runtime environment for smart contracts on Ethereum."
        },
        {
          id: "q3-solidity-pragma",
          questionText: "What is the purpose of the 'pragma solidity' directive in a Solidity file?",
          options: [
            { id: "q3o1", text: "To import libraries." },
            { id: "q3o2", text: "To declare the contract's name." },
            { id: "q3o3", text: "To specify the compatible Solidity compiler version(s)." },
          ],
          correctOptionId: "q3o3",
          explanation: "The 'pragma solidity' directive specifies the version(s) of the Solidity compiler that the source code is written for, ensuring compatibility."
        }
      ]
    }
  },
  {
    id: 'contract-structure',
    title: 'Smart Contract Structure',
    category: 'Solidity Basics',
    level: 'Beginner',
    summary: 'Learn about the typical structure of a Solidity smart contract, including license identifiers, pragma directives, imports, and the core contract definition with its components like state variables, functions, events, and modifiers.',
    content: `A Solidity smart contract is typically organized into several distinct parts. Understanding this structure is crucial for writing clear, maintainable, and secure contracts.

### 1. SPDX License Identifier (Recommended)
   \`// SPDX-License-Identifier: MIT\`
   *   **Purpose:** Specifies the license under which the contract's source code is released (e.g., MIT, GPL-3.0). This is not enforced by the compiler but is a best practice for open-source projects to clarify usage rights.
   *   **Placement:** Usually the very first line of the Solidity file.

### 2. Pragma Directive
   \`pragma solidity ^0.8.20;\`
   *   **Purpose:** Declares the Solidity compiler version(s) the source code is compatible with.
        *   \`^0.8.20\`: Means the code is compatible with compiler versions from 0.8.20 up to (but not including) 0.9.0.
        *   \`>=0.8.0 <0.9.0\`: Another way to specify a range.
   *   **Importance:** Ensures the code is compiled with a compiler version that understands its syntax and features, preventing unexpected behavior or compilation errors due to version incompatibilities.

### 3. Import Statements (Optional)
   \`import "./MyLibrary.sol";\`
   \`import "@openzeppelin/contracts/utils/Context.sol";\`
   *   **Purpose:** Allows you to use code from other Solidity files (local or from installed libraries like OpenZeppelin). This promotes code reusability and modularity.
   *   **Types of Imports:**
        *   Local files: \`import "./AnotherContract.sol";\`
        *   NPM packages: \`import "@openzeppelin/contracts/access/Ownable.sol";\` (requires installation via npm/yarn).
        *   Importing specific symbols: \`;\`
        *   Aliasing imports: \`import "./MyLibrary.sol" as Lib;\`

### 4. Contract Definition
   This is the core of your smart contract.
   \`contract MyContract { ... }\`
   or for inheritance:
   \`import "@openzeppelin/contracts/access/Ownable.sol";\`
   \`contract MyToken is Ownable { ... }\`

   Inside the contract block, you define its members:

   **a) State Variables:**
      Variables whose values are permanently stored in the contract's storage on the blockchain.
      \`\`\`solidity
      uint256 public totalSupply;
      address public owner;
      mapping(address => uint256) public balances;
      string private secretMessage;
      \`\`\`
      *   They define the state of the contract.
      *   Modifying them costs gas.
      *   Visibility keywords (\`public\`, \`internal\`, \`private\`) control accessibility. \`public\` automatically creates a getter function.

   **b) Structs (User-Defined Types):**
      Allow you to create more complex data types by grouping several variables.
      \`\`\`solidity
      struct Voter {
          uint weight;
          bool voted;
          address delegate;
          uint vote;
      }
      mapping(address => Voter) public voters;
      \`\`\`

   **c) Enums (User-Defined Types):**
      Used to create custom types with a finite set of constant values.
      \`\`\`solidity
      enum State { Created, Locked, Inactive }
      State public currentState;
      \`\`\`

   **d) Events:**
      A way for smart contracts to communicate with the outside world (e.g., frontend applications) that something significant has happened. Events are logged on the blockchain and can be listened to.
      \`\`\`solidity
      event Transfer(address indexed _from, address indexed _to, uint256 _value);
      event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
      \`\`\`
      *   \`indexed\` parameters can be filtered by listeners.

   **e) Modifiers:**
      Reusable pieces of code that can be used to change the behavior of functions, often for validation or access control, before the function body is executed.
      \`\`\`solidity
      modifier onlyOwner() {
          require(msg.sender == owner, "Not the owner");
          _; // Indicates where the modified function's code will be inserted.
      }

      function criticalAction() public onlyOwner {
          // ... logic accessible only by the owner
      }
      \`\`\`

   **f) Constructor (Optional):**
      A special function that is executed only once when the contract is deployed. Often used to initialize state variables. It has the same name as the contract or can be declared with the \`constructor\` keyword.
      \`\`\`solidity
      constructor(uint256 _initialSupply) {
          owner = msg.sender;
          totalSupply = _initialSupply;
          balances[msg.sender] = _initialSupply;
      }
      \`\`\`

   **g) Functions:**
      Define the executable units of code within a contract. They determine how the contract behaves and how users interact with it.
      \`\`\`solidity
      function transfer(address _to, uint256 _amount) public returns (bool success) {
          require(balances[msg.sender] >= _amount, "Insufficient balance");
          balances[msg.sender] -= _amount;
          balances[_to] += _amount;
          emit Transfer(msg.sender, _to, _amount);
          return true;
      }

      function getBalance(address _account) public view returns (uint256) {
          return balances[_account];
      }
      \`\`\`
      *   Functions have visibility (\`public\`, \`private\`, \`internal\`, \`external\`).
      *   They can modify state (default), be \`view\` (read-only), or \`pure\` (neither reads from nor writes to state).
      *   They can accept parameters and return values.

### Example Illustrating Structure:
\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol"; // Example import

// This contract demonstrates a basic structure.
contract StructuredContract is Ownable { // Inheritance

    // State Variables
    uint256 public value;
    mapping(address => uint256) public userValues;

    // Struct
    struct Item {
        string name;
        uint256 price;
    }
    Item public featuredItem;

    // Event
    event ValueSet(address indexed user, uint256 newValue);

    // Modifier (using one from Ownable, but could define custom ones)
    // e.g., modifier costs(uint _amount) { require(msg.value >= _amount); _; }

    // Constructor
    constructor(uint256 _initialValue, string memory _itemName, uint256 _itemPrice) Ownable(msg.sender) {
        value = _initialValue;
        featuredItem = Item(_itemName, _itemPrice);
        // Ownable(msg.sender) initializes the owner from OpenZeppelin's Ownable contract
    }

    // Function
    function setValue(uint256 _newValue) public {
        value = _newValue;
        userValues[msg.sender] = _newValue;
        emit ValueSet(msg.sender, _newValue);
    }

    function getValue() public view returns (uint256) {
        return value;
    }

    function getFeaturedItemPrice() public view returns (uint256) {
        return featuredItem.price;
    }

    // Function using a modifier from Ownable
    function changeFeaturedItemName(string memory _newName) public onlyOwner {
        featuredItem.name = _newName;
    }
}
\`\`\`
Understanding these components and their typical arrangement is foundational to writing well-organized and effective Solidity smart contracts.
    `,
    keywords: ['solidity', 'structure', 'contract', 'state variables', 'functions', 'events', 'modifiers', 'constructor', 'pragma', 'import', 'spdx'],
    geminiPromptSeed: "Describe the standard structure of a Solidity smart contract, detailing each common component like SPDX license, pragma, imports, state variables, structs, enums, events, modifiers, constructor, and functions. Provide simple examples for each component within a contract structure.",
    videoEmbedUrl: "https://www.youtube.com/embed/YSst2j9u164",
    quiz: {
        title: "Contract Structure Quiz",
        questions: [
            {
                id: "q1-struct-spdx",
                questionText: "What is the primary purpose of the SPDX License Identifier in a Solidity file?",
                options: [
                    { id: "q1o1", text: "To specify the Solidity compiler version." },
                    { id: "q1o2", text: "To declare the contract's name." },
                    { id: "q1o3", text: "To indicate the software license under which the code is released." }
                ],
                correctOptionId: "q1o3",
                explanation: "The SPDX License Identifier (e.g., // SPDX-License-Identifier: MIT) specifies the open-source license, clarifying how others can use the code."
            },
            {
                id: "q2-struct-constructor",
                questionText: "When is the constructor of a Solidity smart contract executed?",
                options: [
                    { id: "q2o1", text: "Every time a function is called." },
                    { id: "q2o2", text: "Only once, when the contract is deployed." },
                    { id: "q2o3", text: "Whenever a state variable is updated." }
                ],
                correctOptionId: "q2o2",
                explanation: "The constructor is a special function that runs only once during the contract's deployment, typically for initialization."
            },
            {
                id: "q3-struct-event",
                questionText: "What is a primary use of 'events' in Solidity?",
                options: [
                    { id: "q3o1", text: "To perform complex mathematical calculations." },
                    { id: "q3o2", text: "To store large amounts of data permanently on the blockchain." },
                    { id: "q3o3", text: "To log significant occurrences and communicate them to external applications." }
                ],
                correctOptionId: "q3o3",
                explanation: "Events are used to emit logs to the blockchain, which external applications (like UIs) can listen to, to be notified of contract activities (e.g., a token transfer)."
            }
        ]
    }
  },
  {
    id: 'dev-tools',
    title: 'Development Tools Overview',
    category: 'Development Environment',
    level: 'Beginner',
    summary: 'Get an overview of popular tools for Solidity development like Remix, Hardhat, Foundry, and essential JavaScript libraries like Ethers.js and Web3.js for dApp interaction.',
    content: `Efficient Solidity development hinges on using the right tools. These tools help you write, test, deploy, and interact with your smart contracts. Here's an overview of some essential ones:

### 1. Integrated Development Environments (IDEs) & Frameworks

**a) Remix IDE**
*   **What it is:** A powerful, open-source, browser-based IDE for Solidity development.
*   **Key Features:**
    *   Code editor with syntax highlighting and linting.
    *   Built-in Solidity compiler.
    *   Debugger to step through code execution.
    *   Deployment to various networks (simulated JavaScript VM, testnets, mainnet via MetaMask).
    *   Plugin architecture for extended functionality (e.g., static analysis, gas profiler).
*   **Pros for Beginners:**
    *   **Easy to Start:** No local setup required, just open it in your browser.
    *   **Great for Learning:** Excellent for writing your first contracts and understanding core concepts.
    *   **Quick Prototyping:** Rapidly test ideas and small contracts.
*   **Usage Example:** You can write, compile, deploy a simple contract like \`HelloWorld\`, and interact with its functions (\`updateGreeting\`, \`getGreeting\`) all within the Remix interface.

**b) Hardhat**
*   **What it is:** A flexible and extensible Ethereum development environment based on JavaScript and Node.js.
*   **Key Features:**
    *   **Project Setup:** Easy project scaffolding (\`npx hardhat\`).
    *   **Compilation:** Seamlessly compiles Solidity code (\`npx hardhat compile\`).
    *   **Testing:** Robust testing framework using JavaScript/TypeScript (with libraries like Mocha, Chai, and Ethers.js for contract interaction). You write tests in files like \`test/my-contract-test.js\`.
    *   **Deployment Scripting:** Write scripts (e.g., \`scripts/deploy.js\`) to deploy your contracts to any network.
    *   **Hardhat Network:** A local Ethereum network designed for development. It mimics the behavior of a real network but runs locally, allowing for instant transaction mining and easy debugging (e.g., \`console.log\` in Solidity).
    *   **Mainnet Forking:** Test your contracts against the live state of the Ethereum mainnet locally.
    *   **Extensive Plugin Ecosystem:** Many plugins for additional functionalities (e.g., Etherscan verification, gas reporting, contract sizing).
*   **Workflow Example:**
    1.  \`mkdir MyHardhatProject && cd MyHardhatProject\`
    2.  \`npm init -y\`
    3.  \`npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-ethers ethers\`
    4.  \`npx hardhat\` (select "Create a JavaScript project")
    5.  Write your contract in \`contracts/MyContract.sol\`.
    6.  Write tests in \`test/MyContract.test.js\`.
    7.  \`npx hardhat test\`
    8.  Write deployment script in \`scripts/deploy.js\`.
    9.  \`npx hardhat run scripts/deploy.js --network localhost\` (after running \`npx hardhat node\`)

**c) Foundry**
*   **What it is:** A fast, portable, and modular toolkit for Ethereum application development, written in Rust.
*   **Core Components:**
    *   **Forge:** A testing framework that allows you to write your tests directly in Solidity.
    *   **Cast:** A command-line interface (CLI) tool for performing Ethereum RPC calls.
    *   **Anvil:** A local testnet node, similar to Hardhat Network.
    *   **Chisel:** A Solidity REPL (Read-Eval-Print Loop).
*   **Key Features:**
    *   **Solidity-Native Testing:** Write tests in \`.t.sol\` files using Solidity.
    *   **Performance:** Known for its speed in compilation and test execution.
    *   **Fuzz Testing:** Built-in support for fuzz testing.
*   **Workflow Example:**
    1.  Install Foundry (see official docs).
    2.  \`forge init MyFoundryProject && cd MyFoundryProject\`
    3.  Write your contract in \`src/MyContract.sol\`.
    4.  Write tests in \`test/MyContract.t.sol\`.
    5.  \`forge test\`
    6.  \`forge script script/MyContract.s.sol --rpc-url <your_rpc_url> --broadcast\` to deploy.

### 2. JavaScript Libraries for Ethereum Interaction
These libraries allow your frontend applications (or backend Node.js services) to communicate with the Ethereum blockchain and smart contracts.

**a) Ethers.js**
*   **What it is:** A complete and compact library for interacting with Ethereum.
*   **Key Features:** Wallet management, contract interaction, sending transactions, event handling.
*   **Usage Example (Frontend with MetaMask):**
    \`\`\`javascript
    import { ethers } from 'ethers';

    async function interactWithContract() {
        if (window.ethereum) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []); // Request account access
            const signer = await provider.getSigner();

            const contractAddress = "0xYourContractAddress";
            const contractABI = [ /* Your Contract ABI */ ];
            const contract = new ethers.Contract(contractAddress, contractABI, signer);

            // Read data
            const greeting = await contract.getGreeting();
            console.log("Current greeting:", greeting);

            // Send transaction
            const tx = await contract.updateGreeting("Hello from Ethers!");
            await tx.wait(); // Wait for transaction to be mined
            console.log("Greeting updated!");
        } else {
            console.error("MetaMask not detected!");
        }
    }
    \`\`\`

**b) Web3.js**
*   **What it is:** The original Ethereum JavaScript API.
*   **Key Features:** Similar to Ethers.js.
*   **Usage Example (Frontend with MetaMask):**
    \`\`\`javascript
    import Web3 from 'web3';

    async function interactWithContractWeb3() {
        if (window.ethereum) {
            const web3 = new Web3(window.ethereum);
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const accounts = await web3.eth.getAccounts();
            const userAddress = accounts[0];

            const contractAddress = "0xYourContractAddress";
            const contractABI = [ /* Your Contract ABI */ ];
            const contract = new web3.eth.Contract(contractABI, contractAddress);

            // Read data
            const greeting = await contract.methods.getGreeting().call();
            console.log("Current greeting:", greeting);

            // Send transaction
            await contract.methods.updateGreeting("Hello from Web3.js!").send({ from: userAddress });
            console.log("Greeting updated!");
        } else {
            console.error("MetaMask not detected!");
        }
    }
    \`\`\`

### 3. Other Notable Mentions
*   **Visual Studio Code (VS Code) with Solidity Extensions:** Extensions like "Solidity" by Nomic Foundation or "Solidity + Hardhat" by Juan Blanco provide syntax highlighting, linting, and framework integration.
*   **Truffle Suite:** Historically significant, includes Truffle (development environment), Ganache (local blockchain), and Drizzle (frontend library).

Choosing the right tools depends on your project's needs and preferences. Remix is great for starting, while Hardhat or Foundry are preferred for larger projects. Ethers.js is a common choice for modern dApp frontends.
    `,
    keywords: ['hardhat', 'foundry', 'remix ide', 'ethers.js', 'web3.js', 'tools', 'framework', 'javascript', 'solidity testing', 'deployment', 'local network', 'smart contract development', 'dapp development', 'vs code extension', 'truffle', 'ganache'],
    geminiPromptSeed: "Provide a comprehensive overview of essential development tools for Solidity, including Remix IDE, Hardhat, Foundry, Ethers.js, and Web3.js. Explain their primary uses, key features, example workflows or code snippets for interaction, and benefits for smart contract development.",
    videoEmbedUrl: "https://www.youtube.com/embed/ZnrfkG9aW3c",
    quiz: {
        title: "Development Tools Quiz",
        questions: [
            {
                id: "q1-devtools-remix",
                questionText: "Which development tool is browser-based and excellent for beginners to quickly write and test simple Solidity contracts without local setup?",
                options: [
                    { id: "q1o1", text: "Hardhat" },
                    { id: "q1o2", text: "Foundry" },
                    { id: "q1o3", text: "Remix IDE" }
                ],
                correctOptionId: "q1o3",
                explanation: "Remix IDE is a browser-based IDE that's very convenient for beginners as it requires no local installation to start coding and testing Solidity."
            },
            {
                id: "q2-devtools-hardhatfoundry",
                questionText: "Which of these development frameworks allows writing tests for Solidity contracts directly in Solidity itself?",
                options: [
                    { id: "q2o1", text: "Hardhat (primarily with JavaScript/TypeScript)" },
                    { id: "q2o2", text: "Foundry (using Forge)" },
                    { id: "q2o3", text: "Remix IDE (for basic interactions)" }
                ],
                correctOptionId: "q2o2",
                explanation: "Foundry, with its component Forge, allows developers to write their smart contract tests in Solidity, which is a key differentiator."
            },
            {
                id: "q3-devtools-ethers",
                questionText: "What is a primary purpose of JavaScript libraries like Ethers.js or Web3.js in dApp development?",
                options: [
                    { id: "q3o1", text: "To compile Solidity code into bytecode." },
                    { id: "q3o2", text: "To enable frontend applications to interact with smart contracts on the Ethereum blockchain." },
                    { id: "q3o3", text: "To provide a local blockchain environment for testing." }
                ],
                correctOptionId: "q3o2",
                explanation: "Ethers.js and Web3.js are JavaScript libraries that allow web applications (frontends) to connect to Ethereum nodes, read blockchain data, and send transactions to interact with smart contracts."
            }
        ]
    }
  },
  {
    id: 'erc20-tokens',
    title: 'ERC20 Token Standard',
    category: 'Token Standards',
    level: 'Intermediate',
    summary: 'Learn about the ERC20 standard for fungible tokens on Ethereum, its interface (functions and events), and see an example implementation using OpenZeppelin.',
    content: `The ERC20 token standard is a widely adopted interface that allows for the implementation of fungible tokens on the Ethereum blockchain. Fungible tokens are interchangeable – one token is equivalent to any other token of the same type (e.g., one US dollar bill is the same as another).

### Importance of ERC20:
*   **Interoperability:** Wallets, exchanges, and other decentralized applications (dApps) can support any ERC20 token by interacting with a common set of functions and events. This greatly simplifies integration.
*   **Standardization:** Provides a clear blueprint for token creators, reducing complexity and potential errors.
*   **Ecosystem Growth:** Has been fundamental to the growth of ICOs (Initial Coin Offerings), DeFi (Decentralized Finance), and many other blockchain applications.

### ERC20 Interface:
The standard defines a set of mandatory and optional functions and events that a compliant contract must implement.

**Mandatory Functions:**
*   \`name() public view returns (string memory)\`: Returns the name of the token (e.g., "MyToken"). (Technically optional in EIP-20, but universally expected).
*   \`symbol() public view returns (string memory)\`: Returns the symbol of the token (e.g., "MTK"). (Technically optional in EIP-20, but universally expected).
*   \`decimals() public view returns (uint8)\`: Returns the number of decimals the token uses (e.g., 18 for Ether). (Technically optional in EIP-20, but universally expected for divisibility).
*   \`totalSupply() public view returns (uint256)\`: Returns the total token supply.
*   \`balanceOf(address account) public view returns (uint256)\`: Returns the token balance of a specific account.
*   \`transfer(address recipient, uint256 amount) public returns (bool)\`: Transfers \`amount\` tokens to \`recipient\` from the caller's account. Must emit the \`Transfer\` event.
*   \`approve(address spender, uint256 amount) public returns (bool)\`: Allows \`spender\` to withdraw from the caller's account multiple times, up to the \`amount\`. Must emit the \`Approval\` event.
*   \`allowance(address owner, address spender) public view returns (uint256)\`: Returns the remaining amount that \`spender\` is allowed to withdraw from \`owner\`.
*   \`transferFrom(address sender, address recipient, uint256 amount) public returns (bool)\`: Transfers \`amount\` tokens from \`sender\` to \`recipient\`, provided the caller has been approved to spend on behalf of \`sender\`. Must emit the \`Transfer\` event.

**Mandatory Events:**
*   \`Transfer(address indexed from, address indexed to, uint256 value)\`: Must be emitted when tokens are transferred, including zero value transfers and minting/burning.
*   \`Approval(address indexed owner, address indexed spender, uint256 value)\`: Must be emitted on any successful call to \`approve\`.

### Example ERC20 Implementation using OpenZeppelin:
OpenZeppelin Contracts provide secure, audited, and community-vetted implementations of common standards like ERC20. It's highly recommended to use them rather than writing an ERC20 from scratch.

\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; // Optional: for minting control

// MyCustomToken inherits from OpenZeppelin's ERC20 contract
contract MyCustomToken is ERC20, Ownable {
    // Constructor:
    // - "My Custom Token" is the token name.
    // - "MCT" is the token symbol.
    // - Ownable(initialOwner) sets the deployer as the owner.
    constructor(address initialOwner) ERC20("My Custom Token", "MCT") Ownable(initialOwner) {
        // Mint initial supply to the contract deployer (owner)
        // The ERC20 constructor from OpenZeppelin doesn't mint tokens automatically.
        // Decimals are 18 by default in OpenZeppelin's ERC20.
        // To mint 1,000,000 tokens with 18 decimals: 1_000_000 * (10**18)
        _mint(initialOwner, 1000000 * (10**uint256(decimals())));
    }

    // Optional: Function to allow the owner to mint more tokens
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Optional: Function to allow users to burn their own tokens
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    // Optional: Function to allow an approved spender or owner to burn tokens from an account
    // Requires allowance if msg.sender is not the account owner.
    function burnFrom(address account, uint256 amount) public {
        // OpenZeppelin's _burn handles this if called by an operator for account.
        // For simplicity, we can restrict this or use OpenZeppelin's ERC20Burnable extension.
        // Here, we'll assume _burn is called correctly based on context (e.g., user burns their own, or owner burns).
        // A more robust burnFrom would check allowance if msg.sender != account.
        // However, OpenZeppelin's internal _spendAllowance function is not directly accessible for this logic without modification or using ERC20Burnable.
        // The ERC20Burnable extension is better for this.

        // For this example, let's use the simpler \`_burn\` if the caller is the account holder or has sufficient allowance.
        // A full \`burnFrom\` would involve decreasing allowance manually if OpenZeppelin's ERC20Burnable.sol is not used.
        if (msg.sender != account) {
            uint256 currentAllowance = allowance(account, msg.sender);
            require(currentAllowance >= amount, "ERC20: burn amount exceeds allowance");
            _approve(account, msg.sender, currentAllowance - amount); // Manually decrease allowance
        }
        _burn(account, amount);
    }

    // OpenZeppelin's ERC20 contract already implements all mandatory functions and events.
    // It also includes internal functions like _mint, _burn, _approve, _transfer.
    // The 'decimals()' function in OpenZeppelin's ERC20 defaults to 18.
    // You can override it in your contract if needed:
    // function decimals() public view virtual override returns (uint8) {
    //     return 6; // Example: USDC uses 6 decimals
    // }
}
\`\`\`

### Key Considerations:
*   **Gas Costs:** Interactions with ERC20 tokens cost gas. Complex logic can increase these costs.
*   **Security:** While the standard is well-defined, implementation errors can lead to vulnerabilities. Always use audited libraries like OpenZeppelin when possible.
*   **Extensions:** Many ERC20 extensions exist, like \`ERC20Burnable\`, \`ERC20Pausable\`, \`ERC20Votes\`, etc., provided by OpenZeppelin, which add more functionality.

Understanding ERC20 is fundamental for anyone working with tokens on Ethereum or EVM-compatible chains.
    `,
    keywords: ['erc20', 'token standard', 'fungible token', 'ethereum', 'openzeppelin', 'smart contract', 'interface', 'balanceof', 'transfer', 'approve', 'transferfrom'],
    geminiPromptSeed: "Explain the ERC20 token standard in detail. What is its purpose? List and describe all mandatory functions and events. Provide a simple Solidity example of an ERC20 token using OpenZeppelin, including minting initial supply.",
    videoEmbedUrl: "https://www.youtube.com/embed/8f1w2nbjj1c",
    quiz: {
        title: "ERC20 Token Quiz",
        questions: [
            {
                id: "q1-erc20-fungible",
                questionText: "Are ERC20 tokens typically fungible or non-fungible?",
                options: [
                    { id: "q1o1", text: "Fungible (interchangeable)" },
                    { id: "q1o2", text: "Non-fungible (unique)" }
                ],
                correctOptionId: "q1o1",
                explanation: "ERC20 tokens are fungible, meaning each token of a particular contract is identical and interchangeable with any other token of that same contract."
            },
            {
                id: "q2-erc20-transferfrom",
                questionText: "Which ERC20 function is used to allow a third party (spender) to transfer tokens on behalf of a token owner?",
                options: [
                    { id: "q2o1", text: "transfer()" },
                    { id: "q2o2", text: "approve()" },
                    { id: "q2o3", text: "transferFrom()" }
                ],
                correctOptionId: "q2o3",
                explanation: "The `transferFrom()` function allows a spender (who has been previously approved via `approve()`) to transfer tokens from an owner's account to a recipient."
            },
            {
                id: "q3-erc20-event",
                questionText: "What event MUST be emitted when tokens are successfully transferred using `transfer()` or `transferFrom()`?",
                options: [
                    { id: "q3o1", text: "Approval(address indexed owner, address indexed spender, uint256 value)" },
                    { id: "q3o2", text: "Transfer(address indexed from, address indexed to, uint256 value)" },
                    { id: "q3o3", text: "Minted(address indexed to, uint256 value)" }
                ],
                correctOptionId: "q3o2",
                explanation: "The `Transfer` event must be emitted for all token transfers, including minting (where `from` is the zero address) and burning (where `to` is the zero address)."
            }
        ]
    }
  },
  {
    id: 'nft-erc721',
    title: 'NFTs and ERC721 Standard',
    category: 'Token Standards',
    level: 'Intermediate',
    summary: 'Explore Non-Fungible Tokens (NFTs) and the ERC721 standard, which defines unique, distinguishable tokens. Understand its interface and see an example using OpenZeppelin.',
    content: `ERC721 is a standard interface for Non-Fungible Tokens (NFTs) on the Ethereum blockchain. Unlike ERC20 tokens where each token is identical (fungible), each ERC721 token is unique and has a distinct identifier (\`tokenId\`). This makes them suitable for representing ownership of unique digital or physical assets.

### What are NFTs?
*   **Unique:** Each token has a unique ID and potentially unique metadata (attributes, images, etc.).
*   **Indivisible:** Typically, an ERC721 token cannot be divided into smaller parts (though ERC1155 offers semi-fungibility).
*   **Ownable:** Each token has a specific owner.
*   **Transferable:** Ownership can be transferred from one account to another.
*   **Use Cases:** Digital art, collectibles, game items, domain names, event tickets, real estate deeds, intellectual property rights.

### ERC721 Interface:
The ERC721 standard defines several functions and events:

**Key Functions:**
*   \`balanceOf(address owner) public view returns (uint256 balance)\`: Returns the number of NFTs owned by a specific \`owner\`.
*   \`ownerOf(uint256 tokenId) public view returns (address owner)\`: Returns the owner of a specific \`tokenId\`. Throws if \`tokenId\` is not a valid NFT.
*   \`safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external payable\`: Transfers ownership of \`tokenId\` from \`from\` to \`to\`. Includes a check to ensure the recipient can receive NFTs safely (if it's a contract).
*   \`safeTransferFrom(address from, address to, uint256 tokenId) external payable\`: Simpler version of the above.
*   \`transferFrom(address from, address to, uint256 tokenId) external payable\`: Transfers ownership. Less safe than \`safeTransferFrom\` as it doesn't check if the recipient contract can handle NFTs.
*   \`approve(address to, uint256 tokenId) external payable\`: Approves an \`address\` (\`to\`) to operate on a specific \`tokenId\` on behalf of the owner. Only one address can be approved per token at a time.
*   \`getApproved(uint256 tokenId) external view returns (address operator)\`: Returns the approved address for a single \`tokenId\`.
*   \`setApprovalForAll(address operator, bool approved) external\`: Approves or revokes an \`operator\` to manage *all* of the owner's NFTs. Useful for marketplaces.
*   \`isApprovedForAll(address owner, address operator) external view returns (bool)\`: Checks if an \`operator\` is approved to manage all NFTs for an \`owner\`.
*   \`supportsInterface(bytes4 interfaceId) external view returns (bool)\`: Used for interface detection (e.g., to check if a contract implements ERC721 or ERC165).

**Key Events:**
*   \`Transfer(address indexed from, address indexed to, uint256 indexed tokenId)\`: Emitted when ownership of an NFT changes for any reason (minting, burning, transfer).
*   \`Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)\`: Emitted when an address is approved to operate on a specific \`tokenId\`.
*   \`ApprovalForAll(address indexed owner, address indexed operator, bool approved)\`: Emitted when an operator is approved or unapproved to manage all NFTs for an owner.

### ERC721 Metadata Extension (Optional but Common):
*   \`name() external view returns (string memory _name)\`: Returns the name of the NFT collection (e.g., "My Awesome NFTs").
*   \`symbol() external view returns (string memory _symbol)\`: Returns the symbol for the NFT collection (e.g., "MANFT").
*   \`tokenURI(uint256 tokenId) external view returns (string memory)\`: Returns a URI (Uniform Resource Identifier) pointing to a JSON file that contains the metadata for a specific \`tokenId\` (name, description, image, attributes, etc.). This JSON usually follows a standard schema.

### Example ERC721 Implementation using OpenZeppelin:
\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol"; // For safely incrementing token IDs

// MyCollectible inherits from OpenZeppelin's ERC721 contract
contract MyCollectible is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter; // To keep track of the next token ID to mint

    // Mapping from token ID to its metadata URI (optional if all tokens share a base URI)
    mapping(uint256 => string) private _tokenURIs;

    // Base URI for metadata if all tokens follow a pattern (e.g., "https://api.example.com/nft/")
    // string private _baseURIextended; // OpenZeppelin has _baseURI internal function now

    constructor(address initialOwner) ERC721("My Collectible", "MCO") Ownable(initialOwner) {
        // ERC721 constructor takes name and symbol
        // Ownable constructor takes the initial owner address
    }

    // Function to set the base URI for token metadata.
    // OpenZeppelin's ERC721 has an internal _setBaseURI function.
    // We can expose it via an onlyOwner function if needed or set it in constructor.
    // function setBaseURI(string memory baseURI_) public onlyOwner {
    //     _setBaseURI(baseURI_);
    // }

    // Function to mint a new NFT.
    // It assigns the NFT to 'to' and sets its metadata URI.
    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId); // Mints the NFT and assigns ownership
        _setTokenURI(tokenId, uri); // Sets the metadata URI for this specific token
    }

    // Helper function to set the token URI, usually internal or owner-only
    // OpenZeppelin's ERC721 already provides _setTokenURI internal function.
    // This is just for demonstration of how one might extend.
    function _setTokenURI(uint256 tokenId, string memory _uri) internal virtual {
        require(_exists(tokenId), "ERC721URIStorage: URI set of nonexistent token");
        _tokenURIs[tokenId] = _uri;
    }
    
    // Override to construct the token URI. Often combines a base URI with the token ID.
    // OpenZeppelin ERC721 provides a default implementation that uses an internal _baseURI().
    // If you store full URIs per token as in _tokenURIs:
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        string memory _uri = _tokenURIs[tokenId];
        if (bytes(_uri).length > 0) {
            return _uri; // Return specific URI if set
        }
        
        // If no specific URI, try to use OpenZeppelin's base URI logic (if base URI is set)
        string memory base = super.tokenURI(tokenId); 
        if (bytes(base).length > 0 && keccak256(abi.encodePacked(base)) != keccak256(abi.encodePacked(""))) { 
            return base;
        }

        return ""; // Default to empty if no specific URI and no base URI logic produced anything.
    }

}
\`\`\`

### Key Differences from ERC20:
*   **Uniqueness:** ERC721 tokens are unique; ERC20 tokens are interchangeable.
*   **Identifiers:** ERC721 uses \`tokenId\` to distinguish tokens; ERC20 balances are just amounts.
*   **No \`decimals\`:** Uniqueness means divisibility isn't a concept for individual ERC721 tokens.

ERC721 has powered the explosion of digital collectibles and art on the blockchain, creating new forms of ownership and value.
    `,
    keywords: ['nft', 'erc721', 'non-fungible token', 'collectibles', 'digital art', 'token standard', 'ethereum', 'openzeppelin', 'tokenuri', 'ownerof', 'safetransferfrom'],
    geminiPromptSeed: "Explain the ERC721 standard for NFTs. What are its key characteristics, functions (like ownerOf, safeTransferFrom, tokenURI), and events? How does it differ from ERC20? Provide a simple Solidity example using OpenZeppelin for an NFT contract with minting.",
    videoEmbedUrl: "https://www.youtube.com/embed/YT3LxlqC3oA",
    quiz: {
        title: "ERC721 NFT Quiz",
        questions: [
            {
                id: "q1-erc721-unique",
                questionText: "What is the defining characteristic of an ERC721 token compared to an ERC20 token?",
                options: [
                    { id: "q1o1", text: "It has more decimals for precision." },
                    { id: "q1o2", text: "Each token is unique and distinguishable by a tokenId." },
                    { id: "q1o3", text: "It can only be transferred by the contract owner." }
                ],
                correctOptionId: "q1o2",
                explanation: "ERC721 tokens are non-fungible, meaning each token has a unique ID (tokenId) and is distinct from other tokens of the same contract."
            },
            {
                id: "q2-erc721-tokenuri",
                questionText: "What is the primary purpose of the `tokenURI(uint256 tokenId)` function in the ERC721 metadata extension?",
                options: [
                    { id: "q2o1", text: "To set the price of the NFT." },
                    { id: "q2o2", text: "To transfer the NFT to a new owner." },
                    { id: "q2o3", text: "To return a link to a JSON file containing the NFT's metadata (name, image, attributes, etc.)." }
                ],
                correctOptionId: "q2o3",
                explanation: "The `tokenURI` function returns a URI (often an HTTP(S) or IPFS link) that points to a JSON object describing the specific NFT's attributes, including its image."
            },
            {
                id: "q3-erc721-ownerof",
                questionText: "Which ERC721 function would you call to find out who owns a specific NFT with a given `tokenId`?",
                options: [
                    { id: "q3o1", text: "balanceOf(address owner)" },
                    { id: "q3o2", text: "getApproved(uint256 tokenId)" },
                    { id: "q3o3", text: "ownerOf(uint256 tokenId)" }
                ],
                correctOptionId: "q3o3",
                explanation: "`ownerOf(tokenId)` is the standard ERC721 function that returns the address of the current owner of the specified NFT."
            }
        ]
    }
  },
  {
    id: 'gas-optimization',
    title: 'Gas Optimization Techniques',
    category: 'Advanced Solidity',
    level: 'Advanced',
    summary: 'Learn techniques to write gas-efficient Solidity code, crucial for reducing transaction costs on Ethereum. Covers data packing, minimizing storage operations, loop optimization, and more.',
    content: `Gas is the fuel for the Ethereum network. Every operation, from a simple transfer to complex contract interactions, consumes gas. Users pay gas fees (in ETH) for their transactions. Writing gas-efficient smart contracts is crucial because:
*   **Reduces Costs:** Lower gas consumption means cheaper transactions for users.
*   **Improves User Experience:** Faster confirmations (as lower gas txns might be less attractive to miners, but well-optimized code uses less overall, so complex txns are still viable).
*   **Avoids Block Gas Limit:** Complex transactions that consume too much gas might exceed the block gas limit and fail.

### Key Gas Optimization Techniques:

**1. Minimize Storage Reads and Writes (SSTORE and SLOAD):**
   *   \`SSTORE\` (writing to storage) is one of the most expensive operations. \`SLOAD\` (reading from storage) is also costly.
   *   **Technique:**
        *   Cache storage variables in memory variables if accessed multiple times within a function.
        *   Update multiple state variables in a packed way if possible.
        *   Avoid unnecessary state changes.
   \`\`\`solidity
   // Inefficient: Multiple SLOADs
   // uint256 stateVar1; 
   // uint256 stateVar2;
   // function calculateSum() public view returns (uint) {
   //     return stateVar1 + stateVar2 + stateVar1; // stateVar1 loaded twice
   // }

   // Efficient: Cache in memory
   // uint256 stateVar1; 
   // uint256 stateVar2;
   function calculateSumEfficient(uint256 stateVar1, uint256 stateVar2) public pure returns (uint) { // Assuming stateVar1, stateVar2 passed or are constants
       uint256 localStateVar1 = stateVar1; // If stateVar1 is a state variable, this SLOADs it.
       return localStateVar1 + stateVar2 + localStateVar1; // Uses memory variable
   }

   // Inefficient: Multiple SSTOREs
   // uint256 stateVarA;
   // uint256 stateVarB;
   // function updateValues(uint valA, uint valB) public {
   //     stateVarA = valA; // SSTORE
   //     stateVarB = valB; // SSTORE
   // }

   // Efficient (if logic allows, may not always be better or possible):
   // Sometimes just unavoidable if they are independent.
   // But if they are part of a struct, update struct in memory then SSTORE once.
   struct MyData { uint a; uint b; }
   MyData public myData; // State variable
   function updateMyData(uint valA, uint valB) public {
       MyData memory localData = myData; // SLOAD entire struct
       localData.a = valA;
       localData.b = valB;
       myData = localData; // Single SSTORE for the struct
   }
   \`\`\`

**2. Data Packing in Storage:**
   *   Solidity lays out state variables in storage slots of 32 bytes (256 bits). If multiple variables can fit into a single slot, the compiler will try to pack them. This can save \`SSTORE\` and \`SLOAD\` operations.
   *   **Technique:** Declare smaller data types consecutively. Order matters.
   \`\`\`solidity
   // Less efficient packing (potentially 3 slots)
   // contract Unpacked {
   //    uint64 a;
   //    uint256 b; // Will likely start a new slot
   //    uint64 c;
   // }


   // More efficient packing (b, a, c might fit in 2 slots if b is last, or a,c, then b in its own)
   // Best: a, c together, then b.
   // contract BetterPacked {
   //    uint64 a;  // Slot 0, offset 0
   //    uint64 c;  // Slot 0, offset 8 (bytes)
   //    uint256 b; // Slot 1 (starts new slot)
   // }


   // Optimal for packing a & c (1 slot used by a & c)
   contract Packed {
       uint128 val1; // Slot 0, first 128 bits
       uint128 val2; // Slot 0, next 128 bits
       // uint64 val3; // If added, would still be in Slot 0
   }
   \`\`\`

**3. Use Appropriate Data Types:**
   *   Using smaller integer types (e.g., \`uint128\`, \`uint64\`) can save storage if they fit your data range AND can be packed (see above).
   *   However, the EVM operates on 256-bit words. Using types smaller than 256 bits for calculations *within functions (memory/stack variables)* might incur extra gas for conversion unless the optimizer handles it well. For storage, packing is the primary benefit.
   *   \`bytes32\` is generally more gas-efficient than \`string\` or \`bytes\` for fixed-size data that fits.

**4. Optimize Loops:**
   *   Loops can be very gas-intensive, especially if they iterate many times or perform storage operations inside.
   *   **Techniques:**
        *   Minimize operations inside loops.
        *   Avoid loops over unbounded arrays if possible, or limit iteration count.
        *   Cache array length if accessed multiple times: \`uint len = myArray.length;\`
   \`\`\`solidity
   // Potentially expensive if data.length is large and data is storage array
   // function sumArray(uint[] storage data) public view returns (uint total) {
   //     for (uint i = 0; i < data.length; i++) { // data.length SLOADed each iteration
   //         total += data[i]; // data[i] SLOADed each iteration
   //     }
   // }

   // More efficient loop
   function sumArrayEfficient(uint[] memory data) public pure returns (uint total) {
       // Pass array as memory if it's input and not modified state
       uint len = data.length; // Cache length
       for (uint i = 0; i < len; i++) {
           total += data[i]; // If 'data' is memory, this is MLOAD, cheaper than SLOAD
       }
   }
   \`\`\`

**5. Short-Circuiting in Conditionals:**
   *   Use \`||\` (OR) and \`&&\` (AND) operators effectively. If the first condition in an \`OR\` is true, the second isn't evaluated. If the first in an \`AND\` is false, the second isn't evaluated.
   *   Place cheaper conditions first if possible.

**6. Use Modifiers Wisely:**
   *   Modifiers add to the bytecode size and execution cost. Use them for common checks, but be mindful if a check is very simple and only used once; inlining it might be cheaper. Profile to be sure.

**7. Function Visibility and Mutability:**
   *   Declare functions with the most restrictive visibility (\`private\`, \`internal\`, \`external\`, \`public\`) that serves their purpose. \`external\` can be cheaper than \`public\` if the function is only called externally because arguments are not copied to memory.
   *   Use \`view\` for functions that only read state and \`pure\` for functions that neither read nor write state. These don't cost gas if called externally (off-chain).

**8. Avoid Unnecessary Libraries or Complex Logic:**
   *   If a simple operation can be done directly, it might be cheaper than calling a library function that has overhead. However, for complex and security-critical operations (like math), well-audited libraries (e.g., OpenZeppelin's SafeMath/Math) are preferred despite minor gas overhead. (Note: Solidity 0.8+ has built-in overflow/underflow checks.)

**9. Deleting Storage Variables (Refunds):**
   *   Using \`delete myVariable;\` or setting a variable to its default zero value (e.g., \`myUint = 0;\`) can trigger a gas refund (up to a certain limit per transaction). This is part of EIP-1087.
   *   This is more relevant for cleaning up storage that's no longer needed.

**10. Use \`calldata\` for External Function Parameters:**
    *   For \`external\` functions, use \`calldata\` for reference-type parameters (arrays, structs, strings, bytes) instead of \`memory\`. \`calldata\` is read-only, non-modifiable, and avoids copying data, making it cheaper.
    \`\`\`solidity
    function processDataExternal(uint[] calldata _inputArray) external pure returns (uint) {
        // _inputArray is read-only and not copied to memory
        uint sum = 0;
        for (uint i = 0; i < _inputArray.length; i++) {
            sum += _inputArray[i];
        }
        return sum;
    }
    \`\`\`

**Tools for Gas Profiling:**
*   **Hardhat Gas Reporter:** Plugin for Hardhat that reports gas usage per function call in tests.
*   **Foundry Gas Snapshots:** Forge can generate gas snapshots during tests.
*   **Remix IDE:** Shows gas estimates before sending transactions.

Gas optimization is an ongoing process of learning and applying best practices. Always test and profile your contracts to identify bottlenecks.
    `,
    keywords: ['gas', 'optimization', 'ethereum', 'smart contracts', 'efficiency', 'sstore', 'sload', 'data packing', 'loops', 'calldata', 'gas profiler', 'solidity performance'],
    geminiPromptSeed: "List and explain at least 5 key gas optimization techniques in Solidity. For each technique, provide a brief code example illustrating an inefficient way and a more gas-efficient way to achieve a similar outcome. Discuss why minimizing storage operations is crucial.",
    videoEmbedUrl: "https://www.youtube.com/embed/V2kXgHUBgcs",
    quiz: {
        title: "Gas Optimization Quiz",
        questions: [
            {
                id: "q1-gas-sstore",
                questionText: "Which of the following operations is generally one of the most expensive in terms of gas cost in Solidity?",
                options: [
                    { id: "q1o1", text: "Reading a memory variable." },
                    { id: "q1o2", text: "Performing an arithmetic operation (e.g., addition)." },
                    { id: "q1o3", text: "Writing to a state variable (SSTORE)." }
                ],
                correctOptionId: "q1o3",
                explanation: "SSTORE, which writes data to contract storage, is one of the most gas-intensive operations. Minimizing storage writes is key to optimization."
            },
            {
                id: "q2-gas-packing",
                questionText: "What is 'data packing' in Solidity storage optimization?",
                options: [
                    { id: "q2o1", text: "Compressing function arguments before sending a transaction." },
                    { id: "q2o2", text: "Arranging multiple smaller state variables to fit into a single 256-bit storage slot." },
                    { id: "q2o3", text: "Using only `uint256` for all variables to simplify EVM operations." }
                ],
                correctOptionId: "q2o2",
                explanation: "Data packing involves ordering state variables (especially smaller types like uint128, uint64) so that the Solidity compiler can fit multiple variables into a single 32-byte storage slot, saving gas on SLOAD and SSTORE operations."
            },
            {
                id: "q3-gas-calldata",
                questionText: "For `external` functions in Solidity, what is the benefit of using `calldata` instead of `memory` for array or struct parameters?",
                options: [
                    { id: "q3o1", text: "`calldata` allows the function to modify the input array/struct directly." },
                    { id: "q3o2", text: "`calldata` is generally cheaper because it avoids copying the data from transaction payload to memory." },
                    { id: "q3o3", text: "`calldata` provides more storage space for the parameters." }
                ],
                correctOptionId: "q3o2",
                explanation: "`calldata` is a read-only data location for function arguments passed in external calls. It's more gas-efficient for reference types because it avoids an explicit copy to memory."
            }
        ]
    }
  },
   {
    id: 'security-best-practices',
    title: 'Smart Contract Security',
    category: 'Advanced Solidity',
    level: 'Advanced',
    summary: 'Understand common smart contract vulnerabilities like reentrancy, integer overflows, front-running, and learn best practices such as using audited libraries, the Checks-Effects-Interactions pattern, and thorough testing to write secure contracts.',
    content: `Smart contract security is paramount in blockchain development. Vulnerabilities can lead to significant financial losses and loss of trust. A defense-in-depth approach, combining best practices, audits, and thorough testing, is essential.

### Common Smart Contract Vulnerabilities:

**1. Reentrancy Attacks:**
   *   **Description:** Occurs when an external contract call is made before an internal state change is finalized. The external contract can then call back ("re-enter") the original contract before its state is updated, potentially draining funds or manipulating logic.
   *   **Example (Conceptual):**
     \`\`\`solidity
     // Vulnerable contract
     // mapping(address => uint) public balances;
     // function withdraw() public {
     //     uint amount = balances[msg.sender];
     //     require(amount > 0);
     //     (bool success, ) = msg.sender.call{value: amount}(""); // External call
     //     require(success, "Transfer failed.");
     //     balances[msg.sender] = 0; // State change AFTER external call - VULNERABLE!
     // }
     \`\`\`
     An attacker's contract, upon receiving ETH via \`.call\`, could immediately call \`withdraw()\` again before \`balances[msg.sender]\` is set to 0.
   *   **Mitigation:**
        *   **Checks-Effects-Interactions Pattern:** Perform checks (e.g., \`require\`), then make state changes (effects), and *then* interact with external contracts.
        *   **Reentrancy Guard (Mutex):** Use a modifier (like OpenZeppelin's \`ReentrancyGuard\`) to prevent a function from being re-entered while it's already executing.
     \`\`\`solidity
     // Patched with Checks-Effects-Interactions
     // mapping(address => uint) public balances; // Assume this exists
     // function withdrawSafe() public {
     //     uint amount = balances[msg.sender];
     //     require(amount > 0, "No balance");
     //     balances[msg.sender] = 0; // Effect: State change BEFORE external call
     //     (bool success, ) = msg.sender.call{value: amount}("");
     //     require(success, "Transfer failed.");
     //     // If transfer fails, consider reverting the state change or other error handling
     // }
     \`\`\`

**2. Integer Overflow and Underflow:**
   *   **Description:** Occurs when an arithmetic operation results in a number that is outside the range of the variable's data type (e.g., \`uint8\` can hold 0-255; 255 + 1 would wrap to 0 without checks).
   *   **Mitigation:**
        *   **Solidity 0.8.0+:** Built-in overflow/underflow checks. Operations will revert by default. This is a major security improvement.
        *   **Older Solidity Versions (<0.8.0):** Use SafeMath libraries (like OpenZeppelin's \`SafeMath\`) which provide functions (\`add\`, \`sub\`, \`mul\`, \`div\`) that check for overflows/underflows.

**3. Front-Running (Transaction-Ordering Dependence):**
   *   **Description:** An attacker observes a transaction in the mempool (where pending transactions wait to be mined) and submits their own transaction with a higher gas price to get it mined first, thereby exploiting the original transaction's intent.
   *   **Example:** A decentralized exchange where an attacker sees a large buy order and places their buy order just before it, then sells after the original order pushes up the price.
   *   **Mitigation:**
        *   **Commit-Reveal Schemes:** Users first submit a hash of their intended action (commit), then later reveal the actual action.
        *   **Batching Transactions:** Aggregate multiple actions into one.
        *   **Setting Slippage Limits:** In DEXs, users can specify the maximum price change they are willing to tolerate.
        *   Not always fully preventable but can be made harder or less profitable.

**4. Oracle Manipulation:**
   *   **Description:** If a smart contract relies on external data (e.g., price feeds) from an oracle, and that oracle can be manipulated or provides inaccurate data, the contract's logic can be exploited.
   *   **Mitigation:**
        *   **Use Decentralized Oracles:** Rely on oracles that aggregate data from multiple sources (e.g., Chainlink).
        *   **Time-Weighted Average Prices (TWAP):** Use TWAPs instead of spot prices for critical operations to smooth out short-term manipulations.
        *   **Implement Sanity Checks:** Validate oracle data against reasonable bounds.

**5. Gas Limit Issues / Denial of Service (DoS):**
   *   **Description:**
        *   **Block Gas Limit DoS:** Operations on unbounded arrays or complex logic that can be made to consume excessive gas by an attacker, potentially hitting the block gas limit and causing transactions to fail.
        *   **Unexpected Revert DoS:** A contract relies on an external call that an attacker can cause to revert, thereby blocking further execution of the original contract's function.
   *   **Mitigation:**
        *   Avoid loops over arrays that can be artificially inflated by users.
        *   Favor pull-over-push patterns for payments (users withdraw funds rather than the contract sending to many).
        *   Ensure external calls are to trusted contracts or handle potential reverts gracefully.

**6. Timestamp Dependence:**
   *   **Description:** Relying on \`block.timestamp\` for critical logic can be risky as miners have some (limited) ability to manipulate it.
   *   **Mitigation:**
        *   Do not use \`block.timestamp\` for generating randomness or as the sole condition for critical state changes.
        *   Use it for longer-term conditions where a few seconds/minutes of variance don't matter.

**7. Short Address Attack (Less common now with better libraries):**
   *   **Description:** If a function takes an \`address\` and a \`uint\` (e.g., in ERC20 \`transfer(address to, uint256 amount)\`), and an attacker provides an address that's shorter than 20 bytes, the EVM might pad the address with zeros from the following \`amount\` parameter, leading to incorrect behavior.
   *   **Mitigation:** Modern wallets and libraries usually validate address lengths. Ensure your contract or frontend validates inputs.

### Security Best Practices:

1.  **Use Audited Libraries:** Leverage well-tested and audited libraries like OpenZeppelin Contracts for common functionalities (ERC20, ERC721, Ownable, ReentrancyGuard, SafeMath).
2.  **Checks-Effects-Interactions Pattern:** Always validate conditions, then update internal state, and *only then* interact with external contracts.
3.  **Thorough Testing:** Write comprehensive unit tests, integration tests, and consider fuzz testing and formal verification for critical contracts.
4.  **Code Reviews & Audits:** Have multiple developers review the code. For high-value contracts, obtain professional third-party security audits.
5.  **Keep it Simple (KISS Principle):** Complex code is harder to reason about and more prone to bugs.
6.  **Fail Safely:** Ensure contracts behave predictably and safely even when encountering errors or unexpected inputs (e.g., by reverting).
7.  **Manage Access Control:** Use patterns like \`Ownable\` or role-based access control to restrict sensitive functions.
8.  **Stay Updated:** Follow security advisories, new attack vectors, and evolving best practices (e.g., Solidity versions, EIPs).
9.  **Use Static Analysis Tools:** Tools like Slither, Mythril, Securify can help automatically detect potential vulnerabilities.
10. **Consider Gas Limits and Potential DoS Vectors.**

Security is an ongoing process, not a one-time checklist. A proactive and vigilant approach is essential.
    `,
    keywords: ['security', 'vulnerabilities', 'reentrancy', 'integer overflow', 'front-running', 'oracle manipulation', 'audits', 'openzeppelin', 'checks-effects-interactions', 'slither', 'mythril', 'smart contract audit'],
    geminiPromptSeed: "Describe at least 3 common smart contract vulnerabilities (e.g., reentrancy, integer overflow, front-running) with brief explanations and how to mitigate them. Also, list 3 general best practices for writing secure Solidity code.",
    videoEmbedUrl: "https://www.youtube.com/embed/gL3MM9AdxS4",
    quiz: {
        title: "Smart Contract Security Quiz",
        questions: [
            {
                id: "q1-sec-reentrancy",
                questionText: "What is the primary defense against reentrancy attacks in Solidity?",
                options: [
                    { id: "q1o1", text: "Using only `internal` functions." },
                    { id: "q1o2", text: "Implementing the Checks-Effects-Interactions pattern and/or using a reentrancy guard." },
                    { id: "q1o3", text: "Increasing the gas limit for transactions." }
                ],
                correctOptionId: "q1o2",
                explanation: "The Checks-Effects-Interactions pattern (update state before external calls) and reentrancy guard modifiers are key defenses against reentrancy."
            },
            {
                id: "q2-sec-overflow",
                questionText: "How does Solidity version 0.8.0 and later help prevent integer overflow/underflow vulnerabilities by default?",
                options: [
                    { id: "q2o1", text: "It automatically converts all integers to strings." },
                    { id: "q2o2", text: "It includes built-in checks that cause transactions to revert if an overflow or underflow occurs." },
                    { id: "q2o3", text: "It limits the maximum value of any integer to 128 bits." }
                ],
                correctOptionId: "q2o2",
                explanation: "Solidity 0.8.0+ incorporates default arithmetic overflow and underflow checks, causing a revert if such conditions are met, which largely mitigates the need for external SafeMath libraries for basic arithmetic."
            },
            {
                id: "q3-sec-openzeppelin",
                questionText: "Why is using libraries like OpenZeppelin Contracts generally recommended for common functionalities (e.g., ERC20, Ownable)?",
                options: [
                    { id: "q3o1", text: "They are always the most gas-efficient implementations." },
                    { id: "q3o2", text: "They are community-vetted, audited, and implement standard interfaces, reducing the risk of introducing common vulnerabilities." },
                    { id: "q3o3", text: "They allow developers to write contracts in JavaScript instead of Solidity." }
                ],
                correctOptionId: "q3o2",
                explanation: "OpenZeppelin Contracts provide battle-tested, audited implementations of common standards and security utilities, helping developers avoid reinventing the wheel and introducing common bugs."
            }
        ]
    }
  },
  {
    id: 'defi-concepts',
    title: 'Intro to DeFi Concepts',
    category: 'Decentralized Finance (DeFi)',
    level: 'Intermediate',
    summary: 'Get an introduction to core concepts in Decentralized Finance (DeFi), including lending/borrowing, DEXs, yield farming, stablecoins, and oracles, with examples.',
    content: `Decentralized Finance (DeFi) refers to a rapidly growing ecosystem of financial applications built on blockchain technology, primarily Ethereum. DeFi aims to recreate traditional financial systems (like lending, borrowing, trading, insurance) in an open, permissionless, and transparent manner, without relying on central intermediaries.

### Core DeFi Concepts & Primitives:

**1. Lending & Borrowing Protocols:**
   *   **Concept:** Allow users to lend their crypto assets to earn interest or borrow assets by providing collateral.
   *   **Mechanism:** Typically use smart contracts to manage loan terms, interest rates (often algorithmically determined based on supply/demand), and collateralization ratios. Over-collateralization is common (e.g., deposit $150 worth of ETH to borrow $100 worth of DAI).
   *   **Examples:**
        *   **Aave:** A decentralized lending and borrowing protocol where users can lend various assets to earn yield and borrow assets by providing collateral. Supports features like flash loans.
        *   **Compound Finance:** Similar to Aave, allows users to lend and borrow a range of cryptocurrencies. Users who supply assets receive cTokens (e.g., cETH, cDAI) representing their share in the lending pool.
   *   **Benefit:** Access to liquidity, earning passive income on holdings.

**2. Decentralized Exchanges (DEXs):**
   *   **Concept:** Platforms that allow users to trade cryptocurrencies directly with each other (peer-to-peer) without a central custodian holding their funds.
   *   **Mechanism (Common Type - Automated Market Makers - AMMs):**
        *   AMMs use liquidity pools (pairs of tokens supplied by users called Liquidity Providers - LPs) and mathematical formulas (e.g., \`x * y = k\` for Uniswap V2) to determine token prices.
        *   LPs earn trading fees from trades happening in their pool.
   *   **Examples:**
        *   **Uniswap:** A leading AMM-based DEX. Users can swap tokens or provide liquidity.
        *   **Sushiswap:** A fork of Uniswap with additional features and community governance.
        *   **Curve Finance:** Specializes in stablecoin swaps, aiming for low slippage.
   *   **Benefit:** User custody of funds, permissionless listing of tokens, transparency.

**3. Yield Farming & Liquidity Mining:**
   *   **Concept:** Strategies to maximize returns on crypto assets by leveraging different DeFi protocols.
   *   **Yield Farming:** Moving assets between various lending protocols or liquidity pools to find the highest interest rates or rewards.
   *   **Liquidity Mining:** A specific type of yield farming where users are rewarded (often with the protocol's native governance token) for providing liquidity to a DEX or lending protocol. This bootstraps liquidity for the protocol.
   *   **Risk:** Can be complex, involves smart contract risks, impermanent loss (for LPs in AMMs).
   *   **Example:** A user might supply ETH and DAI to a Uniswap liquidity pool. They earn trading fees. Additionally, the protocol might offer its own governance tokens as a reward for being an LP. The user might then take these governance tokens and stake them elsewhere for more rewards.

**4. Stablecoins:**
   *   **Concept:** Cryptocurrencies designed to maintain a stable value, typically pegged to a fiat currency (like USD) or other assets.
   *   **Purpose:** Provide a stable medium of exchange and store of value within the volatile crypto ecosystem, facilitating trading and DeFi interactions.
   *   **Types:**
        *   **Fiat-Collateralized:** Backed by fiat currency held in reserves (e.g., USDC, USDT). Centralized element of trust in the issuer.
        *   **Crypto-Collateralized:** Backed by other cryptocurrencies held as collateral in smart contracts (e.g., DAI, which is over-collateralized by assets like ETH, WBTC). More decentralized.
        *   **Algorithmic (Non-Collateralized/Seigniorage):** Attempt to maintain peg through algorithms that expand or contract supply. Historically more volatile and risky.
   *   **Importance:** Essential for DeFi as they reduce volatility risk in lending, borrowing, and trading.

**5. Oracles:**
   *   **Concept:** Services that provide external data (off-chain data) to smart contracts on the blockchain (on-chain). Blockchains themselves cannot directly access real-world information.
   *   **Purpose:** Enable smart contracts to execute based on real-world events and data (e.g., price of ETH/USD, weather conditions, sports results).
   *   **Challenge:** The "Oracle Problem" - how to ensure the external data provided is accurate, reliable, and tamper-proof.
   *   **Examples:**
        *   **Chainlink:** A decentralized oracle network that provides reliable and secure data feeds from various sources to smart contracts. It uses multiple independent node operators and data providers.
   *   **Importance:** Crucial for many DeFi applications, especially those involving asset pricing, derivatives, and insurance.

**6. Wrapped Assets:**
   *   **Concept:** Tokens that represent an asset from another blockchain on a different blockchain. For example, Wrapped Bitcoin (WBTC) is an ERC20 token on Ethereum that is pegged 1:1 to Bitcoin.
   *   **Purpose:** Allows assets like Bitcoin to be used in Ethereum's DeFi ecosystem.
   *   **Mechanism:** Typically involves a custodian holding the original asset and minting the wrapped version.

**7. DAOs (Decentralized Autonomous Organizations):**
    *   **Concept:** Organizations represented by rules encoded as smart contracts. Often governed by holders of a native governance token who can vote on proposals.
    *   **Purpose:** Manage and upgrade DeFi protocols, control treasuries, and make collective decisions in a decentralized manner.

DeFi is a rapidly evolving space offering innovative financial tools, but it also comes with risks, including smart contract vulnerabilities, impermanent loss, and regulatory uncertainty.
    `,
    keywords: ['defi', 'dex', 'lending', 'borrowing', 'yield farming', 'liquidity mining', 'stablecoins', 'oracles', 'aave', 'compound', 'uniswap', 'chainlink', 'wrapped assets', 'dao'],
    geminiPromptSeed: "Explain the core concepts of DeFi for someone new to the space. Cover lending/borrowing (e.g., Aave/Compound), DEXs (e.g., Uniswap), yield farming/liquidity mining, stablecoins (types and examples like DAI/USDC), and the role of oracles (e.g., Chainlink).",
    videoEmbedUrl: "https://www.youtube.com/embed/17QRFlmln1A",
    quiz: {
        title: "DeFi Concepts Quiz",
        questions: [
            {
                id: "q1-defi-dex",
                questionText: "What is a primary characteristic of a Decentralized Exchange (DEX) like Uniswap?",
                options: [
                    { id: "q1o1", text: "It requires users to deposit funds into an account controlled by a central company." },
                    { id: "q1o2", text: "It uses a traditional order book managed by a central server." },
                    { id: "q1o3", text: "It allows users to trade tokens directly from their wallets using liquidity pools, often via an Automated Market Maker (AMM) model." }
                ],
                correctOptionId: "q1o3",
                explanation: "DEXs, especially AMMs like Uniswap, enable peer-to-peer trading using liquidity pools, allowing users to retain custody of their assets."
            },
            {
                id: "q2-defi-stablecoin",
                questionText: "What is the main purpose of stablecoins (e.g., DAI, USDC) in the DeFi ecosystem?",
                options: [
                    { id: "q2o1", text: "To provide high-yield investment opportunities with guaranteed returns." },
                    { id: "q2o2", text: "To offer a store of value and medium of exchange with low volatility, typically pegged to a fiat currency." },
                    { id: "q2o3", text: "To represent unique digital collectibles." }
                ],
                correctOptionId: "q2o2",
                explanation: "Stablecoins aim to maintain a stable value (e.g., $1 USD) and are crucial in DeFi for reducing volatility in trading, lending, and borrowing."
            },
            {
                id: "q3-defi-oracle",
                questionText: "Why are oracles, like Chainlink, necessary for many DeFi smart contracts?",
                options: [
                    { id: "q3o1", text: "To store user identities and perform KYC checks." },
                    { id: "q3o2", text: "To provide smart contracts with reliable external (off-chain) data, such as asset prices or real-world event outcomes." },
                    { id: "q3o3", text: "To directly execute trades on centralized exchanges." }
                ],
                correctOptionId: "q3o2",
                explanation: "Blockchains cannot natively access off-chain data. Oracles act as bridges, securely providing external information (like current market prices) to smart contracts, which is essential for many DeFi applications."
            }
        ]
    }
  },
  {
    id: 'advanced-defi-strategies',
    title: 'Advanced DeFi Strategies',
    category: 'Decentralized Finance (DeFi)',
    level: 'Advanced',
    summary: 'Explore more complex strategies in DeFi, including composability, flash loans, understanding impermanent loss, risk management, and the role of DAOs and governance tokens.',
    content: `Beyond basic lending, borrowing, and swapping, advanced DeFi strategies involve leveraging the composability of protocols to create sophisticated financial maneuvers. These often come with higher potential rewards but also increased risks.

### 1. DeFi Composability ("Money Legos"):
   *   **Concept:** DeFi protocols are like "money legos" – they are open, interoperable, and can be combined to build more complex applications or strategies. One protocol's output (e.g., a liquidity provider token, a yield-bearing token) can become the input for another.
   *   **Example Strategy:**
        1.  Supply ETH to Aave to borrow DAI (a stablecoin).
        2.  Use the borrowed DAI to provide liquidity to a DAI-USDC pool on Curve Finance, earning CRV tokens and trading fees.
        3.  Stake the CRV tokens to earn more rewards or participate in governance.
        4.  The LP tokens from Curve might themselves be usable as collateral elsewhere (though this increases risk).
   *   **Benefit:** Potential for amplified returns by earning yield from multiple sources simultaneously.
   *   **Risk:** Increased complexity, compounded smart contract risk (if one protocol in the chain fails, the whole strategy can unravel), higher gas costs.

### 2. Flash Loans:
   *   **Concept:** Uncollateralized loans that must be borrowed and repaid within the *same* Ethereum transaction. If the loan (plus a small fee) is not repaid by the end of the transaction, the entire transaction (including the loan) reverts as if it never happened.
   *   **Providers:** Protocols like Aave, dYdX, Uniswap (via V3 flash swaps).
   *   **Use Cases:**
        *   **Arbitrage:** Borrow a large sum, buy an asset on DEX A where it's cheap, sell it on DEX B where it's expensive, repay the loan + fee, and pocket the difference – all in one atomic transaction.
        *   **Collateral Swaps:** Quickly change the collateral backing a loan on a lending protocol without needing to provide additional capital upfront. For example, borrow DAI, use it to pay back a DAI loan collateralized by ETH, withdraw ETH, use ETH to buy WBTC, deposit WBTC as new collateral, and take out a new DAI loan to repay the flash loan.
        *   **Self-Liquidation:** Efficiently close out a collateralized debt position.
   *   **How it's possible:** The atomicity of Ethereum transactions. Smart contracts can execute a series of actions, and if any step fails (including repaying the flash loan), the whole set of actions is rolled back.
   *   **Risk:** While "risk-free" for the lender (due to atomic repayment), they can be used in complex exploits if a protocol has vulnerabilities related to price manipulation or reentrancy when interacting with flash loan-powered transactions.

### 3. Impermanent Loss (IL):
   *   **Concept:** A potential risk for Liquidity Providers (LPs) in Automated Market Maker (AMM) DEXs (like Uniswap). It's the difference in value between holding assets in an LP position versus simply holding those assets in a wallet.
   *   **Cause:** When the relative prices of the two tokens in a liquidity pool change, the AMM's formula rebalances the pool. If an LP withdraws liquidity, they might receive a different ratio of tokens than they initially deposited, and the total USD value of these withdrawn tokens might be less than if they had just held the original tokens.
   *   **When it's significant:** More pronounced when there's high volatility and one token in the pair significantly outperforms the other.
   *   **Mitigation/Compensation:**
        *   **Trading Fees:** LPs earn trading fees, which can offset or outweigh impermanent loss.
        *   **Liquidity Mining Rewards:** Additional token rewards can also compensate.
        *   **Concentrated Liquidity (e.g., Uniswap V3):** Allows LPs to provide liquidity within specific price ranges, potentially increasing fee capture and capital efficiency, but also making IL management more active.
        *   **Stablecoin Pools:** Pools with two stablecoins (or assets with very low relative volatility) experience minimal IL.
   *   **Note:** It's "impermanent" because if the token prices revert to their original ratio when the LP deposited, the loss disappears (ignoring fees/rewards). However, if prices don't revert, it becomes a permanent loss upon withdrawal.

### 4. Risk Management in DeFi:
   *   **Smart Contract Risk:** Bugs or vulnerabilities in protocol code (always a primary concern). Mitigation: Use audited protocols, diversify, understand the code if possible.
   *   **Oracle Risk:** Reliance on oracles for price feeds. Manipulation can lead to incorrect liquidations. Mitigation: Use decentralized oracles like Chainlink.
   *   **Liquidation Risk:** If collateral value drops below a certain threshold in lending protocols, it can be liquidated. Mitigation: Monitor collateralization ratios, add more collateral if needed.
   *   **Regulatory Risk:** The DeFi space is still evolving, and future regulations are uncertain.
   *   **Systemic Risk:** Interconnectedness of protocols means a failure in one major protocol could have cascading effects.

### 5. Governance Tokens and DAOs (Decentralized Autonomous Organizations):
   *   **Governance Tokens:** Many DeFi protocols issue tokens (e.g., UNI, AAVE, COMP, CRV) that grant holders voting rights on proposals related to the protocol's development, upgrades, fee changes, treasury management, etc.
   *   **DAOs:** These tokens enable decentralized governance through DAOs. Token holders can create proposals and vote on them using their tokens.
   *   **Purpose:** To decentralize control and decision-making power over a protocol, aligning incentives between users and the protocol's long-term success.
   *   **Challenges:** Voter apathy, plutocracy (whales having too much influence), complexity of governance.

Advanced DeFi strategies offer powerful tools but require a deep understanding of the underlying mechanics, risks, and the specific protocols involved. Continuous learning and caution are essential.
    `,
    keywords: ['advanced defi', 'flash loans', 'impermanent loss', 'dao', 'governance tokens', 'composability', 'money legos', 'risk management', 'arbitrage', 'collateral swap', 'liquidity provision'],
    geminiPromptSeed: "Discuss advanced DeFi strategies like composability ('money legos'), flash loans (use cases and mechanism), and impermanent loss (explanation and mitigation). Also, touch upon risk management in DeFi and the role of DAOs/governance tokens.",
    videoEmbedUrl: "https://www.youtube.com/embed/L-p_DC_qOAU",
    quiz: {
        title: "Advanced DeFi Quiz",
        questions: [
            {
                id: "q1-advdefi-flashloan",
                questionText: "What is a defining characteristic of a flash loan in DeFi?",
                options: [
                    { id: "q1o1", text: "It requires a large amount of collateral." },
                    { id: "q1o2", text: "It must be borrowed and repaid within the same blockchain transaction." },
                    { id: "q1o3", text: "It can only be used to buy NFTs." }
                ],
                correctOptionId: "q1o2",
                explanation: "Flash loans are uncollateralized loans that are atomically borrowed and repaid within a single transaction. If not repaid, the entire transaction reverts."
            },
            {
                id: "q2-advdefi-il",
                questionText: "What is impermanent loss in the context of providing liquidity to an Automated Market Maker (AMM) DEX?",
                options: [
                    { id: "q2o1", text: "The loss of funds due to a smart contract bug in the AMM." },
                    { id: "q2o2", text: "The opportunity cost where the value of your LP position is less than if you had simply held the original tokens, due to price divergence of the token pair." },
                    { id: "q2o3", text: "The fees paid to the AMM for swapping tokens." }
                ],
                correctOptionId: "q2o2",
                explanation: "Impermanent loss occurs when the relative prices of tokens in an LP shift, causing the value of the LP tokens to be less than if the liquidity provider had just held the assets separately. Trading fees and rewards can offset this."
            },
            {
                id: "q3-advdefi-composability",
                questionText: "What does 'composability' or 'money legos' refer to in DeFi?",
                options: [
                    { id: "q3o1", text: "The process of breaking down complex financial instruments into simpler parts." },
                    { id: "q3o2", text: "The ability of different DeFi protocols to interoperate and be combined, allowing outputs from one protocol to be used as inputs for another." },
                    { id: "q3o3", text: "A specific type of cryptographic algorithm used to secure DeFi transactions." }
                ],
                correctOptionId: "q3o2",
                explanation: "Composability means DeFi protocols are like building blocks ('legos') that can be combined in various ways to create new financial applications or strategies, enhancing innovation."
            }
        ]
    }
  },
  {
    id: 'solidity-mastery',
    title: 'Path to Solidity Mastery',
    category: 'Mastery Path',
    level: 'Master',
    summary: 'Outline concepts and areas for achieving mastery in Solidity development, including deep EVM knowledge, advanced design patterns, formal verification, Layer 2 solutions, and continuous learning in the rapidly evolving ecosystem.',
    content: `Achieving mastery in Solidity and smart contract development is an ongoing journey that extends beyond basic syntax and common patterns. It involves a deep understanding of the Ethereum Virtual Machine (EVM), nuanced design choices, cutting-edge technologies, and a commitment to security and efficiency.

### Key Areas for Solidity Mastery:

**1. Deep EVM Knowledge:**
   *   **Opcodes and Execution Flow:** Understand how Solidity compiles down to EVM opcodes (e.g., \`SSTORE\`, \`SLOAD\`, \`CALL\`, \`DELEGATECALL\`, \`STATICCALL\`) and how the EVM executes bytecode. This is crucial for advanced gas optimization and debugging.
   *   **Memory, Storage, and Stack:** Have a precise mental model of how data is stored and manipulated in these different EVM locations and the gas implications of each.
   *   **Gas Calculation Nuances:** Understand the gas costs of various opcodes and how they combine in complex functions.
   *   **Transaction Lifecycle:** Deeply understand how transactions are processed, from mempool to block inclusion and state changes.

**2. Yul (Assembly Language):**
   *   **Concept:** Yul is an intermediate assembly-like language that can be compiled to EVM bytecode. Solidity itself can compile to Yul before bytecode.
   *   **Purpose:** Writing parts of contracts in Yul can allow for fine-grained control over EVM operations, leading to significant gas savings in specific, performance-critical scenarios. It's also used for writing highly optimized libraries.
   *   **Usage:** Inline assembly blocks (\`assembly { ... }\`) within Solidity.
   \`\`\`solidity
   // Example: Highly optimized function to get chain ID using Yul
   function getChainId() public view returns (uint256 id) {
       assembly {
           id := chainid() // chainid() is an EVM opcode
       }
   }
   \`\`\`
   *   **Caution:** Writing Yul is complex and error-prone. It bypasses many of Solidity's safety checks. Use only when necessary and with extreme care.

**3. Advanced Design Patterns & Architectures:**
   *   **Upgradability Patterns:**
        *   **Proxy Contracts (e.g., Transparent, UUPS - EIP-1822):** Allow smart contract logic to be updated after deployment without changing the contract address (which stores the state). Involves a proxy contract (stable address) that delegates calls to an implementation contract (logic).
        *   **Diamond Standard (EIP-2535):** A more flexible proxy pattern allowing a single contract address to use logic from multiple implementation contracts (facets), enabling modular upgrades and overcoming contract size limits.
   *   **Metamorphic Contracts:** Contracts that can change their code at a given address through specific self-destruct and recreate mechanisms (complex and rare).
   *   **State Machines:** Designing contracts that transition through well-defined states.
   *   **Minimal Proxy (EIP-1167):** A very gas-efficient way to deploy many instances of the same contract logic. Each instance is a small clone that delegates calls to a master implementation.
   *   **Data Segregation Patterns:** Separating logic contracts from data storage contracts for more flexible upgrades or data management.

**4. Advanced Testing Methodologies:**
   *   **Fuzz Testing:** Automatically generating a wide range of random inputs to find edge cases and unexpected behaviors. Tools: Foundry's built-in fuzzer, Echidna.
   *   **Formal Verification:** Mathematically proving that a smart contract's code behaves according to a formal specification. Tools: Certora Prover, SMTChecker (built into Solidity compiler). This is highly specialized and often used for critical, high-value contracts.
   *   **Invariant Testing (Property-Based Testing):** Defining properties or invariants that should always hold true for your contract state, regardless of the sequence of valid operations. Tests then try to find counterexamples. Foundry excels at this.
   *   **Gas Profiling and Optimization in Depth:** Using tools to meticulously analyze gas usage opcode by opcode.

**5. Layer 2 (L2) Scaling Solutions:**
   *   **Understanding L2s:** Deep knowledge of how different L2 solutions work (Optimistic Rollups like Optimism & Arbitrum, zk-Rollups like zkSync & StarkNet, Sidechains, State Channels).
   *   **Developing for L2s:** Understanding the nuances of deploying and interacting with contracts on L2s, including differences in gas models, finality, and communication bridges to Layer 1 (L1).
   *   **Cross-Chain Communication:** Understanding and implementing secure bridges or protocols for moving assets and data between L1 and L2, or between different L2s.

**6. Security in Extreme Depth:**
   *   **Staying Ahead of New Vulnerabilities:** The landscape of smart contract exploits is constantly evolving. Mastery requires continuous learning about new attack vectors and defensive techniques.
   *   **Economic Exploit Analysis:** Understanding how attackers can exploit economic incentives or design flaws within a protocol, not just code bugs.
   *   **Cryptography Fundamentals:** A solid understanding of the cryptographic primitives underpinning blockchain (hashes, signatures, encryption) helps in reasoning about security.

**7. Contribution to Standards and Open Source:**
   *   Engaging with Ethereum Improvement Proposals (EIPs).
   *   Contributing to widely used open-source libraries (e.g., OpenZeppelin) or development tools.

**8. Protocol Design and Mechanism Design:**
   *   Beyond just coding, understanding how to design robust and incentive-compatible DeFi protocols or other blockchain-based systems.

**Continuous Learning and Adaptation:**
   The blockchain space, especially Ethereum and Solidity, evolves rapidly. New EIPs, Solidity versions, L2 technologies, and DeFi primitives emerge constantly. A commitment to continuous learning through documentation, research papers, community discussions, and hands-on experimentation is vital for mastery.

Mastery is not a fixed destination but a continuous pursuit of deeper knowledge, better practices, and the ability to innovate securely and efficiently in a complex and dynamic environment.
    `,
    keywords: ['mastery', 'evm internals', 'yul', 'assembly', 'design patterns', 'proxy contracts', 'diamond standard', 'upgradability', 'formal verification', 'fuzz testing', 'layer 2', 'rollups', 'optimism', 'arbitrum', 'zksync', 'advanced security', 'protocol design'],
    geminiPromptSeed: "Outline the key areas one needs to focus on to achieve mastery in Solidity development. Discuss deep EVM knowledge (opcodes, memory/storage), Yul/assembly, advanced design patterns (like proxies/diamonds for upgradability), advanced testing (fuzzing, formal verification), Layer 2 solutions, and the importance of continuous learning.",
    videoEmbedUrl: "https://www.youtube.com/embed/Uc92pxLhVl0", 
    quiz: {
        title: "Solidity Mastery Concepts Quiz",
        questions: [
            {
                id: "q1-mastery-yul",
                questionText: "What is Yul, and why might an advanced Solidity developer use it?",
                options: [
                    { id: "q1o1", text: "Yul is a high-level functional programming language for designing UI components." },
                    { id: "q1o2", text: "Yul is an intermediate assembly-like language for the EVM, used for fine-grained control and gas optimization in critical code sections." },
                    { id: "q1o3", text: "Yul is a testing framework specifically for smart contract GUIs." }
                ],
                correctOptionId: "q1o2",
                explanation: "Yul is an EVM assembly language. Advanced developers might use inline assembly (Yul) for highly optimized code sections where direct EVM control is needed for maximum gas efficiency, though it's complex and risky."
            },
            {
                id: "q2-mastery-proxy",
                questionText: "What is the primary purpose of using Proxy patterns (e.g., Transparent Proxy, UUPS) in smart contract development?",
                options: [
                    { id: "q2o1", text: "To automatically translate Solidity code into other programming languages." },
                    { id: "q2o2", text: "To significantly reduce the gas cost of all function calls." },
                    { id: "q2o3", text: "To enable the logic of a smart contract to be upgraded after deployment while keeping the contract address and state intact." }
                ],
                correctOptionId: "q2o3",
                explanation: "Proxy patterns allow for smart contract upgradability by separating the contract's state (held at the proxy address) from its logic (in an implementation contract), enabling logic changes without data migration."
            },
            {
                id: "q3-mastery-formalverification",
                questionText: "What does 'Formal Verification' aim to achieve in the context of smart contract security?",
                options: [
                    { id: "q3o1", text: "To ensure the contract is popular among users by verifying social media engagement." },
                    { id: "q3o2", text: "To mathematically prove that the contract's code behaves according to a formal specification, helping to eliminate certain types of bugs." },
                    { id: "q3o3", text: "To automatically generate user documentation for the smart contract." }
                ],
                correctOptionId: "q3o2",
                explanation: "Formal verification uses mathematical methods to prove or disprove the correctness of a smart contract's implementation with respect to a formal specification, offering a high degree of assurance against certain bugs."
            }
        ]
    }
  }
];
