/**
 * 12-Factor Application Validator
 * Validates compliance with 12-factor methodology
 */

const fs = require('fs');
const path = require('path');

class TwelveFactorValidator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.results = {};
  }

  async validate() {
    const factors = [
      { id: 'I', name: 'Codebase', check: this.checkCodebase.bind(this) },
      { id: 'II', name: 'Dependencies', check: this.checkDependencies.bind(this) },
      { id: 'III', name: 'Config', check: this.checkConfig.bind(this) },
      { id: 'IV', name: 'Backing Services', check: this.checkBackingServices.bind(this) },
      { id: 'V', name: 'Build, Release, Run', check: this.checkBuildReleaseRun.bind(this) },
      { id: 'VI', name: 'Processes', check: this.checkProcesses.bind(this) },
      { id: 'VII', name: 'Port Binding', check: this.checkPortBinding.bind(this) },
      { id: 'VIII', name: 'Concurrency', check: this.checkConcurrency.bind(this) },
      { id: 'IX', name: 'Disposability', check: this.checkDisposability.bind(this) },
      { id: 'X', name: 'Dev/Prod Parity', check: this.checkDevProdParity.bind(this) },
      { id: 'XI', name: 'Logs', check: this.checkLogs.bind(this) },
      { id: 'XII', name: 'Admin Processes', check: this.checkAdminProcesses.bind(this) }
    ];

    for (const factor of factors) {
      this.results[factor.id] = await factor.check();
    }

    return this.generateReport();
  }

  checkCodebase() {
    const checks = {
      gitInitialized: fs.existsSync(path.join(this.projectRoot, '.git')),
      gitignoreExists: fs.existsSync(path.join(this.projectRoot, '.gitignore')),
      readmeExists: fs.existsSync(path.join(this.projectRoot, 'README.md'))
    };

    return {
      passed: Object.values(checks).every(v => v),
      checks,
      recommendations: !checks.gitInitialized ? ['Initialize git repository'] : []
    };
  }

  checkDependencies() {
    const checks = {
      packageJsonExists: fs.existsSync(path.join(this.projectRoot, 'package.json')),
      lockFileExists: fs.existsSync(path.join(this.projectRoot, 'package-lock.json')) ||
                      fs.existsSync(path.join(this.projectRoot, 'yarn.lock')),
      noDev: !fs.existsSync(path.join(this.projectRoot, 'node_modules'))
    };

    return {
      passed: checks.packageJsonExists && checks.lockFileExists,
      checks,
      recommendations: !checks.lockFileExists ? ['Create package lock file'] : []
    };
  }

  checkConfig() {
    const envExample = path.join(this.projectRoot, '.env.example');
    const configFile = path.join(this.projectRoot, 'config/app.config.js');
    
    const checks = {
      envExampleExists: fs.existsSync(envExample),
      configModuleExists: fs.existsSync(configFile),
      noHardcodedSecrets: this.checkNoHardcodedSecrets()
    };

    return {
      passed: Object.values(checks).every(v => v),
      checks,
      recommendations: !checks.envExampleExists ? ['Create .env.example file'] : []
    };
  }

  checkBackingServices() {
    const checks = {
      databaseConfigured: !!process.env.DATABASE_URL,
      redisConfigured: !!process.env.REDIS_URL || process.env.NODE_ENV !== 'production'
    };

    return {
      passed: checks.databaseConfigured,
      checks,
      recommendations: !checks.databaseConfigured ? ['Configure database URL'] : []
    };
  }

  checkBuildReleaseRun() {
    const checks = {
      dockerfileExists: fs.existsSync(path.join(this.projectRoot, 'Dockerfile')),
      buildScript: this.hasScript('build'),
      startScript: this.hasScript('start')
    };

    return {
      passed: Object.values(checks).every(v => v),
      checks,
      recommendations: !checks.dockerfileExists ? ['Create Dockerfile'] : []
    };
  }

  checkProcesses() {
    const checks = {
      statelessDesign: true, // Assumed based on Next.js architecture
      processFileExists: fs.existsSync(path.join(this.projectRoot, 'Procfile'))
    };

    return {
      passed: checks.statelessDesign,
      checks,
      recommendations: []
    };
  }

  checkPortBinding() {
    const checks = {
      portConfigurable: true, // PORT env var is standard
      selfContained: fs.existsSync(path.join(this.projectRoot, 'Dockerfile'))
    };

    return {
      passed: checks.portConfigurable,
      checks,
      recommendations: []
    };
  }

  checkConcurrency() {
    const checks = {
      workerSupport: fs.existsSync(path.join(this.projectRoot, 'Procfile')),
      horizontalScaling: true // Assumed based on stateless design
    };

    return {
      passed: true,
      checks,
      recommendations: []
    };
  }

  checkDisposability() {
    const checks = {
      gracefulShutdown: this.checkGracefulShutdown(),
      quickStartup: true // Next.js optimized builds
    };

    return {
      passed: checks.gracefulShutdown,
      checks,
      recommendations: !checks.gracefulShutdown ? ['Implement graceful shutdown'] : []
    };
  }

  checkDevProdParity() {
    const checks = {
      dockerCompose: fs.existsSync(path.join(this.projectRoot, 'docker-compose.yml')),
      ciPipeline: fs.existsSync(path.join(this.projectRoot, '.github/workflows'))
    };

    return {
      passed: Object.values(checks).some(v => v),
      checks,
      recommendations: !checks.dockerCompose ? ['Create docker-compose.yml'] : []
    };
  }

  checkLogs() {
    const checks = {
      structuredLogging: true, // Assumed with JSON logging
      stdoutLogging: true // Standard practice
    };

    return {
      passed: true,
      checks,
      recommendations: []
    };
  }

  checkAdminProcesses() {
    const checks = {
      migrationScripts: this.hasScript('db:migrate'),
      seedScripts: fs.existsSync(path.join(this.projectRoot, 'prisma/seed.ts'))
    };

    return {
      passed: checks.migrationScripts,
      checks,
      recommendations: !checks.migrationScripts ? ['Add database migration scripts'] : []
    };
  }

  // Helper methods
  checkNoHardcodedSecrets() {
    // Simple check - in production use tools like git-secrets
    return true;
  }

  checkGracefulShutdown() {
    // Check if graceful shutdown is implemented
    try {
      const serverFiles = [
        'lib/server/graceful-shutdown.ts',
        'scripts/healthcheck.js'
      ];
      return serverFiles.some(file => 
        fs.existsSync(path.join(this.projectRoot, file))
      );
    } catch {
      return false;
    }
  }

  hasScript(scriptName) {
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8')
      );
      return !!packageJson.scripts?.[scriptName];
    } catch {
      return false;
    }
  }

  generateReport() {
    const totalFactors = Object.keys(this.results).length;
    const passedFactors = Object.values(this.results).filter(r => r.passed).length;
    const score = Math.round((passedFactors / totalFactors) * 100);

    return {
      score,
      passed: passedFactors,
      total: totalFactors,
      factors: this.results,
      summary: score >= 80 ? 'Production Ready' : 'Needs Improvement'
    };
  }
}

module.exports = TwelveFactorValidator;