const http = require('http');
const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { URL } = require('url');
const { config, generateApiKey, verifyApiKey, checkRateLimit } = require('./src/config');

// Enhanced logging with timestamps and levels
class Logger {
  constructor() {
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    this.currentLevel = this.levels[config.logLevel] || 1;
  }
  
  log(level, message, data = null) {
    if (this.levels[level] >= this.currentLevel) {
      const timestamp = new Date().toISOString();
      const logData = {
        timestamp,
        level: level.toUpperCase(),
        message,
        ...(data && { data })
      };
      
      if (config.logFormat === 'json') {
        console.log(JSON.stringify(logData));
      } else {
        const emoji = {debug: '🔍', info: 'ℹ️', warn: '⚠️', error: '❌'}[level] || '';
        console.log(`${emoji} [${timestamp}] ${level.toUpperCase()}: ${message}`, data || '');
      }
    }
  }
  
  debug(message, data) { this.log('debug', message, data); }
  info(message, data) { this.log('info', message, data); }
  warn(message, data) { this.log('warn', message, data); }
  error(message, data) { this.log('error', message, data); }
}

const logger = new Logger();

// Enhanced PC Registry with authentication
class PCRegistry {
  constructor() {
    this.pcs = new Map();
    this.apiKeys = new Map();
    this.lastCleanup = Date.now();
  }
  
  // Generate API key for new PC
  generatePCApiKey(pcId) {
    const apiKey = generateApiKey(pcId);
    this.apiKeys.set(apiKey, {
      pcId,
      createdAt: Date.now(),
      active: true
    });
    logger.info(`🔑 Generated API key for PC: ${pcId}`);
    return apiKey;
  }
  
  // Verify API key and get PC ID
  verifyPCApiKey(apiKey) {
    const keyData = this.apiKeys.get(apiKey);
    if (keyData && keyData.active) {
      return keyData.pcId;
    }
    return null;
  }
  
  // Register PC with authentication
  registerPC(pcId, data, apiKey) {
    const verifiedPcId = this.verifyPCApiKey(apiKey);
    if (!verifiedPcId || verifiedPcId !== pcId) {
      logger.warn(`🚫 Authentication failed for PC: ${pcId}`);
      return false;
    }
    
    const now = Date.now();
    this.pcs.set(pcId, {
      ...data,
      lastSeen: now,
      registered: now,
      authenticated: true
    });
    
    logger.info(`✅ PC authenticated and registered: ${pcId}`);
    return true;
  }
  
  // Update PC data
  updatePC(pcId, data, apiKey) {
    if (!this.verifyPCApiKey(apiKey)) {
      logger.warn(`🚫 Authentication failed for PC update: ${pcId}`);
      return false;
    }
    
    const existing = this.pcs.get(pcId);
    if (existing) {
      this.pcs.set(pcId, {
        ...existing,
        ...data,
        lastSeen: Date.now()
      });
      return true;
    }
    return false;
  }
  
  // Get all active PCs
  getActivePCs() {
    this.cleanup();
    return Array.from(this.pcs.entries()).map(([id, data]) => ({
      id,
      ...data
    }));
  }
  
  // Clean up old PCs
  cleanup() {
    const now = Date.now();
    if (now - this.lastCleanup > 60000) { // Clean every minute
      const cutoff = now - config.pcTimeout;
      
      for (const [pcId, data] of this.pcs) {
        if (data.lastSeen < cutoff) {
          this.pcs.delete(pcId);
          logger.info(`🧹 Removed inactive PC: ${pcId}`);
        }
      }
      
      this.lastCleanup = now;
    }
  }
}

const pcRegistry = new PCRegistry();

