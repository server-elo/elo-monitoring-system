#!/usr/bin/env node

/**
 * Security Audit Script
 * Performs comprehensive security checks on the codebase
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecurityAuditor {
  constructor() {
    this.findings = [];
    this.criticalIssues = 0;
    this.highIssues = 0;
    this.mediumIssues = 0;
    this.lowIssues = 0;
  }

  /**
   * Run complete security audit
   */
  async runAudit() {
    console.log('🔒 Starting Security Audit...\n');

    await this.checkEnvironmentSecurity();
    await this.scanForHardcodedSecrets();
    await this.checkDependencyVulnerabilities();
    await this.validateSecurityConfigurations();
    await this.checkFilePermissions();
    await this.scanForSecurityAntiPatterns();

    this.generateReport();
  }

  /**
   * Check environment security
   */
  async checkEnvironmentSecurity() {
    console.log('🔍 Checking Environment Security...');

    // Check for .env files in version control
    const gitignoreContent = this.readFileIfExists('.gitignore');
    if (!gitignoreContent || !gitignoreContent.includes('.env')) {
      this.addFinding('CRITICAL', 'Environment files not properly ignored in .gitignore', {
        file: '.gitignore',
        recommendation: 'Add .env* patterns to .gitignore'
      });
    }

    // Check JWT secret strength
    const envExample = this.readFileIfExists('.env.example');
    if (envExample) {
      const jwtSecretMatch = envExample.match(/NEXTAUTH_SECRET=["']?([^"'\n]+)["']?/);
      if (jwtSecretMatch && jwtSecretMatch[1].length < 32) {
        this.addFinding('HIGH', 'JWT secret example is too short', {
          file: '.env.example',
          recommendation: 'Use at least 32 character JWT secret'
        });
      }
    }

    // Check for development environment files
    const devEnvFiles = ['.env.development', '.env.local', '.env'];
    devEnvFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.addFinding('MEDIUM', `Development environment file found: ${file}`, {
          file,
          recommendation: 'Ensure this file is not committed to version control'
        });
      }
    });

    console.log('✅ Environment security check completed\n');
  }

  /**
   * Scan for hardcoded secrets
   */
  async scanForHardcodedSecrets() {
    console.log('🔍 Scanning for Hardcoded Secrets...');

    const secretPatterns = [
      { name: 'OpenAI API Key', pattern: /sk-[a-zA-Z0-9]{48}/ },
      { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/ },
      { name: 'AWS Secret Key', pattern: /[0-9a-zA-Z/+]{40}/ },
      { name: 'GitHub Token', pattern: /ghp_[a-zA-Z0-9]{36}/ },
      { name: 'Stripe Key', pattern: /(sk|pk)_(test|live)_[a-zA-Z0-9]{24}/ },
      { name: 'JWT Secret', pattern: /jwt[_-]?secret["\s]*[:=]["\s]*[a-zA-Z0-9+/=]{32,}/ },
      { name: 'Database URL with Password', pattern: /postgresql:\/\/[^:]+:[^@]+@/ },
      { name: 'Generic Secret', pattern: /secret["\s]*[:=]["\s]*["'][^"']{20,}["']/ },
    ];

    const filesToScan = this.getSourceFiles();
    
    for (const file of filesToScan) {
      const content = this.readFileIfExists(file);
      if (!content) continue;

      for (const { name, pattern } of secretPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          this.addFinding('CRITICAL', `Potential hardcoded ${name} found`, {
            file,
            line: this.getLineNumber(content, matches[0]),
            recommendation: 'Move secret to environment variables'
          });
        }
      }
    }

    console.log('✅ Secret scanning completed\n');
  }

  /**
   * Check dependency vulnerabilities
   */
  async checkDependencyVulnerabilities() {
    console.log('🔍 Checking Dependency Vulnerabilities...');

    try {
      const packageJson = JSON.parse(this.readFileIfExists('package.json') || '{}');
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Check for known vulnerable packages
      const vulnerablePackages = [
        { name: 'lodash', versions: ['<4.17.21'], severity: 'HIGH' },
        { name: 'axios', versions: ['<0.21.1'], severity: 'MEDIUM' },
        { name: 'jsonwebtoken', versions: ['<8.5.1'], severity: 'HIGH' },
        { name: 'bcrypt', versions: ['<5.0.0'], severity: 'MEDIUM' },
      ];

      for (const [pkg, version] of Object.entries(dependencies)) {
        const vulnerable = vulnerablePackages.find(v => v.name === pkg);
        if (vulnerable) {
          this.addFinding(vulnerable.severity, `Potentially vulnerable dependency: ${pkg}@${version}`, {
            package: pkg,
            version,
            recommendation: 'Update to latest secure version'
          });
        }
      }

      // Check for outdated security-critical packages
      const securityCriticalPackages = ['next-auth', 'bcryptjs', 'jsonwebtoken', 'helmet'];
      for (const pkg of securityCriticalPackages) {
        if (dependencies[pkg]) {
          this.addFinding('LOW', `Security-critical package found: ${pkg}`, {
            package: pkg,
            recommendation: 'Ensure this package is regularly updated'
          });
        }
      }

    } catch (error) {
      this.addFinding('MEDIUM', 'Could not parse package.json for dependency analysis', {
        error: error.message
      });
    }

    console.log('✅ Dependency vulnerability check completed\n');
  }

  /**
   * Validate security configurations
   */
  async validateSecurityConfigurations() {
    console.log('🔍 Validating Security Configurations...');

    // Check Next.js security configuration
    const nextConfig = this.readFileIfExists('next.config.js');
    if (nextConfig) {
      if (!nextConfig.includes('helmet') && !nextConfig.includes('security')) {
        this.addFinding('MEDIUM', 'No security headers configuration found in next.config.js', {
          file: 'next.config.js',
          recommendation: 'Add security headers configuration'
        });
      }
    }

    // Check for HTTPS enforcement
    const middlewareContent = this.readFileIfExists('middleware.ts');
    if (middlewareContent) {
      if (!middlewareContent.includes('https') && !middlewareContent.includes('secure')) {
        this.addFinding('MEDIUM', 'No HTTPS enforcement found in middleware', {
          file: 'middleware.ts',
          recommendation: 'Add HTTPS enforcement for production'
        });
      }
    }

    // Check authentication configuration
    const authConfigFiles = ['lib/auth/config.ts', 'lib/config/auth.ts'];
    let authConfigFound = false;
    
    for (const file of authConfigFiles) {
      if (fs.existsSync(file)) {
        authConfigFound = true;
        const content = this.readFileIfExists(file);
        
        if (content && !content.includes('secure: true')) {
          this.addFinding('MEDIUM', 'Authentication cookies not configured as secure', {
            file,
            recommendation: 'Set secure: true for production cookies'
          });
        }
      }
    }

    if (!authConfigFound) {
      this.addFinding('HIGH', 'No authentication configuration file found', {
        recommendation: 'Create proper authentication configuration'
      });
    }

    console.log('✅ Security configuration validation completed\n');
  }

  /**
   * Check file permissions
   */
  async checkFilePermissions() {
    console.log('🔍 Checking File Permissions...');

    const sensitiveFiles = [
      '.env',
      '.env.local',
      '.env.production',
      'private.key',
      'server.key',
      'ssl.key'
    ];

    for (const file of sensitiveFiles) {
      if (fs.existsSync(file)) {
        try {
          const stats = fs.statSync(file);
          const mode = stats.mode & parseInt('777', 8);
          
          if (mode > parseInt('600', 8)) {
            this.addFinding('HIGH', `Sensitive file has overly permissive permissions: ${file}`, {
              file,
              permissions: mode.toString(8),
              recommendation: 'Set permissions to 600 (owner read/write only)'
            });
          }
        } catch (error) {
          // File permission check failed, but file exists
          this.addFinding('LOW', `Could not check permissions for ${file}`, {
            file,
            error: error.message
          });
        }
      }
    }

    console.log('✅ File permissions check completed\n');
  }

  /**
   * Scan for security anti-patterns
   */
  async scanForSecurityAntiPatterns() {
    console.log('🔍 Scanning for Security Anti-patterns...');

    const antiPatterns = [
      {
        name: 'eval() usage',
        pattern: /\beval\s*\(/,
        severity: 'HIGH',
        description: 'eval() can execute arbitrary code'
      },
      {
        name: 'innerHTML usage',
        pattern: /\.innerHTML\s*=/,
        severity: 'MEDIUM',
        description: 'innerHTML can lead to XSS vulnerabilities'
      },
      {
        name: 'document.write usage',
        pattern: /document\.write\s*\(/,
        severity: 'MEDIUM',
        description: 'document.write can be exploited for XSS'
      },
      {
        name: 'Unsafe regex',
        pattern: /new RegExp\([^)]*\+[^)]*\)/,
        severity: 'MEDIUM',
        description: 'Dynamic regex construction can lead to ReDoS'
      },
      {
        name: 'SQL concatenation',
        pattern: /SELECT.*\+.*FROM|INSERT.*\+.*INTO|UPDATE.*\+.*SET/i,
        severity: 'HIGH',
        description: 'String concatenation in SQL can lead to injection'
      }
    ];

    const filesToScan = this.getSourceFiles();
    
    for (const file of filesToScan) {
      const content = this.readFileIfExists(file);
      if (!content) continue;

      for (const antiPattern of antiPatterns) {
        const matches = content.match(antiPattern.pattern);
        if (matches) {
          this.addFinding(antiPattern.severity, `Security anti-pattern found: ${antiPattern.name}`, {
            file,
            line: this.getLineNumber(content, matches[0]),
            description: antiPattern.description,
            recommendation: 'Use safer alternatives'
          });
        }
      }
    }

    console.log('✅ Security anti-pattern scanning completed\n');
  }

  /**
   * Add a security finding
   */
  addFinding(severity, message, details = {}) {
    this.findings.push({
      severity,
      message,
      details,
      timestamp: new Date().toISOString()
    });

    switch (severity) {
      case 'CRITICAL':
        this.criticalIssues++;
        break;
      case 'HIGH':
        this.highIssues++;
        break;
      case 'MEDIUM':
        this.mediumIssues++;
        break;
      case 'LOW':
        this.lowIssues++;
        break;
    }
  }

  /**
   * Generate security audit report
   */
  generateReport() {
    console.log('📊 Security Audit Report');
    console.log('========================\n');

    console.log(`Total Issues Found: ${this.findings.length}`);
    console.log(`🔴 Critical: ${this.criticalIssues}`);
    console.log(`🟠 High: ${this.highIssues}`);
    console.log(`🟡 Medium: ${this.mediumIssues}`);
    console.log(`🟢 Low: ${this.lowIssues}\n`);

    if (this.findings.length === 0) {
      console.log('✅ No security issues found!');
      return;
    }

    // Group findings by severity
    const groupedFindings = this.findings.reduce((acc, finding) => {
      if (!acc[finding.severity]) acc[finding.severity] = [];
      acc[finding.severity].push(finding);
      return acc;
    }, {});

    // Display findings by severity
    for (const severity of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']) {
      if (groupedFindings[severity]) {
        console.log(`\n${this.getSeverityIcon(severity)} ${severity} Issues:`);
        console.log('─'.repeat(50));
        
        groupedFindings[severity].forEach((finding, index) => {
          console.log(`${index + 1}. ${finding.message}`);
          if (finding.details.file) {
            console.log(`   File: ${finding.details.file}`);
          }
          if (finding.details.line) {
            console.log(`   Line: ${finding.details.line}`);
          }
          if (finding.details.recommendation) {
            console.log(`   💡 ${finding.details.recommendation}`);
          }
          console.log('');
        });
      }
    }

    // Save detailed report
    const reportPath = path.join('reports', `security-audit-${Date.now()}.json`);
    this.saveReport(reportPath);
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Exit with error code if critical or high issues found
    if (this.criticalIssues > 0 || this.highIssues > 0) {
      console.log('\n❌ Security audit failed due to critical or high severity issues.');
      process.exit(1);
    } else {
      console.log('\n✅ Security audit completed successfully.');
    }
  }

  /**
   * Helper methods
   */
  readFileIfExists(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch {
      return null;
    }
  }

  getSourceFiles() {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const directories = ['app', 'lib', 'components', 'pages', 'src'];
    const files = [];

    function scanDirectory(dir) {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(fullPath);
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }

    directories.forEach(scanDirectory);
    return files;
  }

  getLineNumber(content, searchString) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchString)) {
        return i + 1;
      }
    }
    return null;
  }

  getSeverityIcon(severity) {
    const icons = {
      CRITICAL: '🔴',
      HIGH: '🟠',
      MEDIUM: '🟡',
      LOW: '🟢'
    };
    return icons[severity] || '⚪';
  }

  saveReport(filePath) {
    const reportDir = path.dirname(filePath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.findings.length,
        critical: this.criticalIssues,
        high: this.highIssues,
        medium: this.mediumIssues,
        low: this.lowIssues
      },
      findings: this.findings
    };

    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
  }
}

// Run the audit
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.runAudit().catch(error => {
    console.error('Security audit failed:', error);
    process.exit(1);
  });
}

module.exports = SecurityAuditor;
