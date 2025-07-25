"use client"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import type { ReactNode } from "react"

interface ClientSessionProviderProps {
  children: ReactNode
  session: Session | null
}

export default function ClientSessionProvider({ children, session }: ClientSessionProviderProps) {
  return (
    <SessionProvider session={session} refetchInterval={0}>
      {children}
    </SessionProvider>
  )
}

