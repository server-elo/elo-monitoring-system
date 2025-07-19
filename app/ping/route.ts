import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple ping endpoint for health monitoring and connectivity checks
 * 
 * This endpoint provides a lightweight way to check if the server is responding.
 * It's used by:
 * - OfflineManager for connectivity detection
 * - External monitoring services
 * - Load balancers for health checks
 * - Uptime monitoring tools
 */

// Configure for dynamic API routes
export const dynamic = 'force-dynamic';

/**
 * GET /ping - Simple ping endpoint
 * Returns a basic response to indicate server is alive
 */
export async function GET(_request: NextRequest) {
  const timestamp = new Date().toISOString();
  const uptime = process.uptime();
  
  return NextResponse.json({
    status: 'ok',
    message: 'pong',
    timestamp,
    uptime: Math.floor(uptime),
    server: 'Solidity Learning Platform',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Ping-Response': 'pong',
      'X-Server-Time': timestamp,
    },
  });
}

/**
 * HEAD /ping - Lightweight ping check
 * Returns only headers without body for minimal overhead
 */
export async function HEAD(_request: NextRequest) {
  const timestamp = new Date().toISOString();
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Ping-Response': 'pong',
      'X-Server-Time': timestamp,
      'X-Server-Status': 'ok',
    },
  });
}

/**
 * POST /ping - Echo endpoint for testing
 * Returns the request data back for testing purposes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const timestamp = new Date().toISOString();
    
    return NextResponse.json({
      status: 'ok',
      message: 'pong',
      timestamp,
      echo: body,
      headers: Object.fromEntries(request.headers.entries()),
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Ping-Response': 'pong',
        'X-Server-Time': timestamp,
      },
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'ping failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, {
      status: 500,
      headers: {
        'X-Ping-Response': 'error',
        'X-Server-Time': new Date().toISOString(),
      },
    });
  }
}
