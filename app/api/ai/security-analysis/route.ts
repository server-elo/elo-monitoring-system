// Enhanced Security Analysis API
// Provides real-time smart contract security analysis with AI
// Features: Rate limiting, caching, response streaming, performance optimization

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { enhancedTutor } from '@/lib/ai/EnhancedTutorSystem';
import { prisma } from '@/lib/prisma';
// ;
import { logger } from '@/lib/monitoring/simple-logger';
import { withRateLimit, getClientIP } from '@/lib/utils/rateLimiter';
import {
  getCached,
  setCached,
  cacheKeys,
  generateHash,
  cacheConfigs,
  StreamingResponse
} from '@/lib/utils/cache';

// Enhanced POST handler with rate limiting and caching
async function handleSecurityAnalysis(request: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, cacheResults = true, streaming = false } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    if (code.length > 50000) {
      return NextResponse.json({
        error: 'Code too large. Maximum 50,000 characters allowed.'
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check user tier for rate limiting
    // const userTier = getUserTier(user);
    // getClientIP(request); // Available for future use

    // Apply rate limiting based on user tier
    // const rateLimitConfig = userTier === 'premium' ? 'premium' : 'free';
    // Note: Rate limiting is applied via middleware wrapper

    // Generate hash for caching
    const codeHash = generateHash(code);
    const cacheKey = cacheKeys.securityAnalysis(codeHash, user.id);

    // Check cache first (faster than database)
    if (cacheResults) {
      const cachedAnalysis = await getCached(cacheKey, cacheConfigs.security);
      if (cachedAnalysis) {
        logger.info(`🎯 Cache hit for security analysis: ${cacheKey}`);
        return NextResponse.json({
          success: true,
          data: {
            ...cachedAnalysis,
            cached: true,
            cacheHit: true,
            responseTime: Date.now() - startTime
          },
          headers: {
            'X-Cache': 'HIT',
            'X-Response-Time': `${Date.now() - startTime}ms`
          }
        });
      }

      // Fallback to database cache
      const existingAnalysis = await prisma.securityAnalysis.findFirst({
        where: {
          userId: user.id,
          codeHash,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
          }
        }
      });

      if (existingAnalysis) {
        const analysisData = {
          vulnerabilities: existingAnalysis.vulnerabilities,
          gasOptimizations: existingAnalysis.gasOptimizations,
          bestPractices: existingAnalysis.bestPractices,
          overallScore: existingAnalysis.overallScore,
          analysisTime: existingAnalysis.analysisTime
        };

        // Cache the database result for faster future access
        await setCached(cacheKey, analysisData, cacheConfigs.security);

        return NextResponse.json({
          success: true,
          data: {
            ...analysisData,
            cached: true,
            dbCacheHit: true,
            responseTime: Date.now() - startTime
          }
        });
      }
    }

    // Handle streaming response
    if (streaming) {
      return handleStreamingAnalysis(code, user.id, cacheKey, cacheResults);
    }

    // Perform AI security analysis
    const analysisStartTime = Date.now();
    logger.info(`🔍 Starting security analysis for user ${user.id}`);

    const analysis = await enhancedTutor.analyzeCodeSecurity(code, user.id);
    const analysisTime = Date.now() - analysisStartTime;

    const responseData = {
      vulnerabilities: analysis.vulnerabilities,
      gasOptimizations: analysis.gasOptimizations,
      bestPractices: analysis.bestPractices,
      overallScore: analysis.overallScore,
      analysisTime,
      aiModel: 'Enhanced-Tutor',
      systemHealth: enhancedTutor.getSystemHealth()
    };

    // Cache the result for faster future access
    if (cacheResults) {
      await Promise.all([
        // Cache in memory for fast access
        setCached(cacheKey, responseData, cacheConfigs.security),

        // Save to database for persistence
        prisma.securityAnalysis.create({
          data: {
            userId: user.id,
            codeHash,
            code: code.substring(0, 10000), // Limit stored code size
            vulnerabilities: analysis.vulnerabilities,
            gasOptimizations: analysis.gasOptimizations,
            bestPractices: analysis.bestPractices,
            overallScore: analysis.overallScore,
            aiModel: 'Enhanced-Tutor',
            analysisTime
          }
        })
      ]);
    }

    const totalResponseTime = Date.now() - startTime;
    logger.info(`✅ Security analysis completed in ${totalResponseTime}ms`);

    return NextResponse.json({
      success: true,
      data: {
        ...responseData,
        cached: false,
        responseTime: totalResponseTime
      }
    }, {
      headers: {
        'X-Cache': 'MISS',
        'X-Response-Time': `${totalResponseTime}ms`,
        'X-Analysis-Time': `${analysisTime}ms`
      }
    });

  } catch (error) {
    logger.error('Security analysis error', error as Error);
    const errorResponse = {
      error: 'Failed to analyze code security',
      details: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    };

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'X-Error': 'true',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
  }
}

