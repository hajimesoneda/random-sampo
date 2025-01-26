import type { User, UserWithoutPassword } from "@/types/user"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

// This is a simple in-memory database. Replace this with a real database in production.
const users: User[] = []

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function registerUser(email: string, password: string): Promise<UserWithoutPassword | null> {
  const existingUser = users.find((user) => user.email === email)
  if (existingUser) {
    return null
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const newUser: User = {
    id: Date.now().toString(),
    email,
    password: hashedPassword,
  }

  users.push(newUser)

  return { id: newUser.id, email: newUser.email }
}

export async function loginUser(email: string, password: string): Promise<string | null> {
  const user = users.find((user) => user.email === email)
  if (!user) {
    return null
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    return null
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" })
  return token
}

export function getUserFromToken(token: string): UserWithoutPassword | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const user = users.find((user) => user.id === decoded.userId)
    if (!user) {
      return null
    }
    return { id: user.id, email: user.email }
  } catch (error) {
    return null
  }
}

