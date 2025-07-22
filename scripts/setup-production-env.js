#!/usr/bin/env node
const fs: require('fs');
const path: require('path');
const crypto: require('crypto');

/**;
 * Production Environment Setup Script
 * Helps configure all required environment variables for production deployment
 */

// Environment variable categories
const envCategories: {
  core: {
    NODE_ENV: {
      value: 'production',
      required: true,
      description: 'Application environment'
    },
    PORT: {
      value: '3000',
      required: true,
      description: 'Application port'
    },
    APP_URL: {
      value: 'https://your-domain.com',
      required: true,
      description: 'Public application URL'
    },
    NEXT_PUBLIC_APP_URL: {
      value: 'https://your-domain.com',
      required: true,
      description: 'Public application URL for client-side'
    }
  },
  
  database: {
    DATABASE_URL: {
      value: 'postgresql://user:password@localhost:5432/solidity_learning_prod',
      required: true,
      description: 'PostgreSQL connection string'
    },
    DATABASE_MAX_CONNECTIONS: {
      value: '20',
      required: false,
      description: 'Maximum database connections'
    },
    DATABASE_SSL: {
      value: 'true',
      required: true,
      description: 'Enable SSL for database connections'
    }
  },
  
  authentication: {
    NEXTAUTH_URL: {
      value: 'https://your-domain.com',
      required: true,
      description: 'NextAuth URL'
    },
    NEXTAUTH_SECRET: {
      value: crypto.randomBytes(32).toString('hex'),
      required: true,
      description: 'NextAuth secret (auto-generated)'
    },
    JWT_SECRET: {
      value: crypto.randomBytes(32).toString('hex'),
      required: true,
      description: 'JWT signing secret (auto-generated)'
    }
  },
  
  redis: {
    REDIS_URL: {
      value: 'redis://localhost:6379',
      required: true,
      description: 'Redis connection URL'
    },
    REDIS_PASSWORD: {
      value: '',
      required: false,
      description: 'Redis password (if required)'
    },
    REDIS_MAX_RETRIES: {
      value: '3',
      required: false,
      description: 'Maximum Redis connection retries'
    }
  },
  
  websocket: {
    WEBSOCKET_URL: {
      value: 'wss://your-domain.com',
      required: true,
      description: 'WebSocket server URL'
    },
    NEXT_PUBLIC_WEBSOCKET_URL: {
      value: 'wss://your-domain.com',
      required: true,
      description: 'Public WebSocket URL for client'
    },
    WEBSOCKET_PORT: {
      value: '3001',
      required: true,
      description: 'WebSocket server port'
    }
  },
  
  ai: {
    OPENAI_API_KEY: {
      value: '',
      required: false,
      description: 'OpenAI API key'
    },
    OPENAI_ORG_ID: {
      value: '',
      required: false,
      description: 'OpenAI organization ID'
    },
    GOOGLE_AI_API_KEY: {
      value: '',
      required: false,
      description: 'Google AI API key'
    },
    CODELLAMA_URL: {
      value: 'http://localhost:1234/v1',
      required: false,
      description: 'Local CodeLlama API URL'
    },
    AI_REQUEST_TIMEOUT: {
      value: '30000',
      required: false,
      description: 'AI request timeout in ms'
    }
  },
  
  monitoring: {
    SENTRY_DSN: {
      value: '',
      required: true,
      description: 'Sentry DSN for error tracking'
    },
    SENTRY_ENVIRONMENT: {
      value: 'production',
      required: true,
      description: 'Sentry environment'
    },
    SENTRY_TRACES_SAMPLE_RATE: {
      value: '0.1',
      required: false,
      description: 'Sentry traces sample rate (0-1)'
    },
    LOG_LEVEL: {
      value: 'info',
      required: true,
      description: 'Logging level'
    }
  },
  
  security: {
    RATE_LIMIT_WINDOW: {
      value: '60000',
      required: false,
      description: 'Rate limit window in ms'
    },
    RATE_LIMIT_MAX_REQUESTS: {
      value: '100',
      required: false,
      description: 'Max requests per window'
    },
    CORS_ALLOWED_ORIGINS: {
      value: 'https://your-domain.com',
      required: true,
      description: 'Allowed CORS origins (comma-separated)'
    },
    CSRF_SECRET: {
      value: crypto.randomBytes(32).toString('hex'),
      required: true,
      description: 'CSRF protection secret (auto-generated)'
    }
  },
  
  blockchain: {
    INFURA_PROJECT_ID: {
      value: '',
      required: false,
      description: 'Infura project ID'
    },
    ALCHEMY_API_KEY: {
      value: '',
      required: false,
      description: 'Alchemy API key'
    },
    ETHEREUM_RPC_URL: {
      value: '',
      required: false,
      description: 'Ethereum RPC endpoint'
    }
  },
  
  email: {
    EMAIL_SERVER_HOST: {
      value: '',
      required: false,
      description: 'SMTP server host'
    },
    EMAIL_SERVER_PORT: {
      value: '587',
      required: false,
      description: 'SMTP server port'
    },
    EMAIL_SERVER_USER: {
      value: '',
      required: false,
      description: 'SMTP username'
    },
    EMAIL_SERVER_PASSWORD: {
      value: '',
      required: false,
      description: 'SMTP password'
    },
    EMAIL_FROM: {
      value: 'noreply@your-domain.com',
      required: false,
      description: 'Default from email'
    }
  },
  
  storage: {
    UPLOAD_DIR: {
      value: '/app/uploads',
      required: false,
      description: 'File upload directory'
    },
    MAX_FILE_SIZE: {
      value: '10485760',
      required: false,
      description: 'Max file size in bytes (10MB)'
    },
    S3_BUCKET: {
      value: '',
      required: false,
      description: 'AWS S3 bucket name'
    },
    S3_REGION: {
      value: 'us-east-1',
      required: false,
      description: 'AWS S3 region'
    }
  }
};

