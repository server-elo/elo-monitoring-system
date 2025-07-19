import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { LearningAssistant } from '@/lib/ai/LearningAssistant';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/monitoring/simple-logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      type, 
      question, 
      code, 
      error, 
      concept,
      currentSkills,
      goals,
      timeAvailable 
    } = await request.json();

    if (!type) {
      return NextResponse.json({ error: 'Request type is required' }, { status: 400 });
    }

    // Initialize AI assistant
    const assistant = new LearningAssistant();

    let response;
    
    switch (type) {
      case 'help':
        response = await assistant.provideHelp({
          question,
          code,
          error,
          userId: session.user.id
        });
        break;
        
      case 'explain':
        response = await assistant.explainConcept({
          concept,
          userLevel: await getUserLevel(session.user.id),
          userId: session.user.id
        });
        break;
        
      case 'suggest':
        response = await assistant.suggestNext({
          currentSkills,
          goals,
          timeAvailable,
          userId: session.user.id
        });
        break;
        
      case 'optimize':
        if (!code) {
          return NextResponse.json({ error: 'Code is required for optimization' }, { status: 400 });
        }
        response = await assistant.optimizeCode({
          code,
          userId: session.user.id
        });
        break;
        
      case 'security':
        if (!code) {
          return NextResponse.json({ error: 'Code is required for security analysis' }, { status: 400 });
        }
        response = await assistant.analyzeSecurityVulnerabilities({
          code,
          userId: session.user.id
        });
        break;
        
      case 'debug':
        if (!code || !error) {
          return NextResponse.json({ error: 'Code and error are required for debugging' }, { status: 400 });
        }
        response = await assistant.debugCode({
          code,
          error,
          userId: session.user.id
        });
        break;
        
      case 'personalized':
        response = await assistant.getPersonalizedAdvice({
          userId: session.user.id,
          context: { question, code, error }
        });
        break;
        
      case 'gas_optimization':
        if (!code) {
          return NextResponse.json({ error: 'Code is required for gas optimization' }, { status: 400 });
        }
        response = await assistant.optimizeGas({
          code,
          userId: session.user.id
        });
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    }

    // Log the interaction for analytics
    await logInteraction(session.user.id, type, { question, concept, code });

    return NextResponse.json({ 
      success: true,
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in AI assistant', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's AI interaction history
    const interactions = await prisma.aiInteraction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        type: true,
        request: true,
        response: true,
        createdAt: true,
        helpful: true
      }
    });

    return NextResponse.json({ 
      interactions,
      count: interactions.length
    });

  } catch (error) {
    logger.error('Error fetching AI interactions', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to get user's current level
async function getUserLevel(userId: string): Promise<string> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { skillLevel: true }
  });
  
  return profile?.skillLevel || 'beginner';
}

// Helper function to log AI interactions
async function logInteraction(
  userId: string, 
  type: string, 
  request: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.aiInteraction.create({
      data: {
        userId,
        type,
        request,
        response: {},
        helpful: null
      }
    });
  } catch (error) {
    logger.error('Error logging AI interaction', error as Error);
  }
}