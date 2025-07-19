#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up PRP Real-Time Monitoring...\n');

// Read monitoring config
const configPath = path.join(process.cwd(), 'monitoring-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Create monitoring directory structure
const monitoringDir = path.join(process.cwd(), '.monitoring');
const directories = [
  '.monitoring/logs',
  '.monitoring/metrics',
  '.monitoring/alerts',
  '.monitoring/dashboards'
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Define apiDir globally
const apiDir = path.join(process.cwd(), 'pages/api');
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}

// Setup health check endpoints
if (config.monitoring.health_checks.enabled) {
  console.log('\n📊 Configuring health check endpoints...');
  
  // Create health check API route
  const healthCheckRoute = `
export default function handler(req, res) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  };
  
  res.status(200).json(health);
}
`;
  
  fs.writeFileSync(path.join(apiDir, 'health.js'), healthCheckRoute);
  console.log('✅ Created /api/health endpoint');
  
  // Create database health check
  const dbHealthRoute = `
export default async function handler(req, res) {
  try {
    // Add your database connection check here
    // Example: await db.ping();
    
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
`;
  
  const healthDir = path.join(apiDir, 'health');
  if (!fs.existsSync(healthDir)) {
    fs.mkdirSync(healthDir, { recursive: true });
  }
  fs.writeFileSync(path.join(healthDir, 'db.js'), dbHealthRoute);
  console.log('✅ Created /api/health/db endpoint');
}

// Setup performance monitoring
if (config.monitoring.performance_metrics.enabled) {
  console.log('\n📈 Setting up performance monitoring...');
  
  const performanceMiddleware = `
const performanceMonitoring = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const metrics = {
      path: req.path,
      method: req.method,
      statusCode: res.statusCode,
      responseTime: duration,
      timestamp: new Date().toISOString()
    };
    
    // Log metrics (you can send to monitoring service)
    console.log('Performance:', metrics);
  });
  
  next();
};

module.exports = performanceMonitoring;
`;
  
  fs.writeFileSync(
    path.join(process.cwd(), '.monitoring/performance-middleware.js'),
    performanceMiddleware
  );
  console.log('✅ Created performance monitoring middleware');
}

// Setup error tracking
if (config.monitoring.error_tracking.enabled) {
  console.log('\n🚨 Setting up error tracking...');
  
  const errorHandler = `
const errorTracking = (err, req, res, next) => {
  const errorInfo = {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    ip: req.ip
  };
  
  // Log error (you can send to monitoring service)
  console.error('Error tracked:', errorInfo);
  
  // Continue with default error handling
  next(err);
};

module.exports = errorTracking;
`;
  
  fs.writeFileSync(
    path.join(process.cwd(), '.monitoring/error-tracking.js'),
    errorHandler
  );
  console.log('✅ Created error tracking handler');
}

// Setup Prometheus metrics endpoint
if (config.monitoring.integrations.prometheus.enabled) {
  console.log('\n📊 Setting up Prometheus integration...');
  
  const prometheusRoute = `
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Define metrics
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

export default async function handler(req, res) {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
}
`;
  
  fs.writeFileSync(
    path.join(apiDir, 'metrics.js'),
    prometheusRoute
  );
  console.log('✅ Created /api/metrics endpoint for Prometheus');
}

// Create monitoring dashboard HTML
const dashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PRP Monitoring Dashboard</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .dashboard {
      max-width: 1200px;
      margin: 0 auto;
    }
    .metric-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .metric-value {
      font-size: 2em;
      font-weight: bold;
      color: #333;
    }
    .metric-label {
      color: #666;
      margin-top: 5px;
    }
    .status-healthy {
      color: #4CAF50;
    }
    .status-warning {
      color: #FF9800;
    }
    .status-critical {
      color: #F44336;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <h1>PRP Monitoring Dashboard</h1>
    
    <div class="grid">
      <div class="metric-card">
        <div class="metric-value status-healthy" id="health-status">Healthy</div>
        <div class="metric-label">System Status</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-value" id="response-time">0ms</div>
        <div class="metric-label">Avg Response Time</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-value" id="error-rate">0%</div>
        <div class="metric-label">Error Rate</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-value" id="active-users">0</div>
        <div class="metric-label">Active Users</div>
      </div>
    </div>
    
    <div class="metric-card">
      <h2>Recent Alerts</h2>
      <div id="alerts-list">No alerts</div>
    </div>
  </div>
  
  <script>
    // Update metrics every 5 seconds
    setInterval(async () => {
      try {
        const health = await fetch('/api/health').then(r => r.json());
        document.getElementById('health-status').textContent = 
          health.status === 'healthy' ? 'Healthy' : 'Unhealthy';
        document.getElementById('health-status').className = 
          'metric-value ' + (health.status === 'healthy' ? 'status-healthy' : 'status-critical');
      } catch (error) {
        console.error('Failed to fetch health status:', error);
      }
    }, 5000);
  </script>
</body>
</html>
`;

fs.writeFileSync(
  path.join(process.cwd(), '.monitoring/dashboard.html'),
  dashboardHTML
);
console.log('✅ Created monitoring dashboard');

// Create Docker Compose for monitoring stack
const dockerCompose = `
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    ports:
      - "9090:9090"
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3001:3000"
    restart: unless-stopped

  node_exporter:
    image: prom/node-exporter:latest
    container_name: node_exporter
    command:
      - '--path.rootfs=/host'
    volumes:
      - '/:/host:ro,rslave'
    ports:
      - "9100:9100"
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
`;

fs.writeFileSync(
  path.join(process.cwd(), 'docker-compose.monitoring.yml'),
  dockerCompose
);
console.log('✅ Created Docker Compose configuration');

// Create Prometheus configuration
const prometheusConfig = `
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'app'
    static_configs:
      - targets: ['host.docker.internal:3000']
    metrics_path: '/api/metrics'
    
  - job_name: 'node'
    static_configs:
      - targets: ['node_exporter:9100']
`;

fs.writeFileSync(
  path.join(process.cwd(), 'prometheus.yml'),
  prometheusConfig
);
console.log('✅ Created Prometheus configuration');

console.log(`
\n✨ Monitoring setup complete!

📊 Next steps:
1. Start the monitoring stack:
   docker-compose -f docker-compose.monitoring.yml up -d

2. Access monitoring tools:
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001 (admin/admin)
   - Dashboard: file://${path.join(process.cwd(), '.monitoring/dashboard.html')}

3. Test health endpoints:
   - curl http://localhost:3000/api/health
   - curl http://localhost:3000/api/health/db

4. View metrics:
   - curl http://localhost:3000/api/metrics

📚 Configuration file: monitoring-config.json
`);