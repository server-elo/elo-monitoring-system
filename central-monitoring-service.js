#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Central monitoring aggregator configuration
const config = {
  port: 3001,
  registeredPCs: new Map(),
  maxPCAge: 5 * 60 * 1000, // 5 minutes
  aggregationInterval: 10000, // 10 seconds
  discoveryPorts: [3002, 3003, 3004, 3005] // Ports to scan for PC monitoring services
};

// Central state for all PCs
const centralState = {
  allPCs: new Map(),
  aggregatedMetrics: {
    totalPCs: 0,
    activePCs: 0,
    totalAlerts: 0,
    totalErrors: 0,
    averageResponseTime: 0,
    lastUpdate: null
  },
  centralAlerts: [],
  pcHealthStatus: new Map()
};

// Helper functions
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function generatePCId(pcData) {
  return `${pcData.environment?.username || 'unknown'}@${pcData.environment?.hostname || 'unknown'}`;
}

// PC Discovery - scan for monitoring services
async function discoverPCs() {
  console.log('🔍 Discovering PC monitoring services...');
  
  for (const port of config.discoveryPorts) {
    try {
      const response = await fetch(`http://localhost:${port}/metrics`, {
        method: 'GET',
        timeout: 3000
      });
      
      if (response.ok) {
        const pcData = await response.json();
        const pcId = generatePCId(pcData);
        
        // Register/update PC
        centralState.allPCs.set(pcId, {
          ...pcData,
          discoveryPort: port,
          lastSeen: Date.now(),
          status: 'active'
        });
        
        console.log(`✅ Discovered PC: ${pcId} on port ${port}`);
      }
    } catch (error) {
      // PC not available on this port - this is normal
    }
  }
}

// Aggregate metrics from all PCs
function aggregateMetrics() {
  const activePCs = Array.from(centralState.allPCs.values())
    .filter(pc => (Date.now() - pc.lastSeen) < config.maxPCAge);
  
  let totalErrors = 0;
  let totalAlerts = 0;
  let totalResponseTimes = [];
  
  activePCs.forEach(pc => {
    totalErrors += pc.errorCount || 0;
    totalAlerts += (pc.recentAlerts?.length || 0);
    if (pc.avgResponseTime) {
      totalResponseTimes.push(pc.avgResponseTime);
    }
  });
  
  centralState.aggregatedMetrics = {
    totalPCs: centralState.allPCs.size,
    activePCs: activePCs.length,
    totalAlerts,
    totalErrors,
    averageResponseTime: totalResponseTimes.length > 0 
      ? Math.round(totalResponseTimes.reduce((a, b) => a + b, 0) / totalResponseTimes.length)
      : 0,
    lastUpdate: new Date().toISOString()
  };
}

// Clean up old PC data
function cleanupOldPCs() {
  const now = Date.now();
  for (const [pcId, pcData] of centralState.allPCs.entries()) {
    if ((now - pcData.lastSeen) > config.maxPCAge) {
      console.log(`🗑️ Removing inactive PC: ${pcId}`);
      centralState.allPCs.delete(pcId);
    }
  }
}

