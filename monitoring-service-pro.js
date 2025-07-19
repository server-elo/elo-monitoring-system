const http = require('http');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { config } = require('./src/config');

// Enhanced PC Monitoring Service with Remote Connectivity
class RemotePCMonitor {
  constructor() {
    this.config = this.loadConfig();
    this.systemInfo = this.getSystemInfo();
    this.apiKey = this.loadApiKey();
    this.metrics = {
      alerts: 0,
      requests: 0,
      errors: 0,
      startTime: Date.now()
    };
    
    console.log('🚀 PC Monitoring Service (Remote-Ready) Starting...');
    console.log('=' .repeat(55));
    console.log(`💻 PC ID: ${this.systemInfo.pcId}`);
    console.log(`🌐 Central Service: ${this.config.centralUrl}`);
    console.log(`🔒 API Key: ${this.apiKey ? '✅ Loaded' : '❌ Missing'}`);
    console.log('');
  }
  
  loadConfig() {
    // Try to load configuration from environment or file
    const centralUrl = process.env.CENTRAL_SERVICE_URL || 
                      process.env.REMOTE_MONITORING_URL || 
                      'http://localhost:3001';
    
    const healthCheckInterval = parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000;
    const reportInterval = parseInt(process.env.REPORT_INTERVAL) || 60000;
    const port = parseInt(process.env.PC_MONITOR_PORT) || 3002;
    
    return {
      centralUrl,
      healthCheckInterval,
      reportInterval,
      port,
      endpoints: [
        {
          name: 'main_app',
          url: 'http://localhost:3000/api/health',
          timeout: 5000
        },
        {
          name: 'database',
          url: 'http://localhost:3000/api/health/db',
          timeout: 5000
        }
      ]
    };
  }
  
