#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Load monitoring configuration
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'monitoring-config.json'), 'utf8'));

// System information
const systemInfo = {
  hostname: os.hostname(),
  username: os.userInfo().username,
  platform: os.platform(),
  arch: os.arch(),
  nodeVersion: process.version,
  pid: process.pid,
  startTime: new Date().toISOString()
};

// State tracking with PC/User separation
const metrics = {
  responseTime: [],
  errorCount: 0,
  successCount: 0,
  uptime: Date.now(),
  lastCheck: null,
  healthChecks: {},
  alerts: [],
  systemInfo: systemInfo,
  pcInstances: new Map() // Track different PC instances
};

// Helper function to calculate average
function average(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Perform health checks
async function performHealthCheck(endpoint) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(endpoint.url, {
      method: 'GET',
      timeout: endpoint.timeout || 5000
    });
    
    const duration = Date.now() - startTime;
    metrics.responseTime.push(duration);
    
    // Keep only last 100 response times
    if (metrics.responseTime.length > 100) {
      metrics.responseTime.shift();
    }
    
    const status = response.status === (endpoint.expected_status || 200) ? 'healthy' : 'unhealthy';
    
    metrics.healthChecks[endpoint.name] = {
      status,
      statusCode: response.status,
      responseTime: duration,
      lastCheck: new Date().toISOString()
    };
    
    if (status === 'healthy') {
      metrics.successCount++;
    } else {
      metrics.errorCount++;
      checkAlerts(endpoint.name, 'unhealthy', response.status);
    }
    
    return { success: true, duration, status };
  } catch (error) {
    metrics.errorCount++;
    metrics.healthChecks[endpoint.name] = {
      status: 'error',
      error: error.message,
      lastCheck: new Date().toISOString()
    };
    
    checkAlerts(endpoint.name, 'error', error.message);
    return { success: false, error: error.message };
  }
}

// Check alert conditions
function checkAlerts(endpointName, condition, details) {
  const alert = {
    endpoint: endpointName,
    condition,
    details,
    timestamp: new Date().toISOString(),
    pc: {
      hostname: systemInfo.hostname,
      username: systemInfo.username,
      pid: systemInfo.pid
    }
  };
  
  metrics.alerts.push(alert);
  
  // Keep only last 50 alerts
  if (metrics.alerts.length > 50) {
    metrics.alerts.shift();
  }
  
  // Log alert to console with PC info
  console.log(`🚨 ALERT [${systemInfo.username}@${systemInfo.hostname}]: ${endpointName} - ${condition} - ${details}`);
}

// Run all health checks
async function runHealthChecks() {
  if (!config.monitoring.health_checks.enabled) return;
  
  console.log('🔍 Running health checks...');
  
  for (const endpoint of config.monitoring.health_checks.endpoints) {
    await performHealthCheck(endpoint);
  }
  
  metrics.lastCheck = new Date().toISOString();
  
  // Report to central service
  await reportToCentralService();
}

// Calculate metrics
function calculateMetrics() {
  const avgResponseTime = average(metrics.responseTime);
  const errorRate = metrics.successCount > 0 
    ? (metrics.errorCount / (metrics.errorCount + metrics.successCount)) * 100 
    : 0;
  
  // Group alerts by PC
  const alertsByPC = {};
  metrics.alerts.forEach(alert => {
    const pcKey = `${alert.pc?.username || 'unknown'}@${alert.pc?.hostname || 'unknown'}`;
    if (!alertsByPC[pcKey]) {
      alertsByPC[pcKey] = [];
    }
    alertsByPC[pcKey].push(alert);
  });
  
  return {
    avgResponseTime: Math.round(avgResponseTime),
    errorRate: errorRate.toFixed(2),
    uptime: Math.floor((Date.now() - metrics.uptime) / 1000),
    totalChecks: metrics.successCount + metrics.errorCount,
    successCount: metrics.successCount,
    errorCount: metrics.errorCount,
    healthChecks: metrics.healthChecks,
    recentAlerts: metrics.alerts.slice(-10),
    alertsByPC: alertsByPC,
    systemInfo: metrics.systemInfo,
    pcId: `${systemInfo.username}@${systemInfo.hostname}`,
    environment: {
      hostname: systemInfo.hostname,
      username: systemInfo.username,
      platform: systemInfo.platform,
      nodeVersion: systemInfo.nodeVersion,
      pid: systemInfo.pid,
      startTime: systemInfo.startTime
    }
  };
}

// Report metrics to central service
async function reportToCentralService() {
  try {
    const metricsData = calculateMetrics();
    
    // Try to register with central service
    const response = await fetch('http://localhost:3001/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metricsData),
      timeout: 3000
    });
    
    if (response.ok) {
      console.log(`📊 Reported to central service: ${metricsData.pcId}`);
    }
  } catch (error) {
    // Central service not available - this is normal
    // Don't log error to avoid spam
  }
}

// Create monitoring server
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.url === '/' || req.url === '/dashboard') {
    // Serve the dashboard HTML
    const dashboardPath = path.join(__dirname, '.monitoring/dashboard.html');
    if (fs.existsSync(dashboardPath)) {
      res.setHeader('Content-Type', 'text/html');
      res.writeHead(200);
      res.end(fs.readFileSync(dashboardPath));
    } else {
      res.writeHead(404);
      res.end('Dashboard not found');
    }
  } else if (req.url === '/metrics') {
    res.setHeader('Content-Type', 'application/json');
    const currentMetrics = calculateMetrics();
    res.writeHead(200);
    res.end(JSON.stringify(currentMetrics, null, 2));
  } else if (req.url === '/health') {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'healthy', service: 'monitoring' }));
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(404);
    res.end(JSON.stringify({ 
      error: 'Not found', 
      availableEndpoints: [
        'GET / - Dashboard',
        'GET /dashboard - Dashboard', 
        'GET /metrics - Metrics API',
        'GET /health - Health check'
      ]
    }));
  }
});

// Start monitoring service
const PORT = process.env.MONITORING_PORT || 3002;
server.listen(PORT, () => {
  console.log(`
🚀 PRP Monitoring Service Started!
================================
📊 Metrics API: http://localhost:${PORT}/metrics
💚 Health Check: http://localhost:${PORT}/health
📈 Dashboard: http://localhost:${PORT}/dashboard

⏰ Health check interval: ${config.monitoring.health_checks.endpoints[0]?.interval || 30}s
🎯 Monitoring endpoints:
${config.monitoring.health_checks.endpoints.map(e => `   - ${e.name}: ${e.url}`).join('\n')}
  `);
  
  // Run initial health check
  runHealthChecks();
  
  // Schedule periodic health checks
  setInterval(runHealthChecks, (config.monitoring.health_checks.endpoints[0]?.interval || 30) * 1000);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down monitoring service...');
  server.close(() => {
    console.log('✅ Monitoring service stopped');
    process.exit(0);
  });
});