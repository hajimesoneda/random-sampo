import type { Config } from "drizzle-kit"
import dotenv from "dotenv"

// 開発環境の環境変数を読み込み
dotenv.config({ path: ".env.local" })

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config

