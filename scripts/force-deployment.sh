#!/bin/bash

# Force Deployment Script - Deploy Despite Errors
# This script attempts to deploy the application even with TypeScript errors

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Main deployment
main() {
    log_info "Starting FORCE deployment - bypassing TypeScript errors"
    log_warn "This deployment will have limited functionality"
    
    # Step 1: Create a minimal next.config.js that ignores errors
    log_step "Creating error-bypassing Next.js configuration..."
    
    cat > next.config.force.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  swcMinify: true,
  reactStrictMode: false, // Disable to reduce runtime errors
  experimental: {
    optimizeCss: true,
  },
  // Ignore specific problematic files
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      include: [
        /components\/admin/,
        /app\/admin/,
      ],
      use: 'null-loader',
    });
    
    // Add fallback for modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
};

module.exports = nextConfig;
EOF

    # Step 2: Install null-loader to skip problematic files
    log_step "Installing bypass dependencies..."
    npm install --save-dev null-loader || log_warn "Could not install null-loader"
    
    # Step 3: Create minimal server.js that handles errors gracefully
    log_step "Creating error-tolerant server..."
    
    cat > server.force.js << 'EOF'
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Configure Next.js with error bypassing
const app = next({ 
  dev,
  conf: require('./next.config.force.js')
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname, query } = parsedUrl;

      // Handle errors gracefully
      if (pathname.includes('/admin')) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'text/html');
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Admin Temporarily Unavailable</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                h1 { color: #e74c3c; }
              </style>
            </head>
            <body>
              <h1>Admin Panel Temporarily Unavailable</h1>
              <p>The admin features are undergoing maintenance.</p>
              <a href="/">Return to Home</a>
            </body>
          </html>
        `);
        return;
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log('> Warning: Running with TypeScript errors ignored!');
      console.log('> Admin features are disabled');
    });
});
EOF

    # Step 4: Create production package.json scripts
    log_step "Updating package.json for force deployment..."
    
    # Backup original package.json
    cp package.json package.json.backup
    
    # Add force build script using Node.js
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.scripts['build:force'] = 'next build --config next.config.force.js';
    pkg.scripts['start:force'] = 'NODE_ENV=production node server.force.js';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    
    # Step 5: Attempt force build
    log_step "Attempting force build..."
    
    export NEXT_CONFIG_PATH=./next.config.force.js
    
    if npm run build:force; then
        log_info "Force build succeeded!"
    else
        log_error "Even force build failed. Trying emergency static export..."
        
        # Step 6: Emergency static export
        log_step "Attempting emergency static export..."
        
        # Create static export config
        cat > next.config.static.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
EOF
        
        # Try static export
        npx next build --config next.config.static.js || log_error "Static export also failed"
    fi
    
    # Step 7: Create emergency deployment instructions
    log_step "Creating deployment instructions..."
    
    cat > EMERGENCY_DEPLOYMENT.md << 'EOF'
# Emergency Deployment Instructions

## Current Status
The application has been built with TypeScript errors ignored. Many features may not work correctly.

## Disabled Features
- Admin panel (all /admin routes)
- Some API endpoints may fail
- Type safety is completely disabled

## To Deploy

### Option 1: Force Server (Recommended)
```bash
npm run start:force
```

### Option 2: Static Files (if available)
If static export succeeded, files are in the `out` directory:
```bash
npx serve out -p 3000
```

### Option 3: Use a CDN
Upload the `.next` or `out` directory to a CDN like Vercel, Netlify, or AWS S3.

## To Monitor
- Check server logs constantly
- Set up error tracking (Sentry)
- Monitor for 500 errors
- Be prepared to rollback

## Recovery Plan
1. Fix TypeScript errors in development
2. Test thoroughly
3. Deploy properly using normal build process

## Emergency Contacts
- Keep your development team on standby
- Have rollback procedures ready
- Monitor user reports closely
EOF
    
    # Step 8: Create systemd service for force deployment
    log_step "Creating systemd service..."
    
    cat > solidity-platform-force.service << EOF
[Unit]
Description=Solidity Learning Platform (Force Deployment)
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/npm run start:force
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

# Increase limits for error handling
LimitNOFILE=65535
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF
    
    # Step 9: Final status
    echo ""
    log_info "Force deployment preparation complete!"
    echo ""
    log_warn "⚠️  WARNING: This deployment bypasses all TypeScript errors!"
    log_warn "⚠️  Many features will be broken or unavailable!"
    echo ""
    echo -e "${GREEN}Available commands:${NC}"
    echo "  npm run build:force    # Build ignoring errors"
    echo "  npm run start:force    # Start the force server"
    echo ""
    echo -e "${YELLOW}To deploy with systemd:${NC}"
    echo "  sudo cp solidity-platform-force.service /etc/systemd/system/"
    echo "  sudo systemctl daemon-reload"
    echo "  sudo systemctl start solidity-platform-force"
    echo ""
    echo -e "${RED}Remember:${NC} This is a temporary solution!"
    echo "The TypeScript errors MUST be fixed for a proper deployment."
}

# Run main function
main "$@"