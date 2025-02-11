import { pgTable, serial, text, doublePrecision, timestamp, integer } from "drizzle-orm/pg-core"

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

export const stations = pgTable("stations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  lines: text("lines").array().notNull(),
})

