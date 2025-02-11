import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/src/db"
import { users } from "@/src/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcrypt"
import type { AuthOptions } from "next-auth"

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("メールアドレスとパスワードを入力してください")
        }

        try {
          const user = await db.select().from(users).where(eq(users.email, credentials.email)).limit(1)

          if (user.length === 0) {
            throw new Error("メールアドレスまたはパスワードが正しくありません")
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user[0].password)

          if (!isPasswordValid) {
            throw new Error("メールアドレスまたはパスワードが正しくありません")
          }

          return {
            id: user[0].id.toString(),
            email: user[0].email,
          }
        } catch (error) {
          console.error("Authentication error:", error)
          throw error
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

