#!/usr/bin/env node

/**
 * Scaffold missing 12-factor compliant files
 * Automatically creates necessary files for full compliance
 */

const fs = require('fs');
const path = require('path');

const scaffolds = {
  'server.js': `// Production server with graceful shutdown
const { createServer } = require('http');
const next = require('next');
const { parse } = require('url');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(\`> Ready on http://\${hostname}:\${port}\`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
});
`,

  'workers/index.js': `// Background worker processes
const Queue = require('bull');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

// Example worker queue
const emailQueue = new Queue('email', process.env.REDIS_URL);

emailQueue.process(async (job) => {
  console.log('Processing email job:', job.data);
  // Process email sending
  return { sent: true };
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Worker shutting down...');
  await emailQueue.close();
  await redis.quit();
  process.exit(0);
});

console.log('Worker started');
`,

  '.env.production': `# Production Environment Variables
# Copy sensitive values from secure storage

NODE_ENV=production
DATABASE_URL=
REDIS_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Add other production configs
`,

  'scripts/db-migrate.sh': `#!/bin/bash
# Database migration script for production

set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Migrations completed successfully"
`,

  'docker-compose.dev.yml': `version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=learning_solidity_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data

volumes:
  postgres_dev_data:
  redis_dev_data:
`
};

function createScaffolds() {
  console.log('🔧 Scaffolding missing 12-factor files...\n');

  const created = [];
  const skipped = [];

  for (const [filePath, content] of Object.entries(scaffolds)) {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (fs.existsSync(fullPath)) {
      skipped.push(filePath);
      continue;
    }

    // Create directory if needed
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(fullPath, content);
    
    // Make scripts executable
    if (filePath.endsWith('.sh') || filePath === 'server.js') {
      fs.chmodSync(fullPath, '755');
    }

    created.push(filePath);
  }

  // Report results
  if (created.length > 0) {
    console.log('✅ Created files:');
    created.forEach(file => console.log(`   - ${file}`));
  }

  if (skipped.length > 0) {
    console.log('\n⏭️  Skipped existing files:');
    skipped.forEach(file => console.log(`   - ${file}`));
  }

  console.log('\n✨ Scaffolding complete!');
  
  // Run 12-factor check again
  console.log('\n🔍 Running compliance check...');
  require('./12factor-check');
}

// Run scaffolding
createScaffolds();