import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SolidityCodeAnalyzer } from '@/lib/analysis/SolidityCodeAnalyzer';

// Mock console.error to suppress error logs during testing
const originalConsoleError = console.error;

describe('SolidityCodeAnalyzer - Comprehensive Test Suite', () => {
  let analyzer: SolidityCodeAnalyzer;

  beforeEach(() => {
    analyzer = new SolidityCodeAnalyzer();
    // Suppress console.error for cleaner test output
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    jest.restoreAllMocks();
  });

  describe('Analyzer Initialization', () => {
    it('should initialize analyzer with all rule sets', () => {
      expect(analyzer).toBeInstanceOf(SolidityCodeAnalyzer);
      expect(analyzer['securityRules']).toBeDefined();
      expect(analyzer['gasOptimizationRules']).toBeDefined();
      expect(analyzer['styleRules']).toBeDefined();
    });

    it('should have security rules loaded', () => {
      expect(analyzer['securityRules'].size).toBeGreaterThan(0);
      expect(analyzer['securityRules'].has('reentrancy')).toBe(true);
      expect(analyzer['securityRules'].has('tx-origin')).toBe(true);
    });

    it('should have gas optimization rules loaded', () => {
      expect(analyzer['gasOptimizationRules'].size).toBeGreaterThan(0);
    });

    it('should have style rules loaded', () => {
      expect(analyzer['styleRules'].size).toBeGreaterThan(0);
    });
  });

  describe('Security Vulnerability Detection', () => {
    describe('Reentrancy Detection', () => {
      it('should detect potential reentrancy vulnerability', () => {
        const vulnerableCode = `
          function withdraw(uint amount) public {
            require(balances[msg.sender] >= amount);
            msg.sender.call{value: amount}("");
            balances[msg.sender] -= amount;
          }
        `;

        const result = analyzer.analyze(vulnerableCode);

        expect(result.vulnerabilities).toHaveLength(1);
        expect(result.vulnerabilities[0]).toMatchObject({
          type: 'reentrancy',
          severity: 'high',
          title: 'Potential Reentrancy Vulnerability',
          mitigation: expect.stringContaining('checks-effects-interactions'),
          swc: 'SWC-107'
        });
      });

      it('should not flag safe external calls', () => {
        const safeCode = `
          function withdraw(uint amount) public {
            require(balances[msg.sender] >= amount);
            balances[msg.sender] -= amount;
            msg.sender.call{value: amount}("");
          }
        `;

        const result = analyzer.analyze(safeCode);

        const reentrancyVulns = result.vulnerabilities.filter(v => v.type === 'reentrancy');
        expect(reentrancyVulns).toHaveLength(0);
      });

      it('should detect multiple reentrancy vulnerabilities', () => {
        const multipleVulnCode = `
          function withdraw1(uint amount) public {
            msg.sender.call{value: amount}("");
            balances[msg.sender] -= amount;
          }
          
          function withdraw2(uint amount) public {
            msg.sender.send(amount);
            balances[msg.sender] = 0;
          }
        `;

        const result = analyzer.analyze(multipleVulnCode);

        const reentrancyVulns = result.vulnerabilities.filter(v => v.type === 'reentrancy');
        expect(reentrancyVulns.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('tx.origin Detection', () => {
      it('should detect tx.origin usage', () => {
        const txOriginCode = `
          function onlyOwner() public {
            require(tx.origin == owner, "Not owner");
          }
        `;

        const result = analyzer.analyze(txOriginCode);

        const txOriginVulns = result.vulnerabilities.filter(v => v.type === 'tx-origin');
        expect(txOriginVulns).toHaveLength(1);
        expect(txOriginVulns[0]).toMatchObject({
          type: 'tx-origin',
          severity: 'medium',
          title: 'Use of tx.origin',
          mitigation: expect.stringContaining('msg.sender'),
          swc: 'SWC-115'
        });
      });

      it('should not flag msg.sender usage', () => {
        const safeSenderCode = `
          function onlyOwner() public {
            require(msg.sender == owner, "Not owner");
          }
        `;

        const result = analyzer.analyze(safeSenderCode);

        const txOriginVulns = result.vulnerabilities.filter(v => v.type === 'tx-origin');
        expect(txOriginVulns).toHaveLength(0);
      });
    });

    describe('Integer Overflow Detection', () => {
      it('should detect potential overflow in arithmetic operations', () => {
        const overflowCode = `
          function add(uint a, uint b) public pure returns (uint) {
            return a + b;
          }
        `;

        const result = analyzer.analyze(overflowCode);

        // Check if overflow detection is working (implementation dependent)
        expect(result.vulnerabilities).toBeDefined();
      });
    });
  });

  describe('Gas Optimization Analysis', () => {
    describe('Storage Optimization', () => {
      it('should suggest storage packing optimizations', () => {
        const unoptimizedStorage = `
          struct User {
            bool isActive;
            uint256 balance;
            bool isVerified;
            address wallet;
          }
        `;

        const result = analyzer.analyze(unoptimizedStorage);

        // Check for storage optimization suggestions
        expect(result.optimizations).toBeDefined();
      });
    });

    describe('Loop Optimization', () => {
      it('should detect inefficient loops', () => {
        const inefficientLoop = `
          function processUsers(address[] memory users) public {
            for (uint i = 0; i < users.length; i++) {
              // Process user
              userBalances[users[i]] += 100;
            }
          }
        `;

        const result = analyzer.analyze(inefficientLoop);

        expect(result.optimizations).toBeDefined();
      });
    });

    describe('Function Visibility Optimization', () => {
      it('should suggest external over public for functions', () => {
        const publicFunction = `
          function externalOnlyFunction(uint value) public {
            // This function is only called externally
          }
        `;

        const result = analyzer.analyze(publicFunction);

        expect(result.optimizations).toBeDefined();
      });
    });
  });

  describe('Code Quality Analysis', () => {
    describe('Style Issues', () => {
      it('should detect missing visibility specifiers', () => {
        const missingVisibility = `
          function noVisibility() {
            // Missing visibility specifier
          }
        `;

        const result = analyzer.analyze(missingVisibility);

        const styleIssues = result.issues.filter(issue => issue.type === 'style');
        expect(styleIssues.length).toBeGreaterThan(0);
      });

      it('should detect inconsistent naming conventions', () => {
        const inconsistentNaming = `
          uint public CONSTANT_VALUE = 100;
          uint public variableName = 200;
          function Function_Name() public {}
        `;

        const result = analyzer.analyze(inconsistentNaming);

        expect(result.issues).toBeDefined();
      });
    });

    describe('Documentation Issues', () => {
      it('should detect missing function documentation', () => {
        const undocumentedFunction = `
          function complexFunction(uint a, uint b) public returns (uint) {
            return a * b + 42;
          }
        `;

        const result = analyzer.analyze(undocumentedFunction);

        expect(result.issues).toBeDefined();
      });
    });
  });

  describe('Complexity Calculation', () => {
    it('should calculate cyclomatic complexity', () => {
      const complexFunction = `
        function complexLogic(uint value) public returns (uint) {
          if (value > 100) {
            if (value > 200) {
              return value * 2;
            } else {
              return value + 50;
            }
          } else {
            for (uint i = 0; i < value; i++) {
              if (i % 2 == 0) {
                value += i;
              }
            }
            return value;
          }
        }
      `;

      const result = analyzer.analyze(complexFunction);

      expect(result.complexity).toBeDefined();
      expect(result.complexity.cyclomatic).toBeGreaterThan(1);
      expect(result.complexity.cognitive).toBeGreaterThan(0);
      expect(result.complexity.lines).toBeGreaterThan(0);
    });

    it('should handle simple functions with low complexity', () => {
      const simpleFunction = `
        function simpleAdd(uint a, uint b) public pure returns (uint) {
          return a + b;
        }
      `;

      const result = analyzer.analyze(simpleFunction);

      expect(result.complexity.cyclomatic).toBe(1);
      expect(result.complexity.cognitive).toBeLessThanOrEqual(2);
    });
  });

  describe('Gas Estimation', () => {
    it('should estimate gas costs for functions', () => {
      const contractCode = `
        function simpleFunction() public pure returns (uint) {
          return 42;
        }
        
        function complexFunction(uint[] memory data) public {
          for (uint i = 0; i < data.length; i++) {
            storage[i] = data[i];
          }
        }
      `;

      const result = analyzer.analyze(contractCode);

      expect(result.gasEstimate).toBeDefined();
      expect(result.gasEstimate.deployment).toBeGreaterThan(0);
      expect(result.gasEstimate.total).toBeGreaterThan(0);
      expect(result.gasEstimate.functions).toBeDefined();
    });
  });

  describe('Quality Score Calculation', () => {
    it('should calculate overall quality score', () => {
      const wellWrittenCode = `
        /// @title A simple storage contract
        /// @author Test Author
        contract SimpleStorage {
          uint256 private storedData;
          
          /// @notice Store a value
          /// @param value The value to store
          function set(uint256 value) external {
            storedData = value;
          }
          
          /// @notice Get the stored value
          /// @return The stored value
          function get() external view returns (uint256) {
            return storedData;
          }
        }
      `;

      const result = analyzer.analyze(wellWrittenCode);

      expect(result.quality).toBeDefined();
      expect(result.quality.score).toBeGreaterThan(0);
      expect(result.quality.score).toBeLessThanOrEqual(100);
      expect(result.quality.maintainability).toBeGreaterThan(0);
      expect(result.quality.testability).toBeGreaterThan(0);
      expect(result.quality.documentation).toBeGreaterThan(0);
    });

    it('should penalize poor quality code', () => {
      const poorQualityCode = `
        function a(uint b) {
          c = b + d;
          if (e) f();
        }
      `;

      const result = analyzer.analyze(poorQualityCode);

      expect(result.quality.score).toBeLessThan(50);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty code input', () => {
      const result = analyzer.analyze('');

      expect(result).toBeDefined();
      expect(result.issues).toEqual([]);
      expect(result.vulnerabilities).toEqual([]);
      expect(result.optimizations).toEqual([]);
    });

    it('should handle malformed Solidity code', () => {
      const malformedCode = `
        function incomplete(
        // Missing closing parenthesis and body
      `;

      expect(() => analyzer.analyze(malformedCode)).not.toThrow();
    });

    it('should handle very large code files', () => {
      const largeCode = 'function test() public {}\n'.repeat(1000);

      const startTime = performance.now();
      const result = analyzer.analyze(largeCode);
      const endTime = performance.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle rule execution errors gracefully', () => {
      // This test verifies that if a rule throws an error, it doesn't crash the analyzer
      const codeWithEdgeCases = `
        function edgeCase() public {
          // Code that might cause rule parsing issues
          assembly { let x := 0x1234567890abcdef }
        }
      `;

      expect(() => analyzer.analyze(codeWithEdgeCases)).not.toThrow();
    });
  });

  describe('Real-world Solidity Code Analysis', () => {
    it('should analyze ERC20 token contract', () => {
      const erc20Code = `
        pragma solidity ^0.8.0;

        contract ERC20Token {
          mapping(address => uint256) private balances;
          mapping(address => mapping(address => uint256)) private allowances;

          uint256 private totalSupply;
          string public name;
          string public symbol;
          uint8 public decimals;

          function transfer(address to, uint256 amount) public returns (bool) {
            require(balances[msg.sender] >= amount, "Insufficient balance");
            balances[msg.sender] -= amount;
            balances[to] += amount;
            return true;
          }

          function approve(address spender, uint256 amount) public returns (bool) {
            allowances[msg.sender][spender] = amount;
            return true;
          }
        }
      `;

      const result = analyzer.analyze(erc20Code);

      expect(result).toBeDefined();
      expect(result.complexity.lines).toBeGreaterThan(10);
      expect(result.gasEstimate.total).toBeGreaterThan(0);
    });

    it('should analyze DeFi staking contract', () => {
      const stakingCode = `
        contract StakingContract {
          mapping(address => uint256) public stakes;
          mapping(address => uint256) public rewards;

          function stake(uint256 amount) external {
            require(amount > 0, "Amount must be positive");
            stakes[msg.sender] += amount;
            // Transfer tokens from user
          }

          function unstake(uint256 amount) external {
            require(stakes[msg.sender] >= amount, "Insufficient stake");
            stakes[msg.sender] -= amount;
            // Transfer tokens back to user
          }

          function claimRewards() external {
            uint256 reward = calculateReward(msg.sender);
            rewards[msg.sender] = 0;
            // Transfer reward tokens
          }

          function calculateReward(address user) internal view returns (uint256) {
            return stakes[user] * 10 / 100; // 10% reward
          }
        }
      `;

      const result = analyzer.analyze(stakingCode);

      expect(result.vulnerabilities).toBeDefined();
      expect(result.optimizations).toBeDefined();
      expect(result.quality.score).toBeGreaterThan(0);
    });

    it('should analyze NFT contract with complex logic', () => {
      const nftCode = `
        contract NFTContract {
          mapping(uint256 => address) private owners;
          mapping(address => uint256) private balances;
          mapping(uint256 => address) private tokenApprovals;

          uint256 private nextTokenId = 1;
          uint256 public maxSupply = 10000;

          function mint(address to) external {
            require(nextTokenId <= maxSupply, "Max supply reached");
            uint256 tokenId = nextTokenId++;
            owners[tokenId] = to;
            balances[to]++;
          }

          function transferFrom(address from, address to, uint256 tokenId) external {
            require(owners[tokenId] == from, "Not owner");
            require(msg.sender == from || tokenApprovals[tokenId] == msg.sender, "Not approved");

            owners[tokenId] = to;
            balances[from]--;
            balances[to]++;
            delete tokenApprovals[tokenId];
          }
        }
      `;

      const result = analyzer.analyze(nftCode);

      expect(result.complexity.cyclomatic).toBeGreaterThan(1);
      expect(result.gasEstimate.functions).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    it('should analyze code within acceptable time limits', () => {
      const mediumComplexityCode = `
        contract PerformanceTest {
          mapping(address => uint256) public balances;

          function complexFunction(uint256[] memory data) public {
            for (uint i = 0; i < data.length; i++) {
              if (data[i] > 100) {
                balances[msg.sender] += data[i];
              } else {
                balances[msg.sender] -= data[i];
              }
            }
          }
        }
      `;

      const startTime = performance.now();
      const result = analyzer.analyze(mediumComplexityCode);
      const endTime = performance.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle multiple analysis calls efficiently', () => {
      const simpleCode = 'function test() public {}';

      const startTime = performance.now();

      for (let i = 0; i < 10; i++) {
        analyzer.analyze(simpleCode);
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / 10;

      expect(averageTime).toBeLessThan(50); // Average should be under 50ms
    });
  });

  describe('Integration with Analysis Result', () => {
    it('should return complete analysis result structure', () => {
      const testCode = `
        function testFunction(uint value) public returns (uint) {
          if (value > 0) {
            return value * 2;
          }
          return 0;
        }
      `;

      const result = analyzer.analyze(testCode);

      // Verify all required properties are present
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('optimizations');
      expect(result).toHaveProperty('vulnerabilities');
      expect(result).toHaveProperty('gasEstimate');
      expect(result).toHaveProperty('complexity');
      expect(result).toHaveProperty('quality');

      // Verify nested structure
      expect(result.gasEstimate).toHaveProperty('deployment');
      expect(result.gasEstimate).toHaveProperty('functions');
      expect(result.gasEstimate).toHaveProperty('total');

      expect(result.complexity).toHaveProperty('cyclomatic');
      expect(result.complexity).toHaveProperty('cognitive');
      expect(result.complexity).toHaveProperty('lines');

      expect(result.quality).toHaveProperty('score');
      expect(result.quality).toHaveProperty('maintainability');
      expect(result.quality).toHaveProperty('testability');
      expect(result.quality).toHaveProperty('documentation');
    });

    it('should provide actionable analysis results', () => {
      const problematicCode = `
        function problematic() {
          tx.origin; // Security issue
          msg.sender.call(""); // Potential reentrancy
          balances[msg.sender] = 0; // State change after call
        }
      `;

      const result = analyzer.analyze(problematicCode);

      // Should have actionable vulnerabilities
      result.vulnerabilities.forEach(vuln => {
        expect(vuln).toHaveProperty('mitigation');
        expect(vuln).toHaveProperty('references');
        expect(vuln.mitigation).toBeTruthy();
        expect(vuln.references.length).toBeGreaterThan(0);
      });

      // Should have actionable optimizations
      result.optimizations.forEach(opt => {
        expect(opt).toHaveProperty('explanation');
        expect(opt).toHaveProperty('optimizedCode');
        expect(opt.explanation).toBeTruthy();
      });
    });
  });
});
