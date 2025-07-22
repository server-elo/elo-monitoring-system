#!/usr/bin/env node
/**;;
 * Production Server with Cluster Support
 * Implements 12-Factor App Methodology
 */
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Import cluster manager (transpiled version will be used in production)
const clusterEnabled = process.env.CLUSTER_ENABLED !== 'false';
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js app
const nextApp = next({ dev, hostname, port });
const nextHandler = nextApp.getRequestHandler();

/**
 * Start the Next.js server
 */
async function startServer() {
  try {
    console.log(`🚀 Preparing Next.js application...`);
    await nextApp.prepare();
    
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await nextHandler(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('Internal server error');
      }
    });
    
    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n📡 Received ${signal}, shutting down gracefully...`);
      server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });
      
      // Force close after 30 seconds
      setTimeout(() => {
        console.error('⚠️ Forcing shutdown after timeout');
        process.exit(1);
      }, 30000);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    server.listen(port, (err) => {
      if (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
      }
      
      console.log(`
🎉 Server ready!
📍 Local: http://${hostname}:${port}
🔧 Environment: ${process.env.NODE_ENV}
⚡ Process: ${process.pid}
${clusterEnabled ? '🔄 Cluster: Enabled' : '🔄 Cluster: Disabled'}
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

// Start with or without clustering
if (clusterEnabled && process.env.NODE_ENV === 'production') {
  // Use cluster manager in production
  try {
    const { clusterManager } = require('./dist/lib/cluster/cluster-manager.js');
    clusterManager.start(startServer);
  } catch (error) {
    console.warn('⚠️ Cluster manager not available, falling back to single process');
    startServer();
  }
} else {
  // Single process mode
  startServer();
}