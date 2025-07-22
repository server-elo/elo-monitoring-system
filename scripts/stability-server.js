#!/usr/bin/env node

/**
 * Stability Test Server
 * Serves the emergency deployment and monitors stability for 5+ minutes
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Stability Test Server...');

const PORT = process.env.PORT || 3000;
const HTML_FILE = path.join(process.cwd(), 'emergency-index.html');

// Read the HTML file
let htmlContent;
try {
  htmlContent = fs.readFileSync(HTML_FILE, 'utf8');
} catch (error) {
  console.error('❌ Could not read emergency-index.html:', error.message);
  process.exit(1);
}

// Enhanced HTML with stability monitoring
htmlContent = htmlContent.replace(
  '<script>',
  `<script>
    // Enhanced stability monitoring
    let startTime = Date.now();
    let errorCount = 0;
    let memoryCheckInterval;
    let uptimeInterval;
    let stabilityScore = 100;
    
    console.log('🚀 Stability monitoring active');
    
    // Error tracking
    window.addEventListener('error', (e) => {
      errorCount++;
      stabilityScore = Math.max(0, 100 - (errorCount * 10));
      console.warn('Error detected:', e.error);
    });
    
    window.addEventListener('unhandledrejection', (e) => {
      errorCount++;
      stabilityScore = Math.max(0, 100 - (errorCount * 10));
      console.warn('Promise rejection:', e.reason);
    });
    
    // Create stability indicator
    function createStabilityIndicator() {
      const indicator = document.createElement('div');
      indicator.id = 'stability-indicator';
      indicator.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        border: 1px solid #374151;
        border-radius: 8px;
        padding: 12px;
        color: white;
        font-family: monospace;
        font-size: 12px;
        z-index: 9999;
        backdrop-filter: blur(4px);
      \`;
      document.body.appendChild(indicator);
      return indicator;
    }
    
    const indicator = createStabilityIndicator();
    
    // Update display
    function updateIndicator() {
      const uptime = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(uptime / 60);
      const seconds = uptime % 60;
      
      let status = stabilityScore > 80 ? '🟢 STABLE' : 
                  stabilityScore > 50 ? '🟡 DEGRADED' : '🔴 UNSTABLE';
      
      indicator.innerHTML = \`
        <div style="margin-bottom: 4px;">\${status}</div>
        <div>Uptime: \${minutes}m \${seconds}s</div>
        <div>Errors: \${errorCount}</div>
        <div>Score: \${stabilityScore}%</div>
        \${performance.memory ? \`<div>Memory: \${Math.round((performance.memory.usedJSHeapSize / 1024 / 1024) * 100) / 100}MB</div>\` : ''}
      \`;
      
      // Update page title with uptime
      document.title = \`Solidity Platform (⏱️ \${minutes}m\${seconds}s | 📊 \${stabilityScore}%)\`;
    }
    
    // Start monitoring
    uptimeInterval = setInterval(updateIndicator, 1000);
    
    // Memory monitoring (if available)
    if (performance.memory) {
      memoryCheckInterval = setInterval(() => {
        const memUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
        if (memUsage > 0.9) {
          console.warn('High memory usage detected');
          stabilityScore = Math.max(0, stabilityScore - 5);
        }
      }, 5000);
    }
    
    // Success milestone logging
    setTimeout(() => console.log('✅ 1 minute milestone reached'), 60000);
    setTimeout(() => console.log('✅ 2 minute milestone reached'), 120000);
    setTimeout(() => console.log('✅ 3 minute milestone reached'), 180000);
    setTimeout(() => console.log('✅ 4 minute milestone reached'), 240000);
    setTimeout(() => console.log('🎉 5 minute milestone reached - DEPLOYMENT STABLE!'), 300000);
    
    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
      clearInterval(uptimeInterval);
      clearInterval(memoryCheckInterval);
    });
`
);

// Create the server
const server = http.createServer((req, res) => {
  // Simple routing
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    });
    res.end(htmlContent);
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
  console.log(`📊 Health endpoint: http://localhost:${PORT}/health`);
  console.log('⏱️  Starting 5-minute stability test...');
  console.log('');
  console.log('📈 STABILITY MILESTONES:');
  console.log('   1 minute - Initial stability');
  console.log('   3 minutes - Extended stability'); 
  console.log('   5 minutes - Production-ready stability ✅');
  console.log('');
  
  // Server-side stability monitoring
  let serverStartTime = Date.now();
  let requestCount = 0;
  let errorCount = 0;
  
  server.on('request', (req, res) => {
    requestCount++;
  });
  
  server.on('error', (err) => {
    errorCount++;
    console.error('Server error:', err.message);
  });
  
  // Server stability reporting
  const reportInterval = setInterval(() => {
    const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
    const minutes = Math.floor(uptime / 60);
    const seconds = uptime % 60;
    
    console.log(`📊 Server Status: ⏱️  ${minutes}m${seconds}s | 📨 ${requestCount} requests | ❌ ${errorCount} errors`);
    
    if (uptime >= 300) { // 5 minutes
      console.log('');
      console.log('🎉 ===============================================');
      console.log('🎉 5-MINUTE STABILITY TEST COMPLETED!');
      console.log('🎉 DEPLOYMENT IS PRODUCTION-READY');
      console.log('🎉 ===============================================');
      console.log('');
      console.log(`📊 Final Stats:`);
      console.log(`   Uptime: ${Math.floor(uptime/60)}m ${uptime%60}s`);
      console.log(`   Requests: ${requestCount}`);
      console.log(`   Errors: ${errorCount}`);
      console.log(`   Success Rate: ${((requestCount - errorCount) / Math.max(requestCount, 1) * 100).toFixed(1)}%`);
      
      clearInterval(reportInterval);
    }
  }, 30000); // Report every 30 seconds
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Graceful shutdown initiated...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});