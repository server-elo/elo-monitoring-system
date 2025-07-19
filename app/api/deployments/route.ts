import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/monitoring/simple-logger';

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      contractName, 
      address, 
      chainId, 
      transactionHash, 
      bytecode, 
      abi, 
      constructorArgs: _constructorArgs
    } = await _request.json();

    if (!contractName || !address || !chainId || !transactionHash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // For free tier, we'll just return success
    // In production, you would save to database
    const deployment = {
      id: Date.now().toString(),
      contractName,
      address,
      chainId,
      transactionHash,
      userId: session.user.id,
      createdAt: new Date(),
      // Don't store bytecode and abi for free tier to save space
      hasArtifacts: !!(bytecode && abi),
    };

    return NextResponse.json({ 
      success: true, 
      deployment: {
        id: deployment.id,
        contractName: deployment.contractName,
        address: deployment.address,
        chainId: deployment.chainId,
        transactionHash: deployment.transactionHash,
        createdAt: deployment.createdAt,
      }
    });

  } catch (error) {
    logger.error('Error saving deployment', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For free tier, return empty array
    // In production, you would fetch from database
    return NextResponse.json({ deployments: [] });

  } catch (error) {
    logger.error('Error fetching deployments', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
