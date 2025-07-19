import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/monitoring/simple-logger';

// Configure for dynamic API routes
export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId, emoji, sessionId } = await _request.json();

    if (!messageId || !emoji || !sessionId) {
      return NextResponse.json({ error: 'Message ID, emoji, and session ID are required' }, { status: 400 });
    }

    // Check if user is participant in the session
    const collaboration = await prisma.collaboration.findFirst({
      where: {
        id: sessionId,
        participants: {
          some: {
            id: session.user.id,
          },
        },
      },
    });

    if (!collaboration) {
      return NextResponse.json({ error: 'Not authorized for this session' }, { status: 403 });
    }

    // For now, we'll store reactions in a simple way
    // In a real implementation, you'd have a MessageReaction model
    logger.info(`User ${session.user.id} reacted with ${emoji} to message ${messageId} in session ${sessionId}`);

    // TODO: Implement actual message reaction storage
    // const existingReaction = await prisma.messageReaction.findFirst({
    //   where: {
    //     messageId,
    //     userId: session.user.id,
    //     emoji,
    //   },
    // });

    // if (existingReaction) {
    //   // Remove reaction
    //   await prisma.messageReaction.delete({
    //     where: { id: existingReaction.id },
    //   });
    // } else {
    //   // Add reaction
    //   await prisma.messageReaction.create({
    //     data: {
    //       messageId,
    //       userId: session.user.id,
    //       emoji,
    //     },
    //   });
    // }

    return NextResponse.json({ 
      success: true, 
      message: 'Reaction updated successfully' 
    });
  } catch (error) {
    logger.error('Error updating reaction', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(_request.url);
    const messageId = searchParams.get('messageId');
    const sessionId = searchParams.get('sessionId');

    if (!messageId || !sessionId) {
      return NextResponse.json({ error: 'Message ID and session ID are required' }, { status: 400 });
    }

    // Check if user is participant in the session
    const collaboration = await prisma.collaboration.findFirst({
      where: {
        id: sessionId,
        participants: {
          some: {
            id: session.user.id,
          },
        },
      },
    });

    if (!collaboration) {
      return NextResponse.json({ error: 'Not authorized for this session' }, { status: 403 });
    }

    // TODO: Implement actual message reaction retrieval
    // const reactions = await prisma.messageReaction.findMany({
    //   where: { messageId },
    //   include: {
    //     user: {
    //       select: {
    //         id: true,
    //         name: true,
    //         image: true,
    //       },
    //     },
    //   },
    // });

    // For now, return empty reactions
    const reactions: any[] = [];

    return NextResponse.json({ reactions });
  } catch (error) {
    logger.error('Error fetching reactions', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
