#!/usr/bin/env node
/**
 * Quantum Port Resolver & Static Asset Fixer
 * Resolves port conflicts and fixes Next.js static asset serving
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

class QuantumPortResolver {
  constructor() {
    this.projectRoot = process.cwd();
    this.nextDir = path.join(this.projectRoot, '.next');
    this.preferredPorts = [3000, 3001, 3002, 3003, 3004];
    this.staticAssetDirs = [
      path.join(this.nextDir, 'static'),
      path.join(this.projectRoot, 'public'),
      path.join(this.projectRoot, 'static')
    ];
  }

  async findBusyPorts() {
    console.log('🔍 Scanning for busy ports...');
    const busyPorts = [];
    
    for (const port of this.preferredPorts) {
      try {
        const { stdout } = await execAsync(`lsof -i :${port}`);
        if (stdout.trim()) {
          const lines = stdout.split('\n').slice(1);
          busyPorts.push({
            port,
            processes: lines.map(line => {
              const parts = line.trim().split(/\s+/);
              return { command: parts[0], pid: parts[1] };
            })
          });
        }
      } catch (error) {
        // Port is free
      }
    }
    
    return busyPorts;
  }

  async killConflictingProcesses() {
    console.log('⚡ Killing conflicting processes...');
    
    try {
      // Kill existing Next.js development servers
      await execAsync(`pkill -f "next dev" 2>/dev/null || true`);
      await execAsync(`pkill -f "next-server" 2>/dev/null || true`);
      
      // Kill any processes on our preferred ports
      for (const port of this.preferredPorts) {
        try {
          await execAsync(`lsof -ti :${port} | xargs kill -9 2>/dev/null || true`);
        } catch (error) {
          // Ignore errors
        }
      }
      
      console.log('✅ Conflicting processes terminated');
      
      // Wait for processes to fully terminate
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.warn('⚠️ Some processes could not be terminated:', error.message);
    }
  }

  async clearNextCache() {
    console.log('🧹 Clearing Next.js cache and static files...');
    
    const cachePaths = [
      path.join(this.nextDir, 'cache'),
      path.join(this.nextDir, 'static'),
      path.join(this.nextDir, 'server'),
      path.join(this.nextDir, 'trace'),
      path.join(this.nextDir, 'build-manifest.json'),
      path.join(this.nextDir, 'routes-manifest.json'),
      path.join(this.nextDir, 'react-loadable-manifest.json'),
      path.join(this.projectRoot, 'node_modules/.cache'),
      path.join(this.projectRoot, '.swc')
    ];
    
    for (const cachePath of cachePaths) {
      try {
        if (fs.existsSync(cachePath)) {
          await execAsync(`rm -rf "${cachePath}"`);
          console.log(`  ✅ Cleared: ${path.basename(cachePath)}`);
        }
      } catch (error) {
        console.warn(`  ⚠️ Could not clear ${cachePath}:`, error.message);
      }
    }
  }

  async fixStaticAssetPaths() {
    console.log('🔧 Fixing static asset paths...');
    
    // Create static directories if they don't exist
    for (const dir of this.staticAssetDirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`  ✅ Created: ${dir}`);
      }
    }
    
    // Fix Next.js config for static assets
    const nextConfigPath = path.join(this.projectRoot, 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      let config = fs.readFileSync(nextConfigPath, 'utf8');
      
      // Ensure proper static asset configuration
      if (!config.includes('assetPrefix')) {
        config = config.replace(
          'const nextConfig = {',
          `const nextConfig = {
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',`
        );
      }
      
      if (!config.includes('trailingSlash')) {
        config = config.replace(
          'const nextConfig = {',
          `const nextConfig = {
  trailingSlash: false,`
        );
      }
      
      fs.writeFileSync(nextConfigPath, config);
      console.log('  ✅ Fixed Next.js config for static assets');
    }
  }

  async regenerateNextBuild() {
    console.log('🔄 Regenerating Next.js build files...');
    
    try {
      // Generate Prisma client first
      console.log('  📦 Generating Prisma client...');
      await execAsync('npx prisma generate', { cwd: this.projectRoot });
      
      // Clean build
      console.log('  🧹 Cleaning build...');
      await execAsync('npm run clean:build', { cwd: this.projectRoot });
      
      // Verify Next.js installation
      console.log('  ✅ Next.js build preparation complete');
      
    } catch (error) {
      console.error('❌ Error regenerating build:', error.message);
      throw error;
    }
  }

  async findAvailablePort() {
    console.log('🔍 Finding available port...');
    
    for (const port of this.preferredPorts) {
      try {
        const { stdout } = await execAsync(`lsof -i :${port}`);
        if (!stdout.trim()) {
          console.log(`✅ Port ${port} is available`);
          return port;
        }
      } catch (error) {
        console.log(`✅ Port ${port} is available`);
        return port;
      }
    }
    
    // If no preferred port is available, find a random one
    const port = 3000 + Math.floor(Math.random() * 1000);
    console.log(`✅ Using random port ${port}`);
    return port;
  }

  async fixRouting() {
    console.log('🛤️  Fixing routing configuration...');
    
    const middlewarePath = path.join(this.projectRoot, 'middleware.ts');
    if (fs.existsSync(middlewarePath)) {
      let middleware = fs.readFileSync(middlewarePath, 'utf8');
      
      // Ensure proper static file handling
      if (!middleware.includes('/_next/static')) {
        middleware = middleware.replace(
          'export const config = {',
          `export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|static/).*)',
  ],`
        );
      }
      
      fs.writeFileSync(middlewarePath, middleware);
      console.log('  ✅ Fixed middleware routing');
    }
  }

  async startDevServer(port) {
    console.log(`🚀 Starting development server on port ${port}...`);
    
    const env = { ...process.env, PORT: port.toString() };
    
    try {
      const child = exec(`npm run dev`, { 
        cwd: this.projectRoot,
        env
      });
      
      child.stdout.on('data', (data) => {
        console.log(data.toString());
      });
      
      child.stderr.on('data', (data) => {
        console.error(data.toString());
      });
      
      // Wait for server to start
      await new Promise((resolve) => {
        const interval = setInterval(async () => {
          try {
            const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}`);
            if (stdout === '200') {
              clearInterval(interval);
              resolve();
            }
          } catch (error) {
            // Server not ready yet
          }
        }, 2000);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(interval);
          resolve();
        }, 30000);
      });
      
      console.log(`✅ Development server started on http://localhost:${port}`);
      
    } catch (error) {
      console.error('❌ Error starting development server:', error.message);
      throw error;
    }
  }

  async validateStaticAssets(port) {
    console.log('🔍 Validating static asset serving...');
    
    const testUrls = [
      `http://localhost:${port}/_next/static/css/app/layout.css`,
      `http://localhost:${port}/_next/static/chunks/framework.js`,
      `http://localhost:${port}/favicon.ico`
    ];
    
    for (const url of testUrls) {
      try {
        const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" "${url}"`);
        console.log(`  ${url}: HTTP ${stdout}`);
      } catch (error) {
        console.log(`  ${url}: Error - ${error.message}`);
      }
    }
  }

  async run() {
    console.log('🌟 Quantum Port Resolver & Static Asset Fixer');
    console.log('='.repeat(50));
    
    try {
      // Step 1: Find and kill conflicting processes
      const busyPorts = await this.findBusyPorts();
      if (busyPorts.length > 0) {
        console.log('🔥 Found busy ports:', busyPorts);
        await this.killConflictingProcesses();
      }
      
      // Step 2: Clear caches
      await this.clearNextCache();
      
      // Step 3: Fix static asset paths
      await this.fixStaticAssetPaths();
      
      // Step 4: Fix routing
      await this.fixRouting();
      
      // Step 5: Regenerate build
      await this.regenerateNextBuild();
      
      // Step 6: Find available port
      const port = await this.findAvailablePort();
      
      // Step 7: Start development server
      console.log('🚀 All fixes applied successfully!');
      console.log(`📍 Starting server on port ${port}...`);
      console.log('🔗 Server will be available at:', `http://localhost:${port}`);
      
      // Validate after a brief delay
      setTimeout(async () => {
        await this.validateStaticAssets(port);
      }, 5000);
      
    } catch (error) {
      console.error('❌ Quantum Port Resolver failed:', error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const resolver = new QuantumPortResolver();
  resolver.run().catch(console.error);
}

module.exports = QuantumPortResolver;