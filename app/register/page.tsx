"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("有効なメールアドレスを入力してください")
      return
    }

    // Basic password validation (at least 8 characters)
    if (password.length < 8) {
      setError("パスワードは8文字以上である必要があります")
      return
    }

    // Store form data in sessionStorage
    sessionStorage.setItem("registrationData", JSON.stringify({ email, password }))

    // Redirect to confirmation page
    router.push("/register/confirm")
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>新規登録</CardTitle>
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
              確認画面へ
            </Button>
          </form>
          <p className="mt-4 text-center">
            既にアカウントをお持ちですか？{" "}
            <Link href="/login" className="text-blue-500 hover:underline">
              ログイン
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

