#!/usr/bin/env node

/**
 * Worker Process Entry Point
 * Implements 12-Factor Admin Processes
 */

const path = require('path');
const { performance } = require('perf_hooks');

// Worker type detection
const workerType = process.env.WORKER_TYPE || 'unknown';
const workerName = process.env.WORKER_NAME || `worker-${process.pid}`;

console.log(`🔧 Starting worker: ${workerName} (${workerType})`);
console.log(`📍 Process ID: ${process.pid}`);
console.log(`🕐 Started at: ${new Date().toISOString()}`);

// Graceful shutdown handling
let isShuttingDown = false;

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) {
    console.log('⚠️  Shutdown already in progress...');
    return;
  }

  isShuttingDown = true;
  console.log(`\n📡 Received ${signal}, shutting down worker gracefully...`);

  try {
    // Cleanup worker-specific resources
    await cleanup();
    
    console.log('✅ Worker shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Register signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR1', () => gracefulShutdown('SIGUSR1'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception in worker:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection in worker:', reason);
  gracefulShutdown('unhandledRejection');
});

/**
 * Worker-specific cleanup function
 */
async function cleanup() {
  console.log('🧹 Cleaning up worker resources...');
  
  // Add worker-specific cleanup logic here
  switch (workerType) {
    case 'background':
      console.log('🔄 Stopping background tasks...');
      // Stop background task processing
      break;
      
    case 'metrics':
      console.log('📊 Flushing metrics...');
      // Flush pending metrics
      break;
      
    case 'cache':
      console.log('💾 Clearing cache operations...');
      // Clear pending cache operations
      break;
      
    default:
      console.log('🔧 Default worker cleanup...');
  }
  
  // Simulate cleanup delay
  await new Promise(resolve => setTimeout(resolve, 1000));
}

/**
 * Main worker execution
 */
async function runWorker() {
  try {
    console.log(`🚀 Worker ${workerName} is now running`);
    
    // Simulate worker activity
    let taskCount = 0;
    const startTime = performance.now();
    
    const interval = setInterval(() => {
      if (isShuttingDown) {
        clearInterval(interval);
        return;
      }
      
      taskCount++;
      const uptime = Math.round((performance.now() - startTime) / 1000);
      
      console.log(`⚡ Worker ${workerName} - Task ${taskCount} completed (uptime: ${uptime}s)`);
      
      // Simulate different worker behaviors
      switch (workerType) {
        case 'background':
          // Simulate background task processing
          console.log('🔄 Processing background job...');
          break;
          
        case 'metrics':
          // Simulate metrics collection
          console.log('📊 Collecting system metrics...');
          break;
          
        case 'cache':
          // Simulate cache operations
          console.log('💾 Warming cache entries...');
          break;
          
        default:
          console.log('🔧 Default worker task...');
      }
      
    }, 10000); // Run every 10 seconds
    
  } catch (error) {
    console.error('❌ Worker execution failed:', error);
    process.exit(1);
  }
}

// Health check endpoint simulation
const healthCheck = () => {
  return {
    status: 'healthy',
    worker: workerName,
    type: workerType,
    pid: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  };
};

// Report health status periodically
setInterval(() => {
  if (!isShuttingDown) {
    const health = healthCheck();
    console.log(`💚 Health check: ${JSON.stringify(health)}`);
  }
}, 30000); // Every 30 seconds

// Start the worker
runWorker().catch((error) => {
  console.error('❌ Failed to start worker:', error);
  process.exit(1);
});