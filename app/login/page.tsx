"use client"

import { useState, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get("callbackUrl") || "/"
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl)
    }
  }, [status, router, callbackUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        setError(result.error)
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("ログインに失敗しました。再度お試しください。")
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (status === "authenticated") {
    return null
  }

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">ログイン</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            アカウントをお持ちでないですか？{" "}
            <Link href="/register" className="text-primary hover:underline">
              新規登録
            </Link>
          </p>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              アカウントがなくても使用できます。{" "}
              <Link href="/" className="text-primary hover:underline">
                ゲストとして使用
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

