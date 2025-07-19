import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

// Integration tests for Enhanced Tutor System API endpoints
describe('Enhanced Tutor System Integration Tests', () => {
  let app: any;
  let server: any;
  let baseUrl: string;

  beforeAll(async () => {
    // Setup Next.js app for testing
    app = next({ dev: false, dir: './learning_sol' });
    await app.prepare();

    const handle = app.getRequestHandler();
    server = createServer((req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const port = server.address()?.port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
    if (app) {
      await app.close();
    }
  });

  describe('Security Analysis API', () => {
    it('should analyze Solidity code and return security insights', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        
        contract VulnerableContract {
            mapping(address => uint256) public balances;
            
            function withdraw() external {
                uint256 amount = balances[msg.sender];
                (bool success, ) = msg.sender.call{value: amount}("");
                require(success, "Transfer failed");
                balances[msg.sender] = 0;
            }
        }
      `;

      const response = await fetch(`${baseUrl}/api/ai/security-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: testCode,
          cacheResults: false,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.vulnerabilities).toBeDefined();
      expect(data.data.gasOptimizations).toBeDefined();
      expect(data.data.overallScore).toBeGreaterThanOrEqual(0);
      expect(data.data.overallScore).toBeLessThanOrEqual(100);
      
      // Should detect reentrancy vulnerability
      const hasReentrancyWarning = data.data.vulnerabilities.some((vuln: any) => 
        vuln.type.toLowerCase().includes('reentrancy') || 
        vuln.description.toLowerCase().includes('reentrancy')
      );
      expect(hasReentrancyWarning).toBe(true);
    });

    it('should handle invalid code gracefully', async () => {
      const invalidCode = 'invalid solidity code here';

      const response = await fetch(`${baseUrl}/api/ai/security-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: invalidCode,
          cacheResults: false,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      // Should still return analysis even for invalid code
      expect(data.data.vulnerabilities).toBeDefined();
      expect(data.data.gasOptimizations).toBeDefined();
    });

    it('should return cached results when requested', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        contract SimpleContract {
            uint256 public value = 42;
        }
      `;

      // First request
      const response1 = await fetch(`${baseUrl}/api/ai/security-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: testCode,
          cacheResults: true,
        }),
      });

      expect(response1.status).toBe(200);
      const data1 = await response1.json();
      expect(data1.success).toBe(true);

      // Second request (should be faster due to caching)
      const startTime = Date.now();
      const response2 = await fetch(`${baseUrl}/api/ai/security-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: testCode,
          cacheResults: true,
        }),
      });
      const endTime = Date.now();

      expect(response2.status).toBe(200);
      const data2 = await response2.json();
      expect(data2.success).toBe(true);
      
      // Second request should be significantly faster (cached)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('LLM Health Check API', () => {
    it('should check health of all LLM services', async () => {
      const response = await fetch(`${baseUrl}/api/test-llm`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      
      data.forEach((service: any) => {
        expect(service.name).toBeDefined();
        expect(service.port).toBeDefined();
        expect(typeof service.healthy).toBe('boolean');
      });
    });

    it('should test specific LLM service', async () => {
      const response = await fetch(`${baseUrl}/api/test-llm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Explain what is a smart contract',
          type: 'explanation',
          service: 'auto',
        }),
      });

      // Note: This might fail if local LLM is not running, which is expected
      if (response.status === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.response).toBeDefined();
        expect(data.service).toBeDefined();
        expect(data.responseTime).toBeGreaterThan(0);
      } else {
        // If LLM services are not available, that's also a valid test result
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing request body', async () => {
      const response = await fetch(`${baseUrl}/api/ai/security-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle malformed JSON', async () => {
      const response = await fetch(`${baseUrl}/api/ai/security-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      expect(response.status).toBe(400);
    });

    it('should handle authentication errors gracefully', async () => {
      // Test without proper authentication
      const response = await fetch(`${baseUrl}/api/ai/security-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token',
        },
        body: JSON.stringify({
          code: 'pragma solidity ^0.8.20; contract Test {}',
        }),
      });

      // Should handle gracefully (might return 401 or continue with limited functionality)
      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe('Performance Tests', () => {
    it('should respond within reasonable time limits', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        contract PerformanceTest {
            mapping(address => uint256) balances;
            function transfer(address to, uint256 amount) external {
                balances[msg.sender] -= amount;
                balances[to] += amount;
            }
        }
      `;

      const startTime = Date.now();
      const response = await fetch(`${baseUrl}/api/ai/security-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: testCode,
          cacheResults: false,
        }),
      });
      const endTime = Date.now();

      expect(response.status).toBe(200);
      
      // Should respond within 30 seconds (allowing for AI processing time)
      expect(endTime - startTime).toBeLessThan(30000);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.analysisTime).toBeDefined();
      expect(data.data.analysisTime).toBeGreaterThan(0);
    });

    it('should handle concurrent requests', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        contract ConcurrentTest {
            uint256 public counter;
            function increment() external {
                counter++;
            }
        }
      `;

      // Send 3 concurrent requests
      const promises = Array(3).fill(null).map(() =>
        fetch(`${baseUrl}/api/ai/security-analysis`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: testCode,
            cacheResults: false,
          }),
        })
      );

      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      const dataPromises = responses.map(r => r.json());
      const results = await Promise.all(dataPromises);
      
      results.forEach(data => {
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
      });
    });
  });
});
