'use client'
import { ReactElement, ReactNode, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
interface ProtectedRouteProps {
  children: ReactNode
  requireAuth?: boolean
  requireRole?: string[]
  fallbackUrl?: string
}
export function ProtectedRoute({
  children,
  requireAuth = true,
  requireRole,
  fallbackUrl = '/auth/login',
}: ProtectedRouteProps): ReactElement {
  const { data: session, status } = useSession()
  const router = useRouter()
  useEffect(() => {
    if (status === 'loading') return
    if (requireAuth && !session) {
      router.push(fallbackUrl)
      return
    }
    if (requireRole && session?.user?.role) {
      if (!requireRole.includes(session.user.role)) {
        router.push('/unauthorized')
        return
      }
    }
  }, [session, status, requireAuth, requireRole, router, fallbackUrl])
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <LoadingSpinner className="w-12 h-12 mb-4" />
          <p className="text-gray-400">Loading...</p>
        </motion.div>
      </div>
    )
  }
  if (requireAuth && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-gray-400">Redirecting to login...</p>
        </motion.div>
      </div>
    )
  }
  if (
    requireRole &&
    session?.user?.role &&
    !requireRole.includes(session.user.role)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-2">Unauthorized</h2>
          <p className="text-gray-400">
            You don't have permission to access this page.
          </p>
        </motion.div>
      </div>
    )
  }
  return <>{children}</>
}