// CORS middleware
function handleCORS(req, res) {
  const origin = req.headers.origin;
  if (config.corsOrigins.includes(origin) || config.corsOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-PC-ID');
  
  if (config.corsCredentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return true;
  }
  
  return false;
}

// Authentication middleware
function authenticate(req, res) {
  const apiKey = req.headers['x-api-key'];
  const pcId = req.headers['x-pc-id'];
  
  if (!apiKey || !pcId) {
    logger.warn('🚫 Missing authentication headers', {
      url: req.url,
      ip: req.connection.remoteAddress
    });
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Authentication required',
      message: 'X-API-Key and X-PC-ID headers are required'
    }));
    return false;
  }
  
  const verifiedPcId = pcRegistry.verifyPCApiKey(apiKey);
  if (!verifiedPcId || verifiedPcId !== pcId) {
    logger.warn('🚫 Invalid authentication', {
      providedPcId: pcId,
      verifiedPcId,
      ip: req.connection.remoteAddress
    });
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Authentication failed',
      message: 'Invalid API key or PC ID'
    }));
    return false;
  }
  
  // Rate limiting
  if (!checkRateLimit(pcId)) {
    logger.warn('🚫 Rate limit exceeded', { pcId });
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Maximum ${config.apiRateLimit} requests per minute allowed`
    }));
    return false;
  }
  
  req.pcId = pcId;
  req.apiKey = apiKey;
  return true;
}

// Request body parser
function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    try {
      const data = body ? JSON.parse(body) : {};
      callback(null, data);
    } catch (error) {
      callback(error, null);
    }
  });
}

// Enhanced Central Service
function createCentralService() {
  const startTime = new Date().toISOString();
  
  logger.info('🌐 Starting Central Multi-PC Monitoring Service (Production)');
  logger.info('=' .repeat(60));
  
  const server = http.createServer((req, res) => {
    // Handle CORS
    if (handleCORS(req, res)) return;
    
    const url = new URL(req.url, `http://localhost:${config.port}`);
    const method = req.method;
    
    logger.debug(`${method} ${url.pathname}`, {
      ip: req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    
    // Public endpoints (no authentication required)
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - new Date(startTime).getTime(),
        environment: config.nodeEnv,
        version: '2.0.0'
      }));
      return;
    }
    
    if (url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <head><title>Central Monitoring Service</title></head>
          <body>
            <h1>🌐 Central Multi-PC Monitoring Service</h1>
            <p><strong>Status:</strong> Running</p>
            <p><strong>Environment:</strong> ${config.nodeEnv}</p>
            <p><strong>Version:</strong> 2.0.0</p>
            <p><strong>Started:</strong> ${startTime}</p>
            <hr>
            <h2>API Endpoints</h2>
            <ul>
              <li><a href="/dashboard">📊 Dashboard</a></li>
              <li><a href="/api/pcs">📱 Active PCs</a> (requires auth)</li>
              <li><a href="/api/metrics">📈 Metrics</a> (requires auth)</li>
              <li><a href="/health">💚 Health Check</a></li>
            </ul>
            <hr>
            <p><em>Authentication required for most endpoints</em></p>
          </body>
        </html>
      `);
      return;
    }
    
    // API Key generation endpoint (temporary - for development)
    if (url.pathname === '/api/generate-key' && method === 'POST') {
      parseBody(req, (err, data) => {
        if (err || !data.pcId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'PC ID required' }));
          return;
        }
        
        const apiKey = pcRegistry.generatePCApiKey(data.pcId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          pcId: data.pcId,
          apiKey,
          message: 'Store this API key securely - it will not be shown again'
        }));
      });
      return;
    }
    
    // Protected endpoints (require authentication)
    if (!authenticate(req, res)) return;
    
    // PC Registration
    if (url.pathname === '/api/register' && method === 'POST') {
      parseBody(req, (err, data) => {
        if (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
          return;
        }
        
        const success = pcRegistry.registerPC(req.pcId, data, req.apiKey);
        res.writeHead(success ? 200 : 403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success,
          message: success ? 'PC registered successfully' : 'Registration failed'
        }));
      });
      return;
    }
    
    // PC Data Update
    if (url.pathname === '/api/update' && method === 'POST') {
      parseBody(req, (err, data) => {
        if (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
          return;
        }
        
        const success = pcRegistry.updatePC(req.pcId, data, req.apiKey);
        res.writeHead(success ? 200 : 404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success,
          message: success ? 'PC updated successfully' : 'PC not found'
        }));
      });
      return;
    }
    
    // Get Active PCs
    if (url.pathname === '/api/pcs' && method === 'GET') {
      const pcs = pcRegistry.getActivePCs();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        pcs,
        count: pcs.length,
        timestamp: new Date().toISOString()
      }));
      return;
    }
    
    // Aggregated Metrics
    if (url.pathname === '/api/metrics' && method === 'GET') {
      const pcs = pcRegistry.getActivePCs();
      const metrics = {
        totalPCs: pcs.length,
        activePCs: pcs.filter(pc => Date.now() - pc.lastSeen < 60000).length,
        totalAlerts: pcs.reduce((sum, pc) => sum + (pc.alertCount || 0), 0),
        averageResponseTime: pcs.reduce((sum, pc) => sum + (pc.averageResponseTime || 0), 0) / (pcs.length || 1),
        timestamp: new Date().toISOString()
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(metrics));
      return;
    }
    
    // Enhanced Dashboard
    if (url.pathname === '/dashboard') {
      const pcs = pcRegistry.getActivePCs();
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Central Monitoring Dashboard</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
            .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .pc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 15px; }
            .pc-card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .pc-header { display: flex; justify-content: between; align-items: center; margin-bottom: 15px; }
            .pc-status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .status-online { background: #d4edda; color: #155724; }
            .status-offline { background: #f8d7da; color: #721c24; }
            .metric { margin: 8px 0; }
            .refresh-btn { background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
            .timestamp { color: #7f8c8d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌐 Central Multi-PC Monitoring Dashboard</h1>
            <p>Production Environment • Version 2.0.0 • Authentication Enabled</p>
          </div>
          
          <div class="stats">
            <div class="stat-card">
              <h3>📊 Total PCs</h3>
              <h2>${pcs.length}</h2>
            </div>
            <div class="stat-card">
              <h3>✅ Online PCs</h3>
              <h2>${pcs.filter(pc => Date.now() - pc.lastSeen < 60000).length}</h2>
            </div>
            <div class="stat-card">
              <h3>🚨 Total Alerts</h3>
              <h2>${pcs.reduce((sum, pc) => sum + (pc.alertCount || 0), 0)}</h2>
            </div>
            <div class="stat-card">
              <h3>⚡ Avg Response</h3>
              <h2>${Math.round(pcs.reduce((sum, pc) => sum + (pc.averageResponseTime || 0), 0) / (pcs.length || 1))}ms</h2>
            </div>
          </div>
          
          <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
          
          <div class="pc-grid">
            ${pcs.map(pc => {
              const isOnline = Date.now() - pc.lastSeen < 60000;
              return `
                <div class="pc-card">
                  <div class="pc-header">
                    <h3>💻 ${pc.id}</h3>
                    <span class="pc-status ${isOnline ? 'status-online' : 'status-offline'}">
                      ${isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                  
                  <div class="metric"><strong>Platform:</strong> ${pc.platform || 'Unknown'}</div>
                  <div class="metric"><strong>Node Version:</strong> ${pc.nodeVersion || 'Unknown'}</div>
                  <div class="metric"><strong>Last Seen:</strong> ${new Date(pc.lastSeen).toLocaleString()}</div>
                  <div class="metric"><strong>Uptime:</strong> ${Math.round((Date.now() - (pc.startTime ? new Date(pc.startTime).getTime() : Date.now())) / 1000)}s</div>
                  
                  ${pc.metrics ? `
                    <hr>
                    <div class="metric"><strong>CPU:</strong> ${pc.metrics.cpu?.toFixed(1) || 'N/A'}%</div>
                    <div class="metric"><strong>Memory:</strong> ${pc.metrics.memory?.toFixed(1) || 'N/A'}%</div>
                    <div class="metric"><strong>Alerts:</strong> ${pc.alertCount || 0}</div>
                  ` : ''}
                  
                  <div class="timestamp">Authenticated: ✅</div>
                </div>
              `;
            }).join('')}
          </div>
          
          <script>
            // Auto-refresh every 30 seconds
            setTimeout(() => location.reload(), 30000);
          </script>
        </body>
        </html>
      `);
      return;
    }
    
    // 404 Not Found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  });
  
  server.listen(config.port, () => {
    logger.info(`🌐 Central Monitoring Service started successfully`);
    logger.info(`📊 Dashboard: http://localhost:${config.port}/dashboard`);
    logger.info(`📈 API Base: http://localhost:${config.port}/api`);
    logger.info(`💚 Health Check: http://localhost:${config.port}/health`);
    logger.info(`🔒 Authentication: Enabled`);
    logger.info(`⚡ Rate Limit: ${config.apiRateLimit} requests/minute`);
    logger.info(`🌍 Environment: ${config.nodeEnv}`);
    
    if (config.nodeEnv === 'development') {
      logger.info('🔑 Development API Key Generator: POST /api/generate-key');
    }
  });
  
  return server;
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('🛑 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('🛑 Received SIGINT, shutting down gracefully');
  process.exit(0);
});

// Start the service
createCentralService();