import { NextRequest, NextResponse } from 'next/server';
;

interface PerformanceTest {
  name: string;
  target: number;
  unit: string;
  test: () => Promise<number>;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testType = searchParams.get('type') || 'all';

  try {
    const results = await runPerformanceTests(testType);
    
    return NextResponse.json({
      status: 'success',
      message: 'Performance tests completed',
      results,
      summary: generatePerformanceSummary(results),
      recommendations: generateRecommendations(results),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Performance tests failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    if (action === 'test-ai-response') {
      const startTime = Date.now();
      
      // Simulate AI response test
      const mockAIResponse = await simulateAIResponse(data?.prompt || 'test prompt');
      const responseTime = Date.now() - startTime;
      
      return NextResponse.json({
        status: 'success',
        responseTime,
        target: 2000,
        withinTarget: responseTime < 2000,
        response: mockAIResponse,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'test-database') {
      const startTime = Date.now();
      
      // Test database query performance
      const result = await testDatabasePerformance();
      const queryTime = Date.now() - startTime;
      
      return NextResponse.json({
        status: 'success',
        queryTime,
        target: 100,
        withinTarget: queryTime < 100,
        result,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'error',
      message: 'Invalid action specified',
      availableActions: ['test-ai-response', 'test-database']
    }, { status: 400 });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'POST request failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function runPerformanceTests(testType: string): Promise<any[]> {
  const tests: PerformanceTest[] = [
    {
      name: 'AI Response Time',
      target: 2000,
      unit: 'ms',
      test: async () => {
        const start = Date.now();
        await simulateAIResponse('test prompt');
        return Date.now() - start;
      }
    },
    {
      name: 'Database Query Time',
      target: 100,
      unit: 'ms',
      test: async () => {
        const start = Date.now();
        await testDatabasePerformance();
        return Date.now() - start;
      }
    },
    {
      name: 'API Response Time',
      target: 500,
      unit: 'ms',
      test: async () => {
        const start = Date.now();
        await testAPIPerformance();
        return Date.now() - start;
      }
    }
  ];

  const results = [];

  for (const test of tests) {
    if (testType === 'all' || testType === test.name.toLowerCase().replace(/\s+/g, '-')) {
      try {
        const actualTime = await test.test();
        results.push({
          name: test.name,
          target: test.target,
          actual: actualTime,
          unit: test.unit,
          withinTarget: actualTime <= test.target,
          performance: actualTime <= test.target ? 'good' : 'needs-improvement',
          improvement: actualTime > test.target ? 
            `${Math.round(((actualTime - test.target) / test.target) * 100)}% over target` : 
            `${Math.round(((test.target - actualTime) / test.target) * 100)}% under target`
        });
      } catch (error) {
        results.push({
          name: test.name,
          target: test.target,
          actual: -1,
          unit: test.unit,
          withinTarget: false,
          performance: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  return results;
}

async function simulateAIResponse(_prompt: string): Promise<string> {
  // Check if local LLM is available
  try {
    const response = await fetch('http://localhost:1234/v1/models', {
      method: 'GET',
      signal: AbortSignal.timeout(1000)
    });
    
    if (response.ok) {
      // Simulate local LLM response (fast)
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400)); // 800-1200ms
      return 'Local LLM response (fast)';
    }
  } catch (error) {
    // Local LLM not available
  }

  // Simulate fallback response (slower)
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000)); // 2-3s
  return 'Fallback response (slower)';
}

async function testDatabasePerformance(): Promise<any> {
  // Simulate database query
  const start = Date.now();
  
  // Simulate various query types
  const queryTypes = ['simple-select', 'join-query', 'aggregation', 'index-lookup'];
  const randomQuery = queryTypes[Math.floor(Math.random() * queryTypes.length)];
  
  // Simulate query execution time based on type
  const baseTimes = {
    'simple-select': 20,
    'join-query': 80,
    'aggregation': 150,
    'index-lookup': 10
  };
  
  const baseTime = baseTimes[randomQuery as keyof typeof baseTimes];
  await new Promise(resolve => setTimeout(resolve, baseTime + Math.random() * 30));
  
  return {
    queryType: randomQuery,
    executionTime: Date.now() - start,
    rowsAffected: Math.floor(Math.random() * 1000)
  };
}

async function testAPIPerformance(): Promise<any> {
  // Simulate API endpoint response
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200)); // 100-300ms
  
  return {
    endpoint: '/api/test',
    method: 'GET',
    statusCode: 200
  };
}

function generatePerformanceSummary(results: any[]): any {
  const total = results.length;
  const passing = results.filter(r => r.withinTarget).length;
  const failing = total - passing;
  
  return {
    total,
    passing,
    failing,
    passRate: Math.round((passing / total) * 100),
    overallStatus: failing === 0 ? 'excellent' : failing <= 1 ? 'good' : 'needs-improvement'
  };
}

function generateRecommendations(results: any[]): string[] {
  const recommendations: string[] = [];
  
  const aiTest = results.find(r => r.name === 'AI Response Time');
  if (aiTest && !aiTest.withinTarget) {
    recommendations.push('Start local LLM server on port 1234 for faster AI responses');
    recommendations.push('Implement request caching for repeated AI queries');
  }
  
  const dbTest = results.find(r => r.name === 'Database Query Time');
  if (dbTest && !dbTest.withinTarget) {
    recommendations.push('Add database indexes for frequently queried fields');
    recommendations.push('Implement query result caching');
    recommendations.push('Use connection pooling for database connections');
  }
  
  const apiTest = results.find(r => r.name === 'API Response Time');
  if (apiTest && !apiTest.withinTarget) {
    recommendations.push('Optimize API endpoint logic');
    recommendations.push('Implement response caching where appropriate');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('All performance targets met! Consider monitoring for regressions.');
  }
  
  return recommendations;
}
