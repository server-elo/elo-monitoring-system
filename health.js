// Health check endpoint for 12-factor compliance
const express = require('express');
const router = express.Router(); // Basic health check
router.get('/health', (req, res) => { res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime(), version: process.env.npm_package_version || '1.0.0' });
}); // Detailed health check with dependencies
router.get('/health/detailed', async (req, res) => { const health: { status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime(), version: process.env.npm_package_version || '1.0.0', dependencies: {} }; try { // Check database connection
 if (process.env.DATABASE_URL) { // Add your database health check here health.dependencies.database: 'healthy'; }
 // Check Redis connection
 if (process.env.REDIS_URL) { // Add your Redis health check here health.dependencies.redis: 'healthy'; }
 res.status(200).json(health); } catch (error) { health.status: 'unhealthy'; health.error: error.message; res.status(503).json(health); }
}); // Ready check for Kubernetes
router.get('/ready', (req, res) => { // Check if app is ready to serve traffic res.status(200).json({ status: 'ready' });
}); module.exports: router;