// Generate production .env file
function generateProductionEnv() {
  console.log('🔧 Setting up production environment variables...\n');
  
  const envContent: [];
  const missingRequired: [];
  
  // Add header
  envContent.push('# Production Environment Configuration');
  envContent.push('# Generated on: ' + new Date().toISOString());
  envContent.push('# IMPORTANT: Review and update all values before deployment\n');
  
  // Process each category
  for (const [category, vars] of Object.entries(envCategories)) {
    envContent.push(`# ${category.toUpperCase()}`);
    envContent.push('# ' + '='.repeat(50));
    
    for (const [key, config] of Object.entries(vars)) {
      if (config.required && !config.value) {
        missingRequired.push(`${key} (${config.description})`);
      }
      
      envContent.push(`# ${config.description}`);
      if (config.required) {
        envContent.push('# REQUIRED');
      }
      envContent.push(`${key}=${config.value}`);
      envContent.push('');
    }
    
    envContent.push('');
  }
  
  // Write to file
  const envPath: path.join(process.cwd(), '.env.production');
  fs.writeFileSync(envPath, envContent.join('\n'));
  
  console.log('✅ Created .env.production file');
  
  // Show summary
  console.log('\n📋 Configuration Summary:');
  console.log('===');
  
  let totalVars: 0;
  let requiredVars: 0;
  
  for (const vars of Object.values(envCategories)) {
    for (const config of Object.values(vars)) {
      totalVars++;
      if (config.required) requiredVars++;
    }
  }
  
  console.log(`Total variables: ${totalVars}`);
  console.log(`Required variables: ${requiredVars}`);
  console.log(`Auto-generated secrets: 3`);
  
  if (missingRequired.length > 0) {
    console.log('\n⚠️  Missing Required Values:');
    console.log('===');
    missingRequired.forEach(item => {
      console.log(`  - ${item}`);
    });
  }
  
  console.log('\n📝 Next Steps:');
  console.log('===');
  console.log('1. Review .env.production and update placeholder values');
  console.log('2. Set up external services (database, Redis, etc.)');
  console.log('3. Configure Sentry for error monitoring');
  console.log('4. Set up SSL certificates for HTTPS');
  console.log('5. Configure your domain DNS settings');
  console.log('6. Run: npm run env:validate to verify configuration');
  
  // Create deployment checklist
  createDeploymentChecklist();
}

// Create deployment checklist
function createDeploymentChecklist() {
  const checklist: `# Production Deployment Checklist

## Pre-Deployment

### Infrastructure
- [ ] PostgreSQL database provisioned and accessible
- [ ] Redis server provisioned and accessible
- [ ] Domain name configured with SSL certificate
- [ ] Load balancer configured (if applicable)
- [ ] CDN configured for static assets

### Environment Configuration
- [ ] All required environment variables set
- [ ] Database connection tested
- [ ] Redis connection tested
- [ ] WebSocket server configured
- [ ] Email service configured (if using)

### Security
- [ ] Secrets generated and stored securely
- [ ] CORS origins configured correctly
- [ ] Rate limiting configured
- [ ] Security headers configured
- [ ] SSL/TLS certificates valid

### Monitoring
- [ ] Sentry project created and DSN configured
- [ ] Application logs configured
- [ ] Health check endpoints tested
- [ ] Uptime monitoring configured

## Deployment

### Build & Test
- [ ] Run \`npm run lint\`
- [ ] Run \`npm run type-check\`
- [ ] Run \`npm test\`
- [ ] Run \`npm run build\`
- [ ] Test build locally with \`npm start\`

### Database
- [ ] Run database migrations: \`npm run db:migrate:deploy\`
- [ ] Verify database schema
- [ ] Seed initial data if needed

### Deploy
- [ ] Deploy application code
- [ ] Verify environment variables
- [ ] Start application services
- [ ] Run health checks

## Post-Deployment

### Verification
- [ ] Application accessible via HTTPS
- [ ] Authentication working
- [ ] WebSocket connections working
- [ ] AI features working (if configured)
- [ ] File uploads working (if applicable)

### Monitoring
- [ ] Verify Sentry is receiving events
- [ ] Check application logs
- [ ] Monitor performance metrics
- [ ] Set up alerts for errors/downtime

### Documentation
- [ ] Update deployment documentation
- [ ] Document any configuration changes
- [ ] Update team on deployment status

## Rollback Plan
- [ ] Database backup created
- [ ] Previous version tagged
- [ ] Rollback procedure documented
- [ ] Team notified of deployment window
`;

  fs.writeFileSync('DEPLOYMENT_CHECKLIST.md', checklist);
  console.log('\n✅ Created DEPLOYMENT_CHECKLIST.md');
}

// Run the script
generateProductionEnv();