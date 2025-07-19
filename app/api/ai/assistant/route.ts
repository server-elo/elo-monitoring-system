import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { LearningAssistant } from '@/lib/ai/LearningAssistant';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/monitoring/simple-logger';

export async function POST(_request: NextRequest) {
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
    } = await _request.json();

    if (!type) {
      return NextResponse.json({ error: 'Request type is required' }, { status: 400 });
    }

    // Get user profile for context
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          include: {
            progress: {
              include: {
                lesson: true,
              },
              orderBy: {
                updatedAt: 'desc',
              },
              take: 5,
            },
          },
        },
      },
    });

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Build learning context
    const context = {
      userLevel: userProfile.skillLevel.toLowerCase() as 'beginner' | 'intermediate' | 'advanced',
      currentLesson: userProfile.user.progress[0]?.lesson?.title,
      recentCode: code,
      recentErrors: error ? [error] : [],
      learningGoals: goals || [],
    };

    // Initialize AI assistant
    const assistant = new LearningAssistant();
    let response;

    // Handle different request types
    switch (type) {
      case 'question':
        if (!question) {
          return NextResponse.json({ error: 'Question is required' }, { status: 400 });
        }
        response = await assistant.askQuestion(question, context);
        break;

      case 'code-review':
        if (!code) {
          return NextResponse.json({ error: 'Code is required for review' }, { status: 400 });
        }
        response = await assistant.reviewCode(code, context);
        break;

      case 'explain-concept':
        if (!concept) {
          return NextResponse.json({ error: 'Concept is required' }, { status: 400 });
        }
        response = await assistant.explainConcept(concept, context);
        break;

      case 'debug':
        if (!code || !error) {
          return NextResponse.json({ error: 'Code and error are required for debugging' }, { status: 400 });
        }
        response = await assistant.debugCode(code, error, context);
        break;

      case 'generate-exercise':
        response = await assistant.generatePersonalizedExercise(context);
        break;

      case 'learning-path':
        if (!currentSkills || !goals) {
          return NextResponse.json({ error: 'Current skills and goals are required' }, { status: 400 });
        }
        response = await assistant.provideLearningPath(currentSkills, goals, timeAvailable || '1 hour per day');
        break;

      default:
        return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    }

    // Log the interaction for analytics
    await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        content: JSON.stringify({
          type,
          question: question || concept || 'AI interaction',
          response: response.message.substring(0, 500), // Truncate for storage
        }),
        type: 'TEXT',
        metadata: {
          aiInteraction: true,
          requestType: type,
        },
      },
    });

    return NextResponse.json({
      success: true,
      response,
    });

  } catch (error) {
    logger.error('AI Assistant error', error as Error);
    return NextResponse.json({ 
      error: 'AI Assistant temporarily unavailable',
      message: 'Please try again later or contact support if the issue persists.'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recent AI interactions
    const recentInteractions = await prisma.chatMessage.findMany({
      where: {
        userId: session.user.id,
        metadata: {
          path: 'aiInteraction',
          equals: true,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    const interactions = recentInteractions.map((interaction: any) => ({
      id: interaction.id,
      content: JSON.parse(interaction.content),
      createdAt: interaction.createdAt,
    }));

    return NextResponse.json({ interactions });

  } catch (error) {
    logger.error('Error fetching AI interactions', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
