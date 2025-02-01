import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core"

// ユーザーテーブル
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// 訪問履歴テーブル
export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  stationId: text("station_id").notNull(),
  stationName: text("station_name").notNull(),
  date: timestamp("date").notNull(),
  weather: text("weather"),
  memo: text("memo"),
})

// お気に入り駅テーブル
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  stationId: text("station_id").notNull(),
  stationName: text("station_name").notNull(),
})