  getSystemInfo() {
    const hostname = os.hostname();
    const username = os.userInfo().username;
    const pcId = `${username}@${hostname}`;
    
    return {
      pcId,
      hostname,
      username,
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      pid: process.pid,
      startTime: new Date().toISOString(),
      cores: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024 * 100) / 100
    };
  }
  
  loadApiKey() {
    // Try to load API key from environment or file
    let apiKey = process.env.API_KEY || process.env.PC_API_KEY;
    
    if (!apiKey) {
      const keyFile = path.join(__dirname, '.pc-api-key');
      if (fs.existsSync(keyFile)) {
        try {
          apiKey = fs.readFileSync(keyFile, 'utf8').trim();
        } catch (error) {
          console.warn('⚠️ Could not read API key file:', error.message);
        }
      }
    }
    
    return apiKey;
  }
  
  saveApiKey(apiKey) {
    const keyFile = path.join(__dirname, '.pc-api-key');
    try {
      fs.writeFileSync(keyFile, apiKey, { mode: 0o600 }); // Read-only for owner
      this.apiKey = apiKey;
      console.log('✅ API key saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Could not save API key:', error.message);
      return false;
    }
  }
  
  async requestApiKey() {
    if (!this.config.centralUrl.startsWith('http')) {
      console.error('❌ Invalid central service URL');
      return false;
    }
    
    try {
      console.log('🔑 Requesting API key from central service...');
      
      const data = JSON.stringify({
        pcId: this.systemInfo.pcId,
        systemInfo: this.systemInfo
      });
      
      const url = new URL('/api/generate-key', this.config.centralUrl);
      const response = await this.makeRequest('POST', url, data, {
        'Content-Type': 'application/json'
      });
      
      if (response.success && response.data.apiKey) {
        this.saveApiKey(response.data.apiKey);
        console.log(`✅ API key generated for PC: ${this.systemInfo.pcId}`);
        return true;
      } else {
        console.error('❌ Failed to generate API key:', response.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting API key:', error.message);
      return false;
    }
  }
  
  async makeRequest(method, url, data = null, headers = {}) {
    return new Promise((resolve) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const httpModule = isHttps ? require('https') : require('http');
      
      // Add authentication headers if available
      if (this.apiKey && !headers['X-API-Key']) {
        headers['X-API-Key'] = this.apiKey;
        headers['X-PC-ID'] = this.systemInfo.pcId;
      }
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method,
        headers,
        timeout: 10000
      };
      
      const req = httpModule.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const parsedData = responseData ? JSON.parse(responseData) : {};
            resolve({
              success: res.statusCode >= 200 && res.statusCode < 300,
              statusCode: res.statusCode,
              data: parsedData,
              error: res.statusCode >= 400 ? parsedData.error || 'Request failed' : null
            });
          } catch (error) {
            resolve({
              success: false,
              error: 'Invalid JSON response',
              data: responseData
            });
          }
        });
      });
      
      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          error: 'Request timeout'
        });
      });
      
      if (data) {
        req.write(data);
      }
      req.end();
    });
  }
  
  async checkHealth(endpoint) {
    try {
      const startTime = Date.now();
      const response = await this.makeRequest('GET', endpoint.url);
      const responseTime = Date.now() - startTime;
      
      return {
        name: endpoint.name,
        status: response.success ? 'healthy' : 'error',
        responseTime,
        error: response.error,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: endpoint.name,
        status: 'error',
        responseTime: -1,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  async runHealthChecks() {
    console.log('🔍 Running health checks...');
    const results = [];
    
    for (const endpoint of this.config.endpoints) {
      const result = await this.checkHealth(endpoint);
      results.push(result);
      
      if (result.status === 'error') {
        this.metrics.alerts++;
        console.log(`🚨 ALERT [${this.systemInfo.pcId}]: ${result.name} - ${result.status} - ${result.error}`);
      } else {
        console.log(`✅ HEALTHY [${this.systemInfo.pcId}]: ${result.name} - ${result.responseTime}ms`);
      }
    }
    
    return results;
  }
  
  getMetrics() {
    const uptime = Date.now() - this.metrics.startTime;
    const memUsage = process.memoryUsage();
    
    return {
      alerts: this.metrics.alerts,
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      uptime,
      cpu: os.loadavg()[0],
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(os.totalmem() / 1024 / 1024),
        free: Math.round(os.freemem() / 1024 / 1024),
        usage: Math.round((os.totalmem() - os.freemem()) / os.totalmem() * 100)
      }
    };
  }
  
  async reportToCentral(healthResults) {
    if (!this.apiKey) {
      console.log('⚠️ No API key - attempting to request one...');
      if (!(await this.requestApiKey())) {
        console.log('❌ Cannot report to central service without API key');
        return false;
      }
    }
    
    try {
      const reportData = {
        pcId: this.systemInfo.pcId,
        systemInfo: this.systemInfo,
        healthResults,
        metrics: this.getMetrics(),
        timestamp: new Date().toISOString()
      };
      
      const url = new URL('/api/update', this.config.centralUrl);
      const response = await this.makeRequest('POST', url, JSON.stringify(reportData), {
        'Content-Type': 'application/json'
      });
      
      if (response.success) {
        console.log(`📊 Reported to central service: ${this.systemInfo.pcId}`);
        return true;
      } else {
        console.error(`❌ Failed to report to central service: ${response.error}`);
        
        // If authentication fails, try to get a new API key
        if (response.statusCode === 401 || response.statusCode === 403) {
          console.log('🔑 Authentication failed - requesting new API key...');
          if (await this.requestApiKey()) {
            return this.reportToCentral(healthResults); // Retry once
          }
        }
        return false;
      }
    } catch (error) {
      console.error('❌ Error reporting to central service:', error.message);
      return false;
    }
  }
  
  createLocalServer() {
    const server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }
      
      const url = new URL(req.url, `http://localhost:${this.config.port}`);
      
      if (url.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <head><title>PC Monitor - ${this.systemInfo.pcId}</title></head>
            <body style="font-family: Arial; margin: 20px;">
              <h1>💻 PC Monitoring Service</h1>
              <h2>${this.systemInfo.pcId}</h2>
              <p><strong>Status:</strong> Running</p>
              <p><strong>Central Service:</strong> ${this.config.centralUrl}</p>
              <p><strong>API Key:</strong> ${this.apiKey ? '✅ Configured' : '❌ Missing'}</p>
              <hr>
              <h3>Endpoints:</h3>
              <ul>
                <li><a href="/health">💚 Health Check</a></li>
                <li><a href="/metrics">📊 Metrics</a></li>
                <li><a href="/system">💻 System Info</a></li>
                <li><a href="/dashboard">📈 Dashboard</a></li>
              </ul>
            </body>
          </html>
        `);
        return;
      }
      
      if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          pcId: this.systemInfo.pcId,
          centralConnected: !!this.apiKey,
          timestamp: new Date().toISOString()
        }));
        return;
      }
      
      if (url.pathname === '/metrics') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.getMetrics()));
        return;
      }
      
      if (url.pathname === '/system') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.systemInfo));
        return;
      }
      
      if (url.pathname === '/dashboard') {
        const metrics = this.getMetrics();
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>PC Monitor Dashboard - ${this.systemInfo.pcId}</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
              .header { background: #34495e; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
              .stat-card { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
              .status-connected { background: #d4edda; color: #155724; }
              .status-disconnected { background: #f8d7da; color: #721c24; }
              .refresh-btn { background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>💻 PC Monitoring Dashboard</h1>
              <h2>${this.systemInfo.pcId}</h2>
              <span class="status ${this.apiKey ? 'status-connected' : 'status-disconnected'}">
                ${this.apiKey ? '🔗 CONNECTED TO CENTRAL' : '❌ DISCONNECTED'}
              </span>
            </div>
            
            <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
            
            <div class="stats">
              <div class="stat-card">
                <h3>📊 Alerts</h3>
                <h2>${metrics.alerts}</h2>
              </div>
              <div class="stat-card">
                <h3>⏱️ Uptime</h3>
                <h2>${Math.round(metrics.uptime / 1000)}s</h2>
              </div>
              <div class="stat-card">
                <h3>💾 Memory Usage</h3>
                <h2>${metrics.memory.usage}%</h2>
              </div>
              <div class="stat-card">
                <h3>🔗 Central Service</h3>
                <p>${this.config.centralUrl}</p>
              </div>
            </div>
            
            <div class="stat-card">
              <h3>💻 System Information</h3>
              <p><strong>Platform:</strong> ${this.systemInfo.platform}</p>
              <p><strong>CPU Cores:</strong> ${this.systemInfo.cores}</p>
              <p><strong>Total Memory:</strong> ${this.systemInfo.totalMemory}GB</p>
              <p><strong>Node.js:</strong> ${this.systemInfo.nodeVersion}</p>
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
    
    server.listen(this.config.port, () => {
      console.log('📊 Local monitoring server started');
      console.log(`📈 Dashboard: http://localhost:${this.config.port}/dashboard`);
      console.log(`💚 Health Check: http://localhost:${this.config.port}/health`);
      console.log(`📊 Metrics: http://localhost:${this.config.port}/metrics`);
      console.log('');
    });
    
    return server;
  }
  
  async start() {
    // Create local monitoring server
    this.createLocalServer();
    
    // Try to get API key if not available
    if (!this.apiKey) {
      await this.requestApiKey();
    }
    
    // Start health checking loop
    const healthCheckLoop = async () => {
      try {
        const healthResults = await this.runHealthChecks();
        await this.reportToCentral(healthResults);
      } catch (error) {
        console.error('❌ Error in health check loop:', error.message);
      }
      
      setTimeout(healthCheckLoop, this.config.healthCheckInterval);
    };
    
    // Start the first health check after a short delay
    setTimeout(healthCheckLoop, 5000);
    
    console.log('✅ PC Monitoring Service started successfully!');
    console.log(`⏰ Health check interval: ${this.config.healthCheckInterval / 1000}s`);
    console.log('🎯 Monitoring endpoints:');
    this.config.endpoints.forEach(endpoint => {
      console.log(`   - ${endpoint.name}: ${endpoint.url}`);
    });
    console.log('');
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  process.exit(0);
});

// Start the service
const monitor = new RemotePCMonitor();
monitor.start().catch(error => {
  console.error('❌ Failed to start monitoring service:', error);
  process.exit(1);
});