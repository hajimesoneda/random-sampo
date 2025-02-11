import { NextResponse } from "next/server"
import { db } from "@/src/db"
import { users } from "@/src/db/schema"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "メールアドレスとパスワードを入力してください" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1)

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "このメールアドレスは既に登録されています" }, { status: 400 })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create user
    const result = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
      })
      .returning()

    // Return success without password
    const { password: _, ...userWithoutPassword } = result[0]
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "ユーザー登録に失敗しました" }, { status: 500 })
  }
}

