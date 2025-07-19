# Enhanced Tutor System Testing Guide

## Overview

This document provides comprehensive testing guidelines for the Enhanced Tutor System, including unit tests, integration tests, and performance validation.

## Test Structure

### 1. Unit Tests (`tests/enhanced-tutor-system.test.ts`)

**Database Integration Tests:**
- ✅ User context fetching from database
- ✅ Default context creation for new users
- ✅ Database error handling
- ✅ Context updates and persistence

**AI Response Parsing Tests:**
- ✅ JSON security analysis parsing
- ✅ Text-based fallback parsing
- ✅ Contract generation response parsing
- ✅ Challenge generation response parsing

**Local LLM Integration Tests:**
- ✅ Health check functionality
- ✅ Response generation
- ✅ Fallback mechanisms

### 2. Integration Tests (`tests/enhanced-tutor-integration.test.ts`)

**API Endpoint Tests:**
- ✅ Security analysis API
- ✅ LLM health check API
- ✅ Error handling
- ✅ Performance validation

**Real-world Scenarios:**
- ✅ Vulnerable contract detection
- ✅ Gas optimization suggestions
- ✅ Caching mechanisms
- ✅ Concurrent request handling

## Running Tests

### Quick Start

```bash
# Run all Enhanced Tutor tests
npm run ai:test:all

# Run comprehensive test suite with reporting
npm run ai:test:runner

# Run unit tests only
npm run ai:test

# Run integration tests (requires local LLM)
npm run ai:test:integration

# Watch mode for development
npm run test:watch
```

### Prerequisites

1. **Database Setup:**
   ```bash
   npm run db:push
   npm run db:seed
   ```

2. **Local LLM (Optional for integration tests):**
   - Start CodeLlama 34B on `localhost:1234`
   - Ensure health endpoint is accessible

3. **Environment Variables:**
   ```env
   DATABASE_URL="file:./dev.db"
   LOCAL_LLM_URL="http://localhost:1234/v1"
   LOCAL_LLM_API_KEY="lm-studio"
   GEMINI_API_KEY="your-gemini-key"
   ```

## Test Coverage

### Database Integration (100%)
- [x] User context retrieval
- [x] Context creation and updates
- [x] Error handling and fallbacks
- [x] Prisma integration

### AI Response Parsing (100%)
- [x] JSON parsing with validation
- [x] Text parsing fallbacks
- [x] Error recovery mechanisms
- [x] Data structure validation

### Local LLM Integration (95%)
- [x] Health monitoring
- [x] Request routing
- [x] Response handling
- [x] Fallback to Gemini
- [ ] Advanced error scenarios (manual testing required)

### API Endpoints (90%)
- [x] Security analysis endpoint
- [x] Error handling
- [x] Performance validation
- [x] Caching mechanisms
- [ ] Authentication edge cases (requires auth setup)

## Performance Benchmarks

### Expected Response Times
- **Database Operations:** < 100ms
- **Local LLM Analysis:** < 5 seconds
- **Gemini Fallback:** < 10 seconds
- **Cached Results:** < 50ms

### Concurrent Request Handling
- **Target:** 10 concurrent requests
- **Success Rate:** > 95%
- **Average Response Time:** < 8 seconds

## Test Data

### Sample Vulnerable Contract
```solidity
pragma solidity ^0.8.20;

contract VulnerableContract {
    mapping(address => uint256) public balances;
    
    function withdraw() external {
        uint256 amount = balances[msg.sender];
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        balances[msg.sender] = 0; // Reentrancy vulnerability
    }
}
```

**Expected Detection:**
- ✅ Reentrancy vulnerability (HIGH severity)
- ✅ Gas optimization suggestions
- ✅ Security score < 70

### Sample Secure Contract
```solidity
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SecureContract is ReentrancyGuard {
    mapping(address => uint256) public balances;
    
    function withdraw() external nonReentrant {
        uint256 amount = balances[msg.sender];
        balances[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
```

**Expected Analysis:**
- ✅ No critical vulnerabilities
- ✅ Best practices followed
- ✅ Security score > 85

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Reset database
   npm run db:reset
   npm run db:push
   ```

2. **Local LLM Not Available**
   ```bash
   # Check LLM health
   curl http://localhost:1234/health
   
   # Tests will skip integration tests automatically
   ```

3. **Test Timeouts**
   ```bash
   # Increase timeout in vitest.config.ts
   testTimeout: 60000 // 60 seconds
   ```

4. **Mock Issues**
   ```bash
   # Clear all mocks
   npm run test:watch -- --reporter=verbose
   ```

### Debug Mode

```bash
# Run tests with detailed output
npm run ai:test -- --reporter=verbose

# Run specific test file
npx vitest run tests/enhanced-tutor-system.test.ts

# Debug integration tests
npm run ai:test:integration -- --reporter=verbose
```

## Continuous Integration

### GitHub Actions Setup
```yaml
name: Enhanced Tutor Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run db:push
      - run: npm run ai:test:all
      - run: npm run test:coverage
```

### Quality Gates
- **Unit Test Coverage:** > 90%
- **Integration Test Pass Rate:** > 95%
- **Performance Benchmarks:** All tests < 30s
- **No Critical Security Issues:** In test contracts

## Manual Testing Checklist

### Before Release
- [ ] Test with real CodeLlama 34B instance
- [ ] Verify Gemini fallback functionality
- [ ] Test with various contract complexities
- [ ] Validate user context persistence
- [ ] Check performance under load
- [ ] Verify error handling edge cases

### User Acceptance Testing
- [ ] Security analysis accuracy
- [ ] Response time satisfaction
- [ ] Educational value of explanations
- [ ] Adaptive difficulty adjustment
- [ ] Context-aware recommendations

## Metrics and Monitoring

### Key Performance Indicators
- **Analysis Accuracy:** > 90% vulnerability detection
- **User Satisfaction:** > 4.5/5 rating
- **Response Time:** < 5 seconds average
- **Uptime:** > 99.5%
- **Cache Hit Rate:** > 70%

### Monitoring Setup
```typescript
// Add to Enhanced Tutor System
private metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  averageResponseTime: 0,
  cacheHitRate: 0,
  vulnerabilitiesDetected: 0
};
```

## Contributing

### Adding New Tests
1. Follow existing test patterns
2. Include both positive and negative test cases
3. Mock external dependencies appropriately
4. Add performance assertions where relevant
5. Update this documentation

### Test Naming Convention
```typescript
describe('Feature Name', () => {
  describe('Specific Functionality', () => {
    it('should perform expected behavior when condition', async () => {
      // Test implementation
    });
  });
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Enhanced AI Features Documentation](./ENHANCED_AI_FEATURES.md)