// Streaming analysis handler
async function handleStreamingAnalysis(
  code: string,
  userId: string,
  cacheKey: string,
  cacheResults: boolean
): Promise<Response> {
  const stream = new StreamingResponse();
  const readableStream = stream.createStream();

  // Start analysis in background
  (async () => {
    try {
      stream.sendEvent('status', { message: 'Starting security analysis...', progress: 0 });

      stream.sendEvent('status', { message: 'Analyzing code structure...', progress: 25 });

      const analysis = await enhancedTutor.analyzeCodeSecurity(code, userId);

      stream.sendEvent('status', { message: 'Processing vulnerabilities...', progress: 50 });

      stream.sendEvent('vulnerabilities', {
        data: analysis.vulnerabilities,
        progress: 75
      });

      stream.sendEvent('gasOptimizations', {
        data: analysis.gasOptimizations,
        progress: 85
      });

      stream.sendEvent('bestPractices', {
        data: analysis.bestPractices,
        progress: 95
      });

      const finalResult = {
        vulnerabilities: analysis.vulnerabilities,
        gasOptimizations: analysis.gasOptimizations,
        bestPractices: analysis.bestPractices,
        overallScore: analysis.overallScore,
        cached: false,
        streaming: true
      };

      // Cache the result
      if (cacheResults) {
        await setCached(cacheKey, finalResult, cacheConfigs.security);
      }

      stream.sendEvent('complete', {
        data: finalResult,
        progress: 100
      });

    } catch (error) {
      stream.sendEvent('error', {
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      stream.close();
    }
  })();

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Streaming': 'true'
    }
  });
}

// Apply rate limiting to POST handler
export const POST = withRateLimit(
  async (request: Request) => {
    const nextRequest = request as NextRequest;
    return handleSecurityAnalysis(nextRequest);
  },
  'analysis',
  (request: Request) => {
    // Use IP + user agent for anonymous users, user ID for authenticated users
    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    return `${ip}:${userAgent}`;
  }
);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('id');
    const limit = parseInt(searchParams.get('limit') || '10');

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (analysisId) {
      // Get specific analysis
      const analysis = await prisma.securityAnalysis.findFirst({
        where: {
          id: analysisId,
          userId: user.id
        }
      });

      if (!analysis) {
        return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: analysis });
    } else {
      // Get user's recent analyses
      const analyses = await prisma.securityAnalysis.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          codeHash: true,
          overallScore: true,
          analysisTime: true,
          aiModel: true,
          createdAt: true,
          vulnerabilities: true,
          gasOptimizations: true,
          bestPractices: true
        }
      });

      // Calculate statistics
      const stats = {
        totalAnalyses: analyses.length,
        averageScore: analyses.length > 0 
          ? analyses.reduce((sum: number, a: any) => sum + a.overallScore, 0) / analyses.length 
          : 0,
        averageAnalysisTime: analyses.length > 0
          ? analyses.reduce((sum: number, a: any) => sum + a.analysisTime, 0) / analyses.length
          : 0,
        recentTrend: analyses.slice(0, 5).map((a: any) => a.overallScore)
      };

      return NextResponse.json({ 
        success: true, 
        data: {
          analyses,
          stats
        }
      });
    }

  } catch (error) {
    logger.error('Get security analysis error', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch security analyses' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (deleteAll) {
      // Delete all user's analyses
      await prisma.securityAnalysis.deleteMany({
        where: { userId: user.id }
      });
    } else if (analysisId) {
      // Delete specific analysis
      await prisma.securityAnalysis.delete({
        where: {
          id: analysisId,
          userId: user.id
        }
      });
    } else {
      return NextResponse.json({ error: 'Analysis ID required' }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Delete security analysis error', error as Error);
    return NextResponse.json(
      { error: 'Failed to delete security analysis' }, 
      { status: 500 }
    );
  }
}

// Batch analysis endpoint for multiple code snippets
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { codeSnippets } = body; // Array of code strings

    if (!Array.isArray(codeSnippets) || codeSnippets.length === 0) {
      return NextResponse.json({ error: 'Code snippets array is required' }, { status: 400 });
    }

    if (codeSnippets.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 code snippets allowed' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Analyze each code snippet
    const results = [];
    for (const code of codeSnippets) {
      try {
        const analysis = await enhancedTutor.analyzeCodeSecurity(code, user.id);
        results.push({
          code: code.substring(0, 100) + '...', // Truncated for response
          analysis,
          success: true
        });
      } catch (_error) {
        results.push({
          code: code.substring(0, 100) + '...',
          error: 'Analysis failed',
          success: false
        });
      }
    }

    // Calculate batch statistics
    const successfulAnalyses = results.filter(r => r.success);
    const batchStats = {
      totalSnippets: codeSnippets.length,
      successfulAnalyses: successfulAnalyses.length,
      averageScore: successfulAnalyses.length > 0
        ? successfulAnalyses.reduce((sum, r) => sum + (r.analysis?.overallScore || 0), 0) / successfulAnalyses.length
        : 0,
      commonVulnerabilities: [], // Could be calculated from all analyses
      overallRecommendations: [
        'Review security patterns',
        'Implement access controls',
        'Optimize gas usage',
        'Add comprehensive tests'
      ]
    };

    return NextResponse.json({
      success: true,
      data: {
        results,
        batchStats
      }
    });

  } catch (error) {
    logger.error('Batch security analysis error', error as Error);
    return NextResponse.json(
      { error: 'Failed to perform batch analysis' }, 
      { status: 500 }
    );
  }
}
