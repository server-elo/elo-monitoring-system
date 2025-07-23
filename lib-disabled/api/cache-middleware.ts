import { NextRequest, NextResponse } from 'next/server'
import { getCacheHeaders } from '@/lib/cache/cache-config'
interface CacheOptions {
  maxAge?: number
  sMaxAge?: number
  staleWhileRevalidate?: number
  public?: boolean
  private?: boolean
}
export function withCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: CacheOptions = {},
) {
  return async (req: NextRequest) => {
    const response = await handler(req)
    // Build cache control header
    const cacheDirectives: string[] = []
    if (options.public) {
      cacheDirectives.push('public')
    } else if (options.private) {
      cacheDirectives.push('private')
    }
    if (options.maxAge !== undefined) {
      cacheDirectives.push(`max-age=${options.maxAge}`)
    }
    if (options.sMaxAge !== undefined) {
      cacheDirectives.push(`s-maxage=${options.sMaxAge}`)
    }
    if (options.staleWhileRevalidate !== undefined) {
      cacheDirectives.push(
        `stale-while-revalidate=${options.staleWhileRevalidate}`,
      )
    }
    if (cacheDirectives.length > 0) {
      response.headers.set('Cache-Control', cacheDirectives.join(', '))
    }
    // Add ETag for conditional requests
    const content = await response.text()
    const etag = `"${Buffer.from(content).toString('base64').substring(0, 27)}"`
    response.headers.set('ETag', etag)
    // Check if-none-match header
    const ifNoneMatch = req.headers.get('if-none-match')
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 })
    }
    return response
  }
}
// API route cache wrapper
export function cachedApiRoute(
  handler: (req: NextRequest) => Promise<NextResponse>,
  cacheType:
    | 'user'
    | 'courses'
    | 'lessons'
    | 'achievements'
    | 'leaderboard' = 'user',
) {
  const cacheHeaders = getCacheHeaders(cacheType)
  const maxAge = parseInt(
    cacheHeaders['Cache-Control'].match(/max-age=(\d+)/)?.[1] || '300',
  )
  return withCache(handler, {
    public: true,
    maxAge,
    sMaxAge: maxAge,
    staleWhileRevalidate: maxAge * 2,
  })
}
