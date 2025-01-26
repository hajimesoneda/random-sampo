import { NextResponse } from "next/server"
import { registerUser } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "メールアドレスとパスワードは必須です" }, { status: 400 })
    }

    const user = await registerUser(email, password)

    if (!user) {
      return NextResponse.json({ error: "このメールアドレスは既に使用されています" }, { status: 409 })
    }

    return NextResponse.json({ message: "ユーザー登録が完了しました" })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 })
  }
}

