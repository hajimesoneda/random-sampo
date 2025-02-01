import { Pool } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"
import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core"

// データベース接続プールの作成
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

// スキーマ定義
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  stationId: text("station_id").notNull(),
  stationName: text("station_name").notNull(),
  date: timestamp("date").notNull(),
  weather: text("weather"),
  memo: text("memo"),
})

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  stationId: text("station_id").notNull(),
  stationName: text("station_name").notNull(),
})

// Drizzle ORM インスタンスの作成
export const db = drizzle(pool)

export { pool }
export { users, visits, favorites }

