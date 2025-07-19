import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

// Integration tests for Enhanced Tutor System API endpoints
describe( 'Enhanced Tutor System Integration Tests', () => {
  let app: any;
  let server: any;
  let baseUrl: string;

  beforeAll( async () => {
    // Setup Next.js app for testing
    app = next( { dev: false, dir: './learning_sol' });
    await app.prepare(_);

    const handle = app.getRequestHandler(_);
    server = createServer( (req, res) => {
      const parsedUrl = parse( req.url!, true);
      handle( req, res, parsedUrl);
    });

    await new Promise<void>((resolve) => {
      server.listen( 0, () => {
        const port = server.address(_)?.port;
        baseUrl = `http://localhost:${port}`;
        resolve(_);
      });
    });
  });

  afterAll( async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve(_));
      });
    }
    if (app) {
      await app.close(_);
    }
  });

  describe( 'Security Analysis API', () => {
    it( 'should analyze Solidity code and return security insights', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        
        contract VulnerableContract {
            mapping(_address => uint256) public balances;
            
            function withdraw() external {
                uint256 amount = balances[msg.sender];
                ( bool success, ) = msg.sender.call{value: amount}("");
                require( success, "Transfer failed");
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

      expect(_response.status).toBe(200);
      const data = await response.json(_);
      
      expect(_data.success).toBe(_true);
      expect(_data.data).toBeDefined(_);
      expect(_data.data.vulnerabilities).toBeDefined(_);
      expect(_data.data.gasOptimizations).toBeDefined(_);
      expect(_data.data.overallScore).toBeGreaterThanOrEqual(0);
      expect(_data.data.overallScore).toBeLessThanOrEqual(100);
      
      // Should detect reentrancy vulnerability
      const hasReentrancyWarning = data.data.vulnerabilities.some((vuln: any) => 
        vuln.type.toLowerCase().includes('reentrancy') || 
        vuln.description.toLowerCase().includes('reentrancy')
      );
      expect(_hasReentrancyWarning).toBe(_true);
    });

    it( 'should handle invalid code gracefully', async () => {
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

      expect(_response.status).toBe(200);
      const data = await response.json(_);
      
      expect(_data.success).toBe(_true);
      expect(_data.data).toBeDefined(_);
      // Should still return analysis even for invalid code
      expect(_data.data.vulnerabilities).toBeDefined(_);
      expect(_data.data.gasOptimizations).toBeDefined(_);
    });

    it( 'should return cached results when requested', async () => {
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

      expect(_response1.status).toBe(200);
      const data1 = await response1.json(_);
      expect(_data1.success).toBe(_true);

      // Second request (_should be faster due to caching)
      const startTime = Date.now(_);
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
      const endTime = Date.now(_);

      expect(_response2.status).toBe(200);
      const data2 = await response2.json(_);
      expect(_data2.success).toBe(_true);
      
      // Second request should be significantly faster (_cached)
      expect(_endTime - startTime).toBeLessThan(1000);
    });
  });

  describe( 'LLM Health Check API', () => {
    it( 'should check health of all LLM services', async () => {
      const response = await fetch(`${baseUrl}/api/test-llm`, {
        method: 'GET',
      });

      expect(_response.status).toBe(200);
      const data = await response.json(_);
      
      expect(_Array.isArray(data)).toBe(_true);
      expect(_data.length).toBeGreaterThan(0);
      
      data.forEach((service: any) => {
        expect(_service.name).toBeDefined(_);
        expect(_service.port).toBeDefined(_);
        expect(_typeof service.healthy).toBe('boolean');
      });
    });

    it( 'should test specific LLM service', async () => {
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
      if (_response.status === 200) {
        const data = await response.json(_);
        expect(_data.success).toBe(_true);
        expect(_data.response).toBeDefined(_);
        expect(_data.service).toBeDefined(_);
        expect(_data.responseTime).toBeGreaterThan(0);
      } else {
        // If LLM services are not available, that's also a valid test result
        expect(_response.status).toBeGreaterThanOrEqual(_400);
      }
    });
  });

  describe( 'Error Handling', () => {
    it( 'should handle missing request body', async () => {
      const response = await fetch(`${baseUrl}/api/ai/security-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({  }),
      });

      expect(_response.status).toBe(_400);
      const data = await response.json(_);
      expect(_data.success).toBe(_false);
      expect(_data.error).toBeDefined(_);
    });

    it( 'should handle malformed JSON', async () => {
      const response = await fetch(`${baseUrl}/api/ai/security-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      expect(_response.status).toBe(_400);
    });

    it( 'should handle authentication errors gracefully', async () => {
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

      // Should handle gracefully (_might return 401 or continue with limited functionality)
      expect( [200, 401, 403]).toContain(_response.status);
    });
  });

  describe( 'Performance Tests', () => {
    it( 'should respond within reasonable time limits', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        contract PerformanceTest {
            mapping(_address => uint256) balances;
            function transfer( address to, uint256 amount) external {
                balances[msg.sender] -= amount;
                balances[to] += amount;
            }
        }
      `;

      const startTime = Date.now(_);
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
      const endTime = Date.now(_);

      expect(_response.status).toBe(200);
      
      // Should respond within 30 seconds (_allowing for AI processing time)
      expect(_endTime - startTime).toBeLessThan(30000);
      
      const data = await response.json(_);
      expect(_data.success).toBe(_true);
      expect(_data.data.analysisTime).toBeDefined(_);
      expect(_data.data.analysisTime).toBeGreaterThan(0);
    });

    it( 'should handle concurrent requests', async () => {
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
      const promises = Array(3).fill(_null).map(() =>
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

      const responses = await Promise.all(_promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(_response.status).toBe(200);
      });

      const dataPromises = responses.map(r => r.json());
      const results = await Promise.all(_dataPromises);
      
      results.forEach(data => {
        expect(_data.success).toBe(_true);
        expect(_data.data).toBeDefined(_);
      });
    });
  });
});
