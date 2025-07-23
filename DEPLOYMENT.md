# Solidity Learning Platform - Deployment Guide

## Overview
This guide covers the deployment process for the Solidity Learning Platform v1.0.

## Prerequisites
- Node.js 20.x
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- PM2 (for non-containerized deployment)

## Environment Variables
Create a `.env.production` file with all required variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/solidity_learning
DB_USER=solidity_user
DB_PASSWORD=your_secure_password
DB_NAME=solidity_learning

# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
JWT_SECRET=another-secure-secret

# OAuth Providers
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI Services
OPENAI_API_KEY=your_openai_api_key
OPENAI_ORG_ID=your_openai_org_id
GEMINI_API_KEY=your_gemini_api_key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@your-domain.com

# Blockchain (Optional)
BLOCKCHAIN_RPC_URL=https://mainnet.infura.io/v3/your_project_id
CONTRACT_ADDRESS=0x...
ADMIN_WALLET_PRIVATE_KEY=0x...

# Monitoring (Optional)
MONITORING_API_KEY=your_monitoring_key
SENTRY_DSN=https://...@sentry.io/...

# Other
SITE_URL=https://your-domain.com
```

## Deployment Methods

### 1. Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Update and restart
git pull
docker-compose build
docker-compose up -d
```

### 2. PM2 Deployment

```bash
# Install dependencies
npm ci --production

# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup

# Monitor
pm2 monit

# Reload after updates
git pull
npm ci --production
npm run build
pm2 reload all
```

### 3. Manual Deployment

```bash
# Install dependencies
npm ci --production

# Build
npm run build

# Start production server
npm start
```

## Database Setup

```bash
# Run migrations
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

## Health Checks
The application exposes a health endpoint at `/api/health` for monitoring.

## Reverse Proxy Configuration (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /_next/static {
        proxy_cache STATIC;
        proxy_pass http://localhost:3000;
        add_header X-Cache-Status $upstream_cache_status;
    }

    location /static {
        proxy_cache STATIC;
        proxy_ignore_headers Cache-Control;
        proxy_cache_valid 60m;
        proxy_pass http://localhost:3000;
        add_header X-Cache-Status $upstream_cache_status;
    }
}
```

## CI/CD with GitHub Actions
Push to the `main` branch triggers automatic deployment. Configure these secrets in GitHub:
- `DATABASE_URL_TEST`
- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_KEY`

## Monitoring & Logs

### Application Logs
```bash
# Docker
docker-compose logs -f app

# PM2
pm2 logs

# Manual
tail -f logs/out.log
tail -f logs/err.log
```

### Performance Monitoring
- Built-in performance dashboard at `/performance-dashboard`
- AgentOps integration for AI monitoring (when configured)
- Health endpoint: `/api/health`

## Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm ci
npm run build
```

### Database Connection Issues
```bash
# Test connection
npx prisma db pull

# Reset database (development only!)
npx prisma migrate reset
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

## Security Checklist
- [ ] All environment variables set
- [ ] HTTPS configured
- [ ] Database credentials secured
- [ ] API keys rotated regularly
- [ ] Firewall rules configured
- [ ] Regular security updates
- [ ] Backup strategy in place

## Backup Strategy
```bash
# Database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Automated backups (add to crontab)
0 2 * * * pg_dump $DATABASE_URL > /backups/db_$(date +\%Y\%m\%d).sql
```

## Support
For issues or questions, please check:
- Application logs
- Health endpoint status
- Database connectivity
- Environment variables

## Version
Current Version: 1.0.0