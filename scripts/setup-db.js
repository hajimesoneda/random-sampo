import { db } from "../src/db/index.js"

async function setupDatabase() {
  try {
    console.log("Setting up database...")

    // Create users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("Users table created or already exists")

    // Create visits table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS visits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        station_id TEXT NOT NULL,
        station_name TEXT NOT NULL,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        weather TEXT,
        memo TEXT
      )
    `)
    console.log("Visits table created or already exists")

    // Create favorites table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        station_id TEXT NOT NULL,
        station_name TEXT NOT NULL
      )
    `)
    console.log("Favorites table created or already exists")

    console.log("Database setup completed successfully!")
  } catch (error) {
    console.error("Error setting up database:", error)
    throw error
  }
}

setupDatabase()

