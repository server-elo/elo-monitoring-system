const fs = require('fs');
const path = require('path');

function loadEnvFile(filename) {
  try {
    const envPath = path.join(process.cwd(), filename);
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && !key.startsWith('#') && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      });
      console.log(`📁 Loaded environment from ${filename}`);
      return true;
    }
  } catch (error) {
    console.log(`⚠️ Could not load ${filename}:`, error.message);
  }
  return false;
}

// Load environment-specific configuration
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = `.env.${nodeEnv}`;

// Try to load environment-specific file first, then fallback to .env
if (!loadEnvFile(envFile)) {
  loadEnvFile('.env');
}

// Configuration object with validation
const config = {
  // Application
  nodeEnv,
  port: parseInt(process.env.PORT) || 3001,
  
  // Security
  apiSecretKey: process.env.API_SECRET_KEY || 'default-dev-key',
  jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret',
  apiRateLimit: parseInt(process.env.API_RATE_LIMIT) || 100,
  
  // Remote Connectivity
  centralServiceUrl: process.env.CENTRAL_SERVICE_URL || 'http://localhost:3001',
  ngrokEnabled: process.env.NGROK_ENABLED === 'true',
  ngrokSubdomain: process.env.NGROK_SUBDOMAIN || '',
  
  // CORS Settings
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3002').split(','),
  corsCredentials: process.env.CORS_CREDENTIALS !== 'false',
  
  // Monitoring
  healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
  discoveryInterval: parseInt(process.env.DISCOVERY_INTERVAL) || 10000,
  pcTimeout: parseInt(process.env.PC_TIMEOUT) || 300000,
  
  // Cloud Deployment
  herokuAppName: process.env.HEROKU_APP_NAME || '',
  railwayProjectId: process.env.RAILWAY_PROJECT_ID || '',
  domainName: process.env.DOMAIN_NAME || 'localhost',
  
  // SSL/HTTPS
  sslEnabled: process.env.SSL_ENABLED === 'true',
  sslCertPath: process.env.SSL_CERT_PATH || '',
  sslKeyPath: process.env.SSL_KEY_PATH || '',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logFormat: process.env.LOG_FORMAT || 'console'
};

// Validation
function validateConfig() {
  const errors = [];
  
  if (config.nodeEnv === 'production') {
    if (config.apiSecretKey === 'CHANGE_ME_IN_PRODUCTION') {
      errors.push('API_SECRET_KEY must be changed in production');
    }
    if (config.jwtSecret === 'CHANGE_ME_IN_PRODUCTION') {
      errors.push('JWT_SECRET must be changed in production');
    }
    if (!config.centralServiceUrl.startsWith('https://')) {
      console.warn('⚠️ Warning: CENTRAL_SERVICE_URL should use HTTPS in production');
    }
  }
  
  if (config.port < 1 || config.port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }
  
  if (config.apiRateLimit < 1) {
    errors.push('API_RATE_LIMIT must be greater than 0');
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
}

// Generate API key for new PCs
function generateApiKey(pcId) {
  const crypto = require('crypto');
  const timestamp = Date.now();
  const data = `${pcId}-${timestamp}-${config.apiSecretKey}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Verify API key
function verifyApiKey(apiKey, pcId) {
  // For now, we'll use a simple validation
  // In production, you'd store these in a database
  return apiKey && apiKey.length === 64; // SHA256 hash length
}

// Rate limiting store (in-memory for now)
const rateLimitStore = new Map();

function checkRateLimit(clientId) {
  const now = Date.now();
  const minute = Math.floor(now / 60000);
  const key = `${clientId}:${minute}`;
  
  const current = rateLimitStore.get(key) || 0;
  if (current >= config.apiRateLimit) {
    return false;
  }
  
  rateLimitStore.set(key, current + 1);
  
  // Clean old entries
  if (rateLimitStore.size > 1000) {
    const cutoff = minute - 2;
    for (const [k] of rateLimitStore) {
      if (parseInt(k.split(':')[1]) < cutoff) {
        rateLimitStore.delete(k);
      }
    }
  }
  
  return true;
}

validateConfig();

console.log(`🔧 Configuration loaded for ${config.nodeEnv} environment`);
console.log(`🌐 Central Service URL: ${config.centralServiceUrl}`);
console.log(`🚪 Port: ${config.port}`);
console.log(`🔒 API Rate Limit: ${config.apiRateLimit} requests/minute`);

module.exports = {
  config,
  generateApiKey,
  verifyApiKey,
  checkRateLimit
};