// Enhanced AI Tutor API Endpoint
// Provides context-aware AI tutoring with local LLM integration

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { enhancedTutor } from '@/lib/ai/EnhancedTutorSystem';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/monitoring/simple-logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      action, 
      prompt, 
      concept, 
      code, 
      description, 
      requirements,
      topic 
    } = body;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true,
        progress: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Log AI interaction
    const sessionId = `session_${Date.now()}_${user.id}`;
    
    let response;
    let requestType = 'explanation';

    switch (action) {
      case 'explain':
        requestType = 'explanation';
        response = await enhancedTutor.explainConcept(concept, user.id);
        break;

      case 'analyze-code':
        requestType = 'analysis';
        response = await enhancedTutor.analyzeCodeSecurity(code, user.id);
        break;

      case 'generate-contract':
        requestType = 'code';
        response = await enhancedTutor.generateSmartContract(
          description, 
          requirements || [], 
          user.id
        );
        break;

      case 'generate-challenge':
        requestType = 'code';
        response = await enhancedTutor.generatePersonalizedChallenge(user.id, topic);
        break;

      case 'adaptive-path':
        requestType = 'explanation';
        response = await enhancedTutor.generateAdaptiveLearningPath(user.id);
        break;

      case 'multi-modal':
        requestType = 'explanation';
        response = await enhancedTutor.generateMultiModalExplanation(concept, user.id);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Log the interaction
    await prisma.aIInteraction.create({
      data: {
        userId: user.id,
        sessionId,
        requestType,
        prompt: prompt || concept || description || topic || '',
        response: JSON.stringify(response),
        aiModel: (response as any).model || 'Enhanced-Tutor',
        responseTime: (response as any).responseTime || 0,
        confidence: (response as any).confidence || 0.8,
        contextUsed: {
          skillLevel: user.profile?.skillLevel || 'BEGINNER',
          currentLevel: user.profile?.currentLevel || 1,
          totalXP: user.profile?.totalXP || 0
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: response,
      metadata: {
        sessionId,
        requestType,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Enhanced tutor API error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    switch (action) {
      case 'context':
        const context = await enhancedTutor.getUserContext(user.id);
        return NextResponse.json({ success: true, data: context });

      case 'analytics':
        const analytics = await enhancedTutor.getLearningAnalytics(user.id);
        return NextResponse.json({ success: true, data: analytics });

      case 'performance':
        const performance = enhancedTutor.getPerformanceMetrics();
        return NextResponse.json({ success: true, data: performance });

      case 'interactions':
        const interactions = await prisma.aIInteraction.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 10
        });
        return NextResponse.json({ success: true, data: interactions });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error('Enhanced tutor GET API error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contextUpdates, feedback } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (contextUpdates) {
      await enhancedTutor.updateUserContext(user.id, contextUpdates);
    }

    if (feedback) {
      // Update AI interaction with user feedback
      await prisma.aIInteraction.updateMany({
        where: {
          userId: user.id,
          id: feedback.interactionId
        },
        data: {
          wasHelpful: feedback.wasHelpful
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Enhanced tutor PUT API error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
