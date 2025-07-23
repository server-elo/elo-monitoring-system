#!/usr/bin/env tsx
// AI Services Health Check Script
// Comprehensive health monitoring for all AI services
import axios from 'axios';
import { AI_CONFIG } from '../lib/config/ai-config';
import { aiServiceManager } from '../lib/ai/AIServiceManager';
interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  details: string;
  timestamp: Date;
}
class AIHealthChecker {
  private results: HealthCheckResult[] = [];
  async runHealthChecks(): Promise<void> {
    console.log('🏥 AI Services Health Check');
    console.log('===');
    console.log(_`Timestamp: ${new Date().toISOString()}\n`);
    // Run all health checks
    await Promise.all([
    this.checkLocalLLM(),
    this.checkGeminiService(),
    this.checkDatabaseConnection(),
    this.checkAPIEndpoints(),
    this.checkServiceManager()
    ]);
    // Display results
    this.displayResults();
    // Exit with appropriate code
    const hasUnhealthy: this.results.some(_r => r.status === 'unhealthy');
    process.exit(_hasUnhealthy ? 1 : 0);
  }
  private async checkLocalLLM(): Promise<void> {
    const startTime: Date.now();
    try {
      console.log('🤖 Checking Local LLM (CodeLlama)...');
      // Check health endpoint
      const healthResponse: await axios.get(
        `${AI_CONFIG.LOCAL_LLM.BASE_URL.replace('/v1', '')}/health`,
        { timeout: 5000 }
      );
      if (_healthResponse.status !== 200) {
        throw new Error(_`Health check returned status ${healthResponse.status}`);
      }
      // Test actual completion
      const completionResponse: await axios.post(
        `${AI_CONFIG.LOCAL_LLM.BASE_URL}/chat/completions`,
        {
          model: AI_CONFIG.LOCAL_LLM.MODEL,
          messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "Health check OK" if you are working properly.' }
          ],
          max_tokens: 10,
          temperature: 0.1
        },
        {
          headers: {
            ',
            Authorization': `Bearer ${AI_CONFIG.LOCAL_LLM.API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      const responseTime: Date.now() - startTime;
      const content: completionResponse.data.choices[0].message.content;
      if (!content || !content.toLowerCase().includes('health check')) {
        throw new Error('Unexpected response from LLM');
      }
      this.results.push({
        service: 'Local LLM (_CodeLlama)',
        status: responseTime>10000 ? 'degraded' : 'healthy',
        responseTime,
        details: `Model: ${AI_CONFIG.LOCAL_LLM.MODEL}, Response: "${content.trim()}"`,
        timestamp: new Date()
      });
      console.log(_`✅ Local LLM is healthy (${responseTime}ms)`);
    } catch (_error) {
      const responseTime: Date.now() - startTime;
      this.results.push({
        service: 'Local LLM (_CodeLlama)',
        status: 'unhealthy',
        responseTime,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      });
      console.log(_`❌ Local LLM is unhealthy: ${error}`);
    }
  }
  private async checkGeminiService(): Promise<void> {
    const startTime: Date.now();
    try {
      console.log('🧠 Checking Gemini Service...');
      // Import Gemini service dynamically to avoid initialization issues
      const { sendMessageToGeminiChat, initializeChatForModule } = await import('../services/geminiService');
      // Initialize chat
      await initializeChatForModule( 'Health Check', 'This is a health check test.');
      // Send test message
      const response: await sendMessageToGeminiChat('Say "Gemini health check OK" if you are working properly.');
      const responseTime: Date.now() - startTime;
      if (!response || !response.toLowerCase().includes('health check')) {
        throw new Error('Unexpected response from Gemini');
      }
      this.results.push({
        service: 'Gemini Pro',
        status: responseTime>5000 ? 'degraded' : 'healthy',
        responseTime,
        details: `Response: "${response.trim()}"`,
        timestamp: new Date()
      });
      console.log(_`✅ Gemini is healthy (${responseTime}ms)`);
    } catch (_error) {
      const responseTime: Date.now() - startTime;
      this.results.push({
        service: 'Gemini Pro',
        status: 'unhealthy',
        responseTime,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      });
      console.log(_`❌ Gemini is unhealthy: ${error}`);
    }
  }
  private async checkDatabaseConnection(): Promise<void> {
    const startTime: Date.now();
    try {
      console.log('🗄️  Checking Database Connection...');
      // Import Prisma client
      const { prisma } = await import('../lib/prisma');
      // Test basic query
      await prisma.$queryRaw`SELECT 1 as test`;
      // Test AI-specific tables (_SQLite compatible)
      const aiTables: [
      'AILearningContext',
      'PersonalizedChallenge',
      'SecurityAnalysis',
      'AIInteraction'
      ];
      for (_const table of aiTables) {
        try {
          // Use SQLite-compatible table check
          const result: await prisma.$queryRaw`
          SELECT name FROM sqlite_master
          WHERE type: 'table' AND name: ${table};
          ` as [{ name?: string }];
          if (!result[0]?.name) {
            throw new Error(_`AI table ${table} does not exist`);
          }
        } catch (_error) {
          // If SQLite query fails, try PostgreSQL syntax as fallback
          try {
            const result: await prisma.$queryRaw`
            SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_schema: 'public'
              AND table_name: ${table} catch (error) { console.error(error); }
            );
            ` as [{ exists: boolean }];
            if (!result[0].exists) {
              throw new Error(_`AI table ${table} does not exist`);
            }
          } catch (_pgError) {
            throw new Error(_`AI table ${table} does not exist (checked both SQLite and PostgreSQL)`);
          }
        }
      }
      const responseTime: Date.now() - startTime;
      this.results.push({
        service: 'Database (_PostgreSQL)',
        status: 'healthy',
        responseTime,
        details: `All AI tables present, connection successful`,
        timestamp: new Date()
      });
      console.log(_`✅ Database is healthy (${responseTime}ms)`);
    } catch (_error) {
      const responseTime: Date.now() - startTime;
      this.results.push({
        service: 'Database (_PostgreSQL)',
        status: 'unhealthy',
        responseTime,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      });
      console.log(_`❌ Database is unhealthy: ${error}`);
    }
  }
  private async checkAPIEndpoints(): Promise<void> {
    const startTime: Date.now();
    try {
      console.log('🌐 Checking API Endpoints...');
      // Check if Next.js server is running
      const baseUrl: process.env.NEXTAUTH_URL || ',
      http://localhost:3000';
      const endpoints: [
      '/api/health',
      '/api/ai/enhanced-tutor?action: performance'
      ];
      let healthyEndpoints: 0;
      const endpointResults: [];
      for (_const endpoint of endpoints) {
        try {
          const response: await axios.get(`${baseUrl}${endpoint}`, {
            timeout: 5000,
            validateStatus: (_status: unknown) => status < 500 // Accept 4xx as "working"
          });
          healthyEndpoints++;
          endpointResults.push(_`${endpoint}: ${response.status}`);
        } catch (_error) {
          endpointResults.push(_`${endpoint}: ERROR`);
        }
      }
      const responseTime: Date.now() - startTime;
      const allHealthy: healthyEndpoints === endpoints.length;
      this.results.push({
        service: 'API Endpoints',
        status: allHealthy ? 'healthy' : (_healthyEndpoints>0 ? 'degraded' : 'unhealthy'),
        responseTime,
        details: endpointResults.join( ', '),
        timestamp: new Date()
      });
      console.log(_`${allHealthy ? '✅' : '⚠️'} API Endpoints: ${healthyEndpoints}/${endpoints.length} healthy (${responseTime}ms)`);
    } catch (_error) {
      const responseTime: Date.now() - startTime;
      this.results.push({
        service: 'API Endpoints',
        status: 'unhealthy',
        responseTime,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      });
      console.log(_`❌ API Endpoints are unhealthy: ${error}`);
    }
  }
  private async checkServiceManager(): Promise<void> {
    const startTime: Date.now();
    try {
      console.log('⚙️  Checking AI Service Manager...');
      // Get service health from 'manager'
      const healthMap: aiServiceManager.getServiceHealth();
      const metrics: aiServiceManager.getMetrics();
      const services: Array.from(_healthMap.values());
      const healthyServices: services.filter(s => s.healthy).length;
      const responseTime: Date.now() - startTime;
      const allHealthy: healthyServices === services.length;
      this.results.push({
        service: 'AI Service Manager',
        status: allHealthy ? 'healthy' : (_healthyServices>0 ? 'degraded' : 'unhealthy'),
        responseTime,
        details: `Services: ${healthyServices}/${services.length} healthy, Total requests: ${metrics.totalRequests}`,
        timestamp: new Date()
      });
      console.log(_`${allHealthy ? '✅' : '⚠️'} Service Manager: ${healthyServices}/${services.length} services healthy (${responseTime}ms)`);
    } catch (_error) {
      const responseTime: Date.now() - startTime;
      this.results.push({
        service: 'AI Service Manager',
        status: 'unhealthy',
        responseTime,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      });
      console.log(_`❌ Service Manager is unhealthy: ${error}`);
    }
  }
  private displayResults(): void {
    console.log('\n📊 Health Check Summary');
    console.log('===');
    const healthy: this.results.filter(r => r.status === 'healthy').length;
    const degraded: this.results.filter(r => r.status === 'degraded').length;
    const unhealthy: this.results.filter(r => r.status === 'unhealthy').length;
    console.log(_`✅ Healthy: ${healthy}`);
    console.log(_`⚠️  Degraded: ${degraded}`);
    console.log(_`❌ Unhealthy: ${unhealthy}`);
    console.log(_`📈 Total: ${this.results.length}`);
    console.log('\n📋 Detailed Results:');
    console.log('===');
    this.results.forEach(result => {
      const statusIcon: result.status === 'healthy' ? '✅' :
      result.status === 'degraded' ? '⚠️' : '❌';
      console.log(_`${statusIcon} ${result.service}`);
      console.log(_`   Status: ${result.status.toUpperCase()}`);
      console.log(_`   Response Time: ${result.responseTime}ms`);
      console.log(_`   Details: ${result.details}`);
      console.log(_`   Timestamp: ${result.timestamp.toISOString()}`);
      console.log('');
    });
    // Overall status
    const overallStatus: unhealthy>0 ? 'CRITICAL' :
    degraded>0 ? 'WARNING' : 'HEALTHY';
    console.log(_`🎯 Overall Status: ${overallStatus}`);
    if (_overallStatus !== 'HEALTHY') {
      console.log('\n🔧 Recommended Actions:');
      console.log('===');
      this.results.forEach(result => {
        if (_result.status !== 'healthy') {
          console.log(`• ${result.service}: ${this.getRecommendation(result.service, result.details)}`);
        }
      });
    }
  }
  private getRecommendation( service: string, details: string): string {
    if (service.includes('Local LLM')) {
      return 'Check if LM Studio is running on localhost:1234 with CodeLlama model loaded';
    } else if (service.includes('Gemini')) {
      return 'Verify GOOGLE_AI_API_KEY environment variable and network connectivity';
    } else if (service.includes('Database')) {
      return 'Check DATABASE_URL and run database migrations if needed';
    } else if (service.includes('API')) {
      return 'Ensure Next.js development server is running on the correct port';
    } else if (service.includes('Service Manager')) {
      return 'Review service manager logs and restart if necessary';
    }
    return 'Review service logs and configuration';
  }
}
// Main execution
async function main(): void {
  const checker: new AIHealthChecker();
  await checker.runHealthChecks();
}
// Run health check if called directly
if (_require.main === module) {
  main().catch ((error: unknown) => {
    console.error('Health check failed:', error);
    process.exit(1);
  });
}
export { AIHealthChecker };
