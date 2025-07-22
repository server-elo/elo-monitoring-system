#!/usr/bin/env node
/**
 * Deployment Validation Script
 * Validates that all systems are working correctly
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class DeploymentValidator {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.results = {
      port: { status: 'pending', details: [] },
      static: { status: 'pending', details: [] },
      routing: { status: 'pending', details: [] },
      performance: { status: 'pending', details: [] }
    };
  }

  async validatePort() {
    console.log('🔍 Validating port configuration...');
    
    try {
      // Check if port 3000 is in use by Next.js using ss command
      const { stdout } = await execAsync('ss -tlpn | grep 3000');
      if (stdout.includes('next-server') || stdout.includes('node')) {
        this.results.port.status = 'success';
        this.results.port.details.push('✅ Port 3000 is correctly occupied by Next.js');
        this.results.port.details.push(`📊 Process info: ${stdout.trim()}`);
      } else if (stdout.trim()) {
        this.results.port.status = 'warning';
        this.results.port.details.push('⚠️ Port 3000 is occupied by unknown process');
        this.results.port.details.push(`📊 Process info: ${stdout.trim()}`);
      } else {
        this.results.port.status = 'error';
        this.results.port.details.push('❌ Port 3000 is not in use');
      }
    } catch (error) {
      // Fallback: Check if server responds
      try {
        const { stdout: curlResponse } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" "${this.baseUrl}/"`);
        if (curlResponse.trim() === '200') {
          this.results.port.status = 'success';
          this.results.port.details.push('✅ Port 3000 is responding (detected via HTTP)');
        } else {
          this.results.port.status = 'error';
          this.results.port.details.push('❌ Port 3000 is not responding');
        }
      } catch (curlError) {
        this.results.port.status = 'error';
        this.results.port.details.push('❌ Port 3000 is not accessible');
      }
    }
  }

  async validateStaticAssets() {
    console.log('🔍 Validating static asset serving...');
    
    const testUrls = [
      '/favicon.ico',
      '/test.txt',
      '/robots.txt',
      '/_next/static/chunks/main-app.js',
      '/_next/static/chunks/webpack.js',
      '/_next/static/chunks/polyfills.js'
    ];

    let successCount = 0;
    
    for (const url of testUrls) {
      try {
        const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" "${this.baseUrl}${url}"`);
        if (stdout.trim() === '200') {
          this.results.static.details.push(`✅ ${url}: HTTP 200`);
          successCount++;
        } else {
          this.results.static.details.push(`⚠️ ${url}: HTTP ${stdout.trim()}`);
        }
      } catch (error) {
        this.results.static.details.push(`❌ ${url}: Error - ${error.message}`);
      }
    }
    
    this.results.static.status = successCount >= testUrls.length * 0.8 ? 'success' : 
                                 successCount > 0 ? 'warning' : 'error';
  }

  async validateRouting() {
    console.log('🔍 Validating routing...');
    
    const testRoutes = [
      '/',
      '/dashboard',
      '/profile',
      '/api/health'
    ];

    let successCount = 0;
    
    for (const route of testRoutes) {
      try {
        const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" "${this.baseUrl}${route}"`);
        const statusCode = stdout.trim();
        if (['200', '401', '403'].includes(statusCode)) { // 401/403 are expected for protected routes
          this.results.routing.details.push(`✅ ${route}: HTTP ${statusCode}`);
          successCount++;
        } else {
          this.results.routing.details.push(`⚠️ ${route}: HTTP ${statusCode}`);
        }
      } catch (error) {
        this.results.routing.details.push(`❌ ${route}: Error - ${error.message}`);
      }
    }
    
    this.results.routing.status = successCount >= testRoutes.length * 0.75 ? 'success' : 
                                  successCount > 0 ? 'warning' : 'error';
  }

  async validatePerformance() {
    console.log('🔍 Validating performance...');
    
    try {
      const start = Date.now();
      const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{time_total}" "${this.baseUrl}/"`);
      const loadTime = parseFloat(stdout.trim());
      const end = Date.now();
      
      this.results.performance.details.push(`📊 Page load time: ${loadTime}s`);
      this.results.performance.details.push(`🕐 Total request time: ${end - start}ms`);
      
      if (loadTime < 2.0) {
        this.results.performance.status = 'success';
        this.results.performance.details.push('✅ Performance is excellent');
      } else if (loadTime < 5.0) {
        this.results.performance.status = 'warning';
        this.results.performance.details.push('⚠️ Performance is acceptable');
      } else {
        this.results.performance.status = 'error';
        this.results.performance.details.push('❌ Performance needs improvement');
      }
    } catch (error) {
      this.results.performance.status = 'error';
      this.results.performance.details.push(`❌ Performance test failed: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 QUANTUM DEPLOYMENT VALIDATION REPORT');
    console.log('='.repeat(60));
    
    const sections = [
      { name: 'Port Configuration', key: 'port', icon: '🔌' },
      { name: 'Static Assets', key: 'static', icon: '📁' },
      { name: 'Routing', key: 'routing', icon: '🛤️' },
      { name: 'Performance', key: 'performance', icon: '⚡' }
    ];
    
    let overallStatus = 'success';
    
    sections.forEach(section => {
      const result = this.results[section.key];
      const statusIcon = result.status === 'success' ? '✅' : 
                        result.status === 'warning' ? '⚠️' : '❌';
      
      console.log(`\n${section.icon} ${section.name}: ${statusIcon} ${result.status.toUpperCase()}`);
      result.details.forEach(detail => console.log(`  ${detail}`));
      
      if (result.status === 'error') overallStatus = 'error';
      else if (result.status === 'warning' && overallStatus === 'success') overallStatus = 'warning';
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`🎊 OVERALL STATUS: ${overallStatus === 'success' ? '✅ SUCCESS' : 
                                      overallStatus === 'warning' ? '⚠️ PARTIAL SUCCESS' : 
                                      '❌ NEEDS ATTENTION'}`);
    console.log('='.repeat(60));
    
    if (overallStatus === 'success') {
      console.log('🚀 All systems operational! Ready for development.');
    } else if (overallStatus === 'warning') {
      console.log('🔧 Some issues detected but system is functional.');
    } else {
      console.log('🛠️ Critical issues found. Please review the errors above.');
    }
    
    console.log('\n💡 Development server: http://localhost:3000');
    console.log('📚 Documentation: /README.md');
    console.log('🔧 Scripts: npm run ports:clean, npm run dev:clean');
  }

  async run() {
    console.log('🌟 Starting deployment validation...\n');
    
    await this.validatePort();
    await this.validateStaticAssets();
    await this.validateRouting();
    await this.validatePerformance();
    
    this.generateReport();
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new DeploymentValidator();
  validator.run().catch(console.error);
}

module.exports = DeploymentValidator;