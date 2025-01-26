"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ConfirmRegistration() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const registrationData = sessionStorage.getItem("registrationData")
    if (registrationData) {
      const { email } = JSON.parse(registrationData)
      setEmail(email)
    } else {
      router.push("/register")
    }
  }, [router])

  const handleConfirm = async () => {
    const registrationData = sessionStorage.getItem("registrationData")
    if (!registrationData) {
      setError("登録情報が見つかりません")
      return
    }

    const { email, password } = JSON.parse(registrationData)

    try {
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (registerResponse.ok) {
        // Registration successful, now log in
        const loginResponse = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })

        if (loginResponse.ok) {
          const { token } = await loginResponse.json()
          localStorage.setItem("token", token)
          sessionStorage.removeItem("registrationData")
          router.push("/")
        } else {
          setError("ログインに失敗しました")
        }
      } else {
        const errorData = await registerResponse.json()
        setError(errorData.error || "登録に失敗しました")
      }
    } catch (error) {
      console.error("Registration error:", error)
      setError("ネットワークエラーが発生しました。再度お試しください。")
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>登録確認</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">以下のメールアドレスで登録を行います：</p>
          <p className="font-bold mb-4">{email}</p>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/register")}>
              戻る
            </Button>
            <Button onClick={handleConfirm}>登録する</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