// Generate unified dashboard
function generateUnifiedDashboard() {
  const activePCs = Array.from(centralState.allPCs.entries());
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Central Multi-PC Monitoring Dashboard</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
    }
    .dashboard {
      max-width: 1400px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 2.5em;
      margin: 0;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    .central-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 20px;
      text-align: center;
      border: 1px solid rgba(255,255,255,0.2);
    }
    .stat-value {
      font-size: 2.5em;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .stat-label {
      font-size: 0.9em;
      opacity: 0.8;
    }
    .pc-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .pc-card {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 20px;
      border: 1px solid rgba(255,255,255,0.2);
    }
    .pc-header {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }
    .pc-status {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 10px;
    }
    .status-active { background: #4CAF50; }
    .status-warning { background: #FF9800; }
    .status-error { background: #F44336; }
    .status-offline { background: #666; }
    .pc-name {
      font-size: 1.2em;
      font-weight: bold;
    }
    .pc-metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 10px;
    }
    .metric {
      text-align: center;
      padding: 8px;
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
    }
    .metric-value {
      font-size: 1.5em;
      font-weight: bold;
    }
    .metric-label {
      font-size: 0.8em;
      opacity: 0.8;
    }
    .alerts-section {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 20px;
      border: 1px solid rgba(255,255,255,0.2);
    }
    .alert-item {
      background: rgba(255,255,255,0.1);
      padding: 10px;
      border-radius: 8px;
      margin-bottom: 10px;
      border-left: 4px solid #F44336;
    }
    .refresh-indicator {
      text-align: center;
      margin-top: 20px;
      opacity: 0.7;
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <div class="header">
      <h1>🌐 Central Multi-PC Monitoring</h1>
      <p>Real-time monitoring across all development machines</p>
    </div>
    
    <div class="central-stats">
      <div class="stat-card">
        <div class="stat-value" id="total-pcs">${centralState.aggregatedMetrics.totalPCs}</div>
        <div class="stat-label">Total PCs</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="active-pcs">${centralState.aggregatedMetrics.activePCs}</div>
        <div class="stat-label">Active PCs</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="total-alerts">${centralState.aggregatedMetrics.totalAlerts}</div>
        <div class="stat-label">Total Alerts</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="avg-response">${centralState.aggregatedMetrics.averageResponseTime}ms</div>
        <div class="stat-label">Avg Response</div>
      </div>
    </div>
    
    <div class="pc-grid" id="pc-grid">
      ${activePCs.map(([pcId, pcData]) => {
        const isHealthy = Object.values(pcData.healthChecks || {}).every(check => check.status === 'healthy');
        const statusClass = isHealthy ? 'status-active' : 'status-error';
        
        return `
          <div class="pc-card">
            <div class="pc-header">
              <div class="pc-status ${statusClass}"></div>
              <div class="pc-name">💻 ${pcId}</div>
            </div>
            <div><strong>Platform:</strong> ${pcData.environment?.platform || 'Unknown'}</div>
            <div><strong>Uptime:</strong> ${formatUptime(pcData.uptime || 0)}</div>
            <div><strong>Last Seen:</strong> ${new Date(pcData.lastSeen).toLocaleTimeString()}</div>
            
            <div class="pc-metrics">
              <div class="metric">
                <div class="metric-value">${pcData.avgResponseTime || 0}ms</div>
                <div class="metric-label">Response Time</div>
              </div>
              <div class="metric">
                <div class="metric-value">${pcData.errorRate || 0}%</div>
                <div class="metric-label">Error Rate</div>
              </div>
              <div class="metric">
                <div class="metric-value">${pcData.totalChecks || 0}</div>
                <div class="metric-label">Total Checks</div>
              </div>
              <div class="metric">
                <div class="metric-value">${(pcData.recentAlerts?.length || 0)}</div>
                <div class="metric-label">Recent Alerts</div>
              </div>
            </div>
            
            ${pcData.recentAlerts?.length > 0 ? `
              <div style="margin-top: 15px;">
                <strong>Recent Alerts:</strong>
                ${pcData.recentAlerts.slice(0, 3).map(alert => `
                  <div class="alert-item">
                    ${alert.endpoint}: ${alert.condition}
                    <div style="font-size: 0.8em; opacity: 0.8;">
                      ${new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : '<div style="margin-top: 15px; color: #4CAF50;">✅ No recent alerts</div>'}
          </div>
        `;
      }).join('')}
    </div>
    
    <div class="alerts-section">
      <h2>🚨 Cross-PC Alert Summary</h2>
      <div id="all-alerts">
        ${activePCs.flatMap(([pcId, pcData]) => 
          (pcData.recentAlerts || []).map(alert => `
            <div class="alert-item">
              <strong>[${pcId}]</strong> ${alert.endpoint}: ${alert.condition}
              <div style="font-size: 0.8em; opacity: 0.8;">
                ${new Date(alert.timestamp).toLocaleString()}
              </div>
            </div>
          `)
        ).join('') || '<div style="color: #4CAF50;">✅ No alerts across all PCs</div>'}
      </div>
    </div>
    
    <div class="refresh-indicator">
      <div>Last updated: <span id="last-update">${centralState.aggregatedMetrics.lastUpdate || 'Never'}</span></div>
      <div>Auto-refresh every 10 seconds</div>
    </div>
  </div>
  
  <script>
    // Auto-refresh dashboard every 10 seconds
    setInterval(() => {
      window.location.reload();
    }, 10000);
    
    // Update last update time
    document.getElementById('last-update').textContent = new Date().toLocaleString();
  </script>
</body>
</html>
  `;
}

// Create central monitoring server
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.url === '/' || req.url === '/dashboard') {
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(generateUnifiedDashboard());
  } else if (req.url === '/metrics') {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({
      aggregatedMetrics: centralState.aggregatedMetrics,
      allPCs: Object.fromEntries(centralState.allPCs),
      pcCount: centralState.allPCs.size,
      discoveryPorts: config.discoveryPorts,
      lastUpdate: centralState.aggregatedMetrics.lastUpdate
    }, null, 2));
  } else if (req.url === '/health') {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'central-monitoring',
      activePCs: centralState.aggregatedMetrics.activePCs,
      totalPCs: centralState.aggregatedMetrics.totalPCs
    }));
  } else if (req.url === '/register' && req.method === 'POST') {
    // Allow PCs to register themselves
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const pcData = JSON.parse(body);
        const pcId = generatePCId(pcData);
        
        centralState.allPCs.set(pcId, {
          ...pcData,
          lastSeen: Date.now(),
          status: 'active'
        });
        
        console.log(`📝 PC registered: ${pcId}`);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, pcId }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid registration data' }));
      }
    });
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(404);
    res.end(JSON.stringify({
      error: 'Not found',
      availableEndpoints: [
        'GET / - Central Dashboard',
        'GET /dashboard - Central Dashboard',
        'GET /metrics - Aggregated Metrics',
        'GET /health - Service Health',
        'POST /register - PC Registration'
      ]
    }));
  }
});

// Start central monitoring service
server.listen(config.port, () => {
  console.log(`
🌐 Central Multi-PC Monitoring Service Started!
===============================================
📊 Central Dashboard: http://localhost:${config.port}
📈 Aggregated Metrics: http://localhost:${config.port}/metrics
💚 Health Check: http://localhost:${config.port}/health
📝 PC Registration: http://localhost:${config.port}/register

🔍 Scanning for PCs on ports: ${config.discoveryPorts.join(', ')}
⏰ Discovery interval: ${config.aggregationInterval / 1000}s
🎯 Max PC age: ${config.maxPCAge / 1000}s
  `);
  
  // Start discovery and aggregation
  discoverPCs();
  aggregateMetrics();
  
  // Set up periodic tasks
  setInterval(() => {
    discoverPCs();
    aggregateMetrics();
    cleanupOldPCs();
  }, config.aggregationInterval);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down central monitoring service...');
  server.close(() => {
    console.log('✅ Central monitoring service stopped');
    process.exit(0);
  });
});