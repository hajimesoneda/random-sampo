import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { getServerSession } from "next-auth/next"
import { authOptions } from "./api/auth/[...nextauth]/auth-options"
import ClientSessionProvider from "./components/ClientSessionProvider"
import type React from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ランダム駅ピッカー",
  description: "東京の駅をランダムに選んで新しい場所を発見するアプリ",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="ja">
      <body className={inter.className}>
        <ClientSessionProvider session={session}>{children}</ClientSessionProvider>
      </body>
    </html>
  )
}

