# Hardcoded Values Audit

This document contains all hardcoded values found in the codebase that should be moved to environment variables for better 12-factor compliance.

## Critical Hardcoded Values

### 1. Port Numbers
- **Port 3000** (Default app port)
  - Multiple files use `http://localhost:3000` or `PORT:-3000`
  - Found in: playwright.config.ts, jest.setup.js, README.md, multiple test files
  
- **Port 5432** (PostgreSQL)
  - `postgresql://user:password@localhost:5432/dbname`
  - Found in: env.example, docker-compose.yml, README.md, setup scripts
  
- **Port 6379** (Redis)
  - `redis://localhost:6379`
  - Found in: env.example, jest.setup.js, cache configurations
  
- **Port 3001** (WebSocket server)
  - `ws://localhost:3001` or `http://localhost:3001`
  - Found in: env.example, CommunityControls.tsx, websocket configurations
  
- **Port 1234, 1235, 1236** (LLM servers)
  - `http://localhost:1234/v1` (CodeLlama)
  - `http://localhost:1235/v1` (Mixtral)
  - `http://localhost:1236/v1` (Llama)
  - Found in: AI documentation, test files, LLM configurations

- **Port 8080** (Alternative WebSocket)
  - `ws://localhost:8080`
  - Found in: jest.setup.js, test files

### 2. Database Connection Strings
- `postgresql://username:password@localhost:5432/solidity_learning_dev`
- `postgresql://test:test@localhost:5432/test_db`
- `postgresql://postgres:password@db.project.supabase.co:5432/postgres`
- Found in: setup scripts, test configurations, documentation

### 3. URLs and Endpoints
- **Development URLs**:
  - `http://localhost:3000`
  - `ws://localhost:3001`
  - `http://localhost:1234/v1` (LLM endpoints)
  
- **External Service URLs**:
  - `https://sepolia.infura.io/v3/your-project-id` (Web3 provider)
  - `https://github.com/ezekaj/learning_sol`
  - `https://twitter.com/zedigitaltech`
  - `https://linkedin.com/company/zedigital`
  - `https://discord.gg/solidity`
  - `https://zedigital.tech/*`

### 4. API Keys and Secrets (Placeholders)
- `your-32-character-secret-here`
- `your-gemini-api-key`
- `your-github-client-secret`
- `your-google-client-secret`
- `your-sentry-dsn`
- `your-etherscan-api-key`

### 5. Configuration Values
- **Timeouts**: 
  - 30000ms (30 seconds) - multiple occurrences
  - 5000ms (5 seconds) - API timeouts
  - 120000ms (2 minutes) - server startup
  
- **Cluster Configuration**:
  - Workers: 4
  - Max restarts: 5
  - Restart delay: 1000ms

- **Cache TTL**: 300 seconds
- **Session timeout**: 86400 seconds (24 hours)

### 6. WebSocket Configuration
- Hardcoded in `CommunityControls.tsx`:
  ```typescript
  websocketUrl: 'ws://localhost:3001/community'
  fallbackPollingInterval: 30000
  ```

- Hardcoded in `websocket.ts`:
  ```typescript
  url: process.env.NEXTPUBLICWSURL || 'ws://localhost:3001/community',
  heartbeatInterval: 30000,
  reconnectDelay: 1000,
  maxReconnectAttempts: 5,
  ```

## Recommendations

### 1. Create Environment Variables
Add the following to your `.env` file:

```env
# Ports
APP_PORT=3000
SOCKET_SERVER_PORT=3001
POSTGRES_PORT=5432
REDIS_PORT=6379
LLM_CODELLAMA_PORT=1234
LLM_MIXTRAL_PORT=1235
LLM_LLAMA_PORT=1236

# Timeouts (in milliseconds)
DEFAULT_TIMEOUT=30000
API_TIMEOUT=5000
SERVER_STARTUP_TIMEOUT=120000
WEBSOCKET_HEARTBEAT_INTERVAL=30000
WEBSOCKET_RECONNECT_DELAY=1000
WEBSOCKET_MAX_RECONNECT_ATTEMPTS=5
WEBSOCKET_FALLBACK_POLLING_INTERVAL=30000

# Cache
CACHE_TTL_SECONDS=300
SESSION_TIMEOUT_SECONDS=86400

# Cluster
CLUSTER_WORKERS=4
CLUSTER_MAX_RESTARTS=5
CLUSTER_RESTART_DELAY=1000

# External Services
GITHUB_REPO_URL=https://github.com/ezekaj/learning_sol
TWITTER_URL=https://twitter.com/zedigitaltech
LINKEDIN_URL=https://linkedin.com/company/zedigital
DISCORD_INVITE_URL=https://discord.gg/solidity
COMPANY_WEBSITE=https://zedigital.tech
```

### 2. Replace Hardcoded Values
- Replace all instances of `localhost:PORT` with environment variables
- Use `process.env.APP_PORT || 3000` pattern for defaults
- For production, ensure all localhost references are replaced with proper URLs

### 3. Security Considerations
- Never commit actual API keys or secrets
- Use `.env.example` for placeholder values
- Validate all environment variables on startup
- Use different values for development, staging, and production

### 4. Configuration Module
Consider creating a centralized configuration module that:
- Validates all environment variables
- Provides typed access to configuration
- Handles defaults appropriately
- Throws errors for missing required values in production

## Files Requiring Updates

1. **High Priority** (Production-critical):
   - `/components/admin/CommunityControls.tsx` - Hardcoded WebSocket URL
   - `/lib/community/websocket.ts` - Hardcoded WebSocket configuration
   - `/lib/cache/redis-client.ts` - Hardcoded Redis URL
   - All database connection strings in setup scripts

2. **Medium Priority** (Development/Testing):
   - All test files with hardcoded localhost URLs
   - Docker compose files
   - Setup and deployment scripts

3. **Low Priority** (Documentation):
   - README files
   - Documentation with example URLs
   - Comments with localhost examples

## Next Steps

1. Audit each file listed above
2. Replace hardcoded values with environment variables
3. Update `.env.example` with all new variables
4. Test in development, staging, and production environments
5. Update deployment documentation