'use client'
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
interface SessionProviderProps {
  children: ReactNode
  session?: unknown
}
export function SessionProvider({
  children,
  session,
}: SessionProviderProps): void {
  return (
    <NextAuthSessionProvider
      session={session}
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true}
    >
      {children}
    </NextAuthSessionProvider>
  )
}
