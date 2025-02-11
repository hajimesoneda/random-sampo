import { db } from "../src/db"
import { sql } from "drizzle-orm"
import { visits, favorites, users } from "../src/db/schema"

async function main() {
  console.log("Setting up database...")

  // Create tables
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ${users} (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ${visits} (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES ${users}(id),
      station_id TEXT NOT NULL,
      station_name TEXT NOT NULL,
      date TIMESTAMP WITH TIME ZONE NOT NULL,
      weather TEXT,
      memo TEXT
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ${favorites} (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES ${users}(id),
      station_id TEXT NOT NULL,
      station_name TEXT NOT NULL
    )
  `)

  console.log("Database setup complete!")
}

main().catch((err) => {
  console.error("Error setting up database:", err)
  process.exit(1)
})

