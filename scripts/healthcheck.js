#!/usr/bin/env node

/**
 * Health check script for monitoring application health
 * Implements 12-factor principle XI: Logs as event streams
 */

const http = require('http');
const { execSync } = require('child_process');

const checks = {
  server: async () => {
    return new Promise((resolve) => {
      http.get('http://localhost:3000/api/health', (res) => {
        resolve(res.statusCode === 200);
      }).on('error', () => resolve(false));
    });
  },

  database: async () => {
    try {
      execSync('npx prisma db execute --stdin < /dev/null', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  },

  redis: async () => {
    try {
      const redis = require('redis');
      const client = redis.createClient({ url: process.env.REDIS_URL });
      await client.connect();
      await client.ping();
      await client.quit();
      return true;
    } catch {
      return false;
    }
  },

  memory: () => {
    const used = process.memoryUsage();
    const heapPercentage = (used.heapUsed / used.heapTotal) * 100;
    return heapPercentage < 90;
  },

  diskSpace: () => {
    try {
      const output = execSync('df -h / | tail -1').toString();
      const percentage = parseInt(output.split(/\s+/)[4]);
      return percentage < 90;
    } catch {
      return true; // Default to healthy if check fails
    }
  }
};

async function runHealthChecks() {
  const results = {};
  let allHealthy = true;

  for (const [name, check] of Object.entries(checks)) {
    try {
      const isHealthy = await check();
      results[name] = { status: isHealthy ? 'healthy' : 'unhealthy' };
      if (!isHealthy) allHealthy = false;
    } catch (error) {
      results[name] = { status: 'error', message: error.message };
      allHealthy = false;
    }
  }

  // Log as JSON event stream (12-factor principle XI)
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'health_check',
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks: results
  }));

  process.exit(allHealthy ? 0 : 1);
}

// Handle graceful shutdown (12-factor principle IX)
process.on('SIGTERM', () => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'shutdown',
    message: 'Health check shutting down'
  }));
  process.exit(0);
});

runHealthChecks();