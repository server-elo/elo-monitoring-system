'use client'

import { ReactNode, ReactElement } from 'react'
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

interface SessionProviderProps {
  children: ReactNode
  session?: any
}

export function SessionProvider({
  children,
  session
}: SessionProviderProps): ReactElement {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}