"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem("token", data.token)
        router.push("/")
      } else {
        let errorMessage
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || "ログインに失敗しました"
        } catch (jsonError) {
          // If the response is not JSON, use the status text
          errorMessage = `ログインに失敗しました: ${response.statusText}`
        }
        setError(errorMessage)
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("ネットワークエラーが発生しました。再度お試しください。")
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>ログイン</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500">{error}</p>}
            <Button type="submit" className="w-full">
              ログイン
            </Button>
          </form>
          <p className="mt-4 text-center">
            アカウントをお持ちでないですか？{" "}
            <Link href="/register" className="text-blue-500 hover:underline">
              新規登録
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

