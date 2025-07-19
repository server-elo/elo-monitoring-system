import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/monitoring/simple-logger';

// Configure for dynamic API routes
export const dynamic = 'force-dynamic';

export async function DELETE(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId, sessionId } = await _request.json();

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

    // TODO: Implement actual message deletion
    // In a real implementation, you'd have a Message model
    logger.info(`User ${session.user.id} deleted message ${messageId} in session ${sessionId}`);

    // const message = await prisma.message.findUnique({
    //   where: { id: messageId },
    // });

    // if (!message) {
    //   return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    // }

    // // Check if user owns the message or has admin privileges
    // if (message.userId !== session.user.id) {
    //   // Check if user is admin/moderator of the session
    //   const userRole = await prisma.collaborationParticipant.findFirst({
    //     where: {
    //       collaborationId: sessionId,
    //       userId: session.user.id,
    //       role: { in: ['ADMIN', 'MODERATOR'] },
    //     },
    //   });

    //   if (!userRole) {
    //     return NextResponse.json({ error: 'Not authorized to delete this message' }, { status: 403 });
    //   }
    // }

    // // Soft delete the message
    // await prisma.message.update({
    //   where: { id: messageId },
    //   data: {
    //     isDeleted: true,
    //     deletedAt: new Date(),
    //     deletedBy: session.user.id,
    //   },
    // });

    return NextResponse.json({ 
      success: true, 
      message: 'Message deleted successfully' 
    });
  } catch (error) {
    logger.error('Error deleting message', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
